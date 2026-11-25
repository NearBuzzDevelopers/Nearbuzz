package com.studentseva.follows.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Summary of a business currently followed by the authenticated user.
 */
public record FollowedBusinessResponse(
        UUID businessId,
        String businessName,
        String category,
        String address,
        String status,
        Instant followedAt
) {
}
