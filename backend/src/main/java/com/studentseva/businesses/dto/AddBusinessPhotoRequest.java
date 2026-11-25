package com.studentseva.businesses.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload to attach photo metadata to a business gallery.
 */
public record AddBusinessPhotoRequest(
        @NotBlank(message = "Storage key is required")
        @Size(max = 500, message = "Storage key cannot exceed 500 characters")
        String storageKey,

        @NotBlank(message = "Public URL is required")
        @Size(max = 1000, message = "Public URL cannot exceed 1000 characters")
        String publicUrl,

        @Size(max = 300, message = "Caption cannot exceed 300 characters")
        String caption,

        @Min(value = 0, message = "sortOrder must be >= 0")
        Integer sortOrder
) {
}
