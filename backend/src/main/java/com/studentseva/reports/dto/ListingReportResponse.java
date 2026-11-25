package com.studentseva.reports.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * API response representation of a listing moderation report.
 */
public record ListingReportResponse(
        UUID id,
        UUID businessId,
        String businessName,
        String businessVerificationStatus,
        UUID reporterId,
        String reporterName,
        String reporterEmail,
        String reason,
        String description,
        String status,
        Instant createdAt,
        Instant resolvedAt
) {
}
