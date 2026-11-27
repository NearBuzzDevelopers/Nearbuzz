package com.studentseva.businesses.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Clean response DTO exposing business details, canonical {@code businessType} slug,
 * category-specific JSONB {@code metadata}, and explicit latitude/longitude numbers.
 */
public record BusinessResponse(
        UUID id,
        UUID ownerId,
        String ownerName,
        String name,
        String category,
        String businessType,
        String description,
        String address,
        Double latitude,
        Double longitude,
        String phone,
        String whatsapp,
        String status,
        String verificationStatus,
        Map<String, Object> metadata,
        Instant createdAt,
        Instant updatedAt
) {
}
