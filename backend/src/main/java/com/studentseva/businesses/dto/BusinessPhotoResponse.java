package com.studentseva.businesses.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * API response DTO representing a business gallery photo.
 */
public record BusinessPhotoResponse(
        UUID id,
        UUID businessId,
        String storageKey,
        String publicUrl,
        String caption,
        Integer sortOrder,
        Instant createdAt
) {
}
