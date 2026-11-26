package com.studentseva.admin.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * User summary row for the Admin user management view.
 */
public record AdminUserResponse(
        UUID id,
        String email,
        String name,
        String role,
        String status,
        Instant createdAt
) {
}
