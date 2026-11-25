package com.studentseva.follows.dto;

import java.util.UUID;

/**
 * API response summarizing a user's follow relationship and a business's total followers.
 */
public record FollowStatusResponse(
        UUID businessId,
        boolean following,
        long followerCount
) {
}
