package com.studentseva.businesses.dto;

import java.util.List;
import java.util.UUID;

/**
 * Full weekly schedule response including a live computed `openNow` status.
 */
public record BusinessScheduleResponse(
        UUID businessId,
        boolean openNow,
        List<BusinessHoursResponse> schedule
) {
}
