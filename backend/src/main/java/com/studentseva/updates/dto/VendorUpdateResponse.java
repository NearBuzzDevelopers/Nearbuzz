package com.studentseva.updates.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * API response representation of a vendor update post.
 */
public record VendorUpdateResponse(
        UUID id,
        UUID businessId,
        String businessName,
        String businessCategory,
        UUID offeringId,
        String offeringTitle,
        String updateType,
        String title,
        String content,
        Instant expiresAt,
        Instant createdAt
) {
}
