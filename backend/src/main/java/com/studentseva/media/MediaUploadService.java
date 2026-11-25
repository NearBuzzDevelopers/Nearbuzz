package com.studentseva.media;

import com.studentseva.businesses.BusinessPhotoService;
import com.studentseva.businesses.BusinessService;
import com.studentseva.businesses.dto.AddBusinessPhotoRequest;
import com.studentseva.businesses.dto.BusinessPhotoResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.UUID;

/**
 * Validates multipart image uploads, persists binary data via StorageService,
 * and saves corresponding BusinessPhoto metadata.
 */
@Service
public class MediaUploadService {

    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024; // 5 MB
    private static final Map<String, String> ALLOWED_CONTENT_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/jpg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private final StorageService storageService;
    private final BusinessService businessService;
    private final BusinessPhotoService photoService;

    public MediaUploadService(
            StorageService storageService,
            BusinessService businessService,
            BusinessPhotoService photoService
    ) {
        this.storageService = storageService;
        this.businessService = businessService;
        this.photoService = photoService;
    }

    /**
     * Validates ownership, gallery quota, MIME type, and file size before storing
     * the uploaded image and recording its metadata.
     */
    public BusinessPhotoResponse uploadBusinessPhoto(
            UUID businessId,
            MultipartFile file,
            String caption,
            Integer sortOrder,
            String userEmail
    ) {
        // 1. Verify ownership and gallery quota BEFORE storing any binary data
        businessService.getOwnedBusiness(businessId, userEmail);
        photoService.ensureWithinPhotoLimit(businessId);

        // 2. Validate file presence, size, and MIME type
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file must not be empty.");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("Image size exceeds the 5 MB limit.");
        }
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        String extension = ALLOWED_CONTENT_TYPES.get(contentType);
        if (extension == null) {
            throw new IllegalArgumentException("Only JPEG, PNG, and WEBP images are supported.");
        }

        // 3. Build collision-proof object key without trusting client filename
        String storageKey = "businesses/" + businessId + "/" + UUID.randomUUID() + extension;

        StorageService.StoredObject stored;
        try (InputStream in = file.getInputStream()) {
            stored = storageService.store(storageKey, in, file.getSize(), contentType);
        } catch (IOException ex) {
            throw new RuntimeException("Failed to read uploaded image stream", ex);
        }

        // 4. Persist metadata; clean up stored object if database write fails
        try {
            return photoService.addPhoto(
                    businessId,
                    new AddBusinessPhotoRequest(stored.storageKey(), stored.publicUrl(), caption, sortOrder),
                    userEmail
            );
        } catch (RuntimeException ex) {
            storageService.delete(stored.storageKey());
            throw ex;
        }
    }

    public String getActiveStorageBackend() {
        return storageService.getBackendName();
    }
}
