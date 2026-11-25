package com.studentseva.businesses;

import com.studentseva.businesses.dto.AddBusinessPhotoRequest;
import com.studentseva.businesses.dto.BusinessPhotoResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for managing and viewing business gallery photos.
 */
@RestController
@RequestMapping("/api/v1/businesses/{businessId}/photos")
@Tag(name = "Business Photos", description = "Endpoints for business gallery photo metadata and ordering")
public class BusinessPhotoController {

    private final BusinessPhotoService photoService;

    public BusinessPhotoController(BusinessPhotoService photoService) {
        this.photoService = photoService;
    }

    @PostMapping
    @Operation(summary = "Add photo metadata to a business gallery (owner only)")
    public ResponseEntity<BusinessPhotoResponse> addPhoto(
            @PathVariable UUID businessId,
            @Valid @RequestBody AddBusinessPhotoRequest request,
            Authentication authentication
    ) {
        BusinessPhotoResponse response = photoService.addPhoto(businessId, request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List gallery photos for a business (public)")
    public ResponseEntity<List<BusinessPhotoResponse>> getPhotos(@PathVariable UUID businessId) {
        return ResponseEntity.ok(photoService.getPhotos(businessId));
    }

    @DeleteMapping("/{photoId}")
    @Operation(summary = "Delete a photo from a business gallery (owner only)")
    public ResponseEntity<Void> deletePhoto(
            @PathVariable UUID businessId,
            @PathVariable UUID photoId,
            Authentication authentication
    ) {
        photoService.deletePhoto(businessId, photoId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
