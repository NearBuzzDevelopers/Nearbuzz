package com.studentseva.businesses.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

/**
 * Single day entry in a business's weekly operating schedule.
 * dayOfWeek follows PostgreSQL convention: 0 = Sunday .. 6 = Saturday.
 */
public record BusinessHoursEntryRequest(
        @NotNull(message = "dayOfWeek is required")
        @Min(value = 0, message = "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)")
        @Max(value = 6, message = "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)")
        Integer dayOfWeek,

        LocalTime opensAt,

        LocalTime closesAt,

        boolean isClosed
) {
}
