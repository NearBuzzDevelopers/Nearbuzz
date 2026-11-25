package com.studentseva.businesses;

import com.studentseva.businesses.dto.AddBusinessPhotoRequest;
import com.studentseva.businesses.dto.BusinessPhotoResponse;
import com.studentseva.common.exceptions.NotFoundException;
import com.studentseva.media.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service managing business gallery photo metadata (up to 10 photos per listing).
 */
@Service
public class BusinessPhotoService {

    private static final int MAX_PHOTOS_PER_BUSINESS = 10;

    private final BusinessPhotoRepository photoRepository;
    private final BusinessRepository businessRepository;
    private final BusinessService businessService;
    private final StorageService storageService;

    public BusinessPhotoService(
            BusinessPhotoRepository photoRepository,
            BusinessRepository businessRepository,
            BusinessService businessService,
            StorageService storageService
    ) {
        this.photoRepository = photoRepository;
        this.businessRepository = businessRepository;
        this.businessService = businessService;
        this.storageService = storageService;
    }

    /**
     * Checks whether the business still has room under the gallery limit.
     */
    @Transactional(readOnly = true)
    public void ensureWithinPhotoLimit(UUID businessId) {
        if (photoRepository.countByBusinessId(businessId) >= MAX_PHOTOS_PER_BUSINESS) {
            throw new IllegalArgumentException(
                    "Maximum of " + MAX_PHOTOS_PER_BUSINESS + " photos allowed per business.");
        }
    }

    /**
     * Adds photo metadata to a business gallery after verifying vendor ownership.
     */
    @Transactional
    public BusinessPhotoResponse addPhoto(UUID businessId, AddBusinessPhotoRequest request, String userEmail) {
        Business business = businessService.getOwnedBusiness(businessId, userEmail);

        long currentCount = photoRepository.countByBusinessId(businessId);
        if (currentCount >= MAX_PHOTOS_PER_BUSINESS) {
            throw new IllegalArgumentException(
                    "Maximum of " + MAX_PHOTOS_PER_BUSINESS + " photos allowed per business.");
        }

        BusinessPhoto photo = new BusinessPhoto();
        photo.setBusiness(business);
        photo.setStorageKey(request.storageKey().trim());
        photo.setPublicUrl(request.publicUrl().trim());
        photo.setCaption(request.caption() != null ? request.caption().trim() : null);
        photo.setSortOrder(request.sortOrder() != null ? request.sortOrder() : (int) currentCount);

        BusinessPhoto saved = photoRepository.saveAndFlush(photo);
        return toPhotoResponse(saved);
    }

    /**
     * Lists all gallery photos for a business sorted by sortOrder then creation time.
     */
    @Transactional(readOnly = true)
    public List<BusinessPhotoResponse> getPhotos(UUID businessId) {
        if (!businessRepository.existsById(businessId)) {
            throw new NotFoundException("Business not found with ID: " + businessId);
        }

        return photoRepository.findByBusinessIdOrderBySortOrderAscCreatedAtAsc(businessId)
                .stream()
                .map(this::toPhotoResponse)
                .toList();
    }

    /**
     * Deletes a gallery photo belonging to the specified business after verifying ownership.
     */
    @Transactional
    public void deletePhoto(UUID businessId, UUID photoId, String userEmail) {
        businessService.getOwnedBusiness(businessId, userEmail);

        BusinessPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new NotFoundException("Photo not found with ID: " + photoId));

        if (!photo.getBusiness().getId().equals(businessId)) {
            throw new NotFoundException("Photo does not belong to business " + businessId);
        }

        photoRepository.delete(photo);
        storageService.delete(photo.getStorageKey());
    }

    private BusinessPhotoResponse toPhotoResponse(BusinessPhoto p) {
        return new BusinessPhotoResponse(
                p.getId(),
                p.getBusiness().getId(),
                p.getStorageKey(),
                p.getPublicUrl(),
                p.getCaption(),
                p.getSortOrder(),
                p.getCreatedAt()
        );
    }
}
