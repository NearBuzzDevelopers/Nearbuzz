package com.studentseva.businesses.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request payload to upsert up to 7 weekly operating hour entries for a business.
 */
public record UpsertBusinessHoursRequest(
        @NotEmpty(message = "At least one schedule entry is required")
        @Size(max = 7, message = "Schedule cannot contain more than 7 days")
        @Valid
        List<BusinessHoursEntryRequest> schedule
) {
}
