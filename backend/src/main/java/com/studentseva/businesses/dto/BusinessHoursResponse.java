package com.studentseva.businesses.dto;

import java.time.LocalTime;
import java.util.UUID;

/**
 * API response representation of a single day's operating hours.
 */
public record BusinessHoursResponse(
        UUID id,
        UUID businessId,
        int dayOfWeek,
        String dayName,
        LocalTime opensAt,
        LocalTime closesAt,
        boolean isClosed
) {
}
