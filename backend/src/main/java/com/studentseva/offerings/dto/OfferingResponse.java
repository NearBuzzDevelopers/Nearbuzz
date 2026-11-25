package com.studentseva.offerings.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * API response DTO representing a business offering with JSONB attributes and optimistic lock version.
 */
public record OfferingResponse(
        UUID id,
        UUID businessId,
        String businessName,
        String offeringType,
        String title,
        BigDecimal price,
        String pricingUnit,
        String status,
        Instant lastConfirmedAt,
        Map<String, Object> attributes,
        Integer version,
        Instant createdAt,
        Instant updatedAt
) {
}
