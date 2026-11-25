package com.studentseva.updates.dto;

import com.studentseva.updates.VendorUpdate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

/**
 * Request payload for a vendor to publish a live announcement or service update.
 */
public record CreateUpdateRequest(
        UUID offeringId,

        @NotNull(message = "updateType is required")
        VendorUpdate.UpdateType updateType,

        @NotBlank(message = "Update title is required")
        @Size(max = 300, message = "Title cannot exceed 300 characters")
        String title,

        @NotBlank(message = "Update content is required")
        String content,

        Instant expiresAt
) {
}
