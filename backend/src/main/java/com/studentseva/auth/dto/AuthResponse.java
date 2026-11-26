package com.studentseva.auth.dto;

import java.util.UUID;

/**
 * Clean user profile DTO returned upon successful login / session check.
 * {@code token} is populated on OTP verification so cross-origin PWAs can also
 * authenticate with an Authorization Bearer header when third-party cookies are blocked.
 */
public record AuthResponse(
        UUID id,
        String email,
        String name,
        String role,
        String status,
        String token
) {
}
