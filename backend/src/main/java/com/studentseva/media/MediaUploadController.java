package com.studentseva.media;

import com.studentseva.businesses.dto.BusinessPhotoResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

/**
 * REST controller for uploading business gallery images to Cloudflare R2 (or local dev fallback).
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Media Upload", description = "Endpoints for multipart image uploads backed by Cloudflare R2")
public class MediaUploadController {

    private final MediaUploadService mediaUploadService;

    public MediaUploadController(MediaUploadService mediaUploadService) {
        this.mediaUploadService = mediaUploadService;
    }

    @PostMapping(value = "/businesses/{businessId}/photos/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload an image file (JPEG/PNG/WEBP, max 5MB) to a business gallery (owner only)")
    public ResponseEntity<BusinessPhotoResponse> uploadBusinessPhoto(
            @PathVariable UUID businessId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String caption,
            @RequestParam(required = false) Integer sortOrder,
            Authentication authentication
    ) {
        BusinessPhotoResponse saved = mediaUploadService.uploadBusinessPhoto(
                businessId, file, caption, sortOrder, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/media/storage-status")
    @Operation(summary = "Check which object storage backend is currently active (public)")
    public ResponseEntity<Map<String, String>> getStorageStatus() {
        return ResponseEntity.ok(Map.of("backend", mediaUploadService.getActiveStorageBackend()));
    }
}
