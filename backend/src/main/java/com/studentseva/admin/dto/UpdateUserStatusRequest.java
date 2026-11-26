package com.studentseva.admin.dto;

import com.studentseva.users.User;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for activating or suspending a user account.
 */
public record UpdateUserStatusRequest(
        @NotNull(message = "Status is required (ACTIVE or SUSPENDED)")
        User.Status status
) {
}
