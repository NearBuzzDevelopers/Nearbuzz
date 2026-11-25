package com.studentseva.reports.dto;

import com.studentseva.businesses.Business;
import jakarta.validation.constraints.NotNull;

/**
 * Admin request payload to update a business listing's verification status.
 */
public record UpdateBusinessVerificationRequest(
        @NotNull(message = "verificationStatus is required")
        Business.VerificationStatus verificationStatus
) {
}
