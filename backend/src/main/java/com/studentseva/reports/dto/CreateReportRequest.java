package com.studentseva.reports.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for a user to report an inaccurate or problematic business listing.
 */
public record CreateReportRequest(
        @NotBlank(message = "Reason is required")
        @Size(max = 100, message = "Reason cannot exceed 100 characters")
        String reason,

        String description
) {
}
