package com.studentseva.businesses;

import com.studentseva.businesses.dto.BusinessScheduleResponse;
import com.studentseva.businesses.dto.UpsertBusinessHoursRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for managing and viewing business operating hours.
 */
@RestController
@RequestMapping("/api/v1/businesses/{businessId}/hours")
@Tag(name = "Business Hours", description = "Endpoints for weekly operating schedules and live open/closed status")
public class BusinessHoursController {

    private final BusinessHoursService hoursService;

    public BusinessHoursController(BusinessHoursService hoursService) {
        this.hoursService = hoursService;
    }

    @PutMapping
    @Operation(summary = "Set or update weekly operating hours (owner only)")
    public ResponseEntity<BusinessScheduleResponse> upsertSchedule(
            @PathVariable UUID businessId,
            @Valid @RequestBody UpsertBusinessHoursRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(hoursService.upsertSchedule(businessId, request, authentication.getName()));
    }

    @GetMapping
    @Operation(summary = "Get weekly operating hours and live openNow status (public)")
    public ResponseEntity<BusinessScheduleResponse> getSchedule(@PathVariable UUID businessId) {
        return ResponseEntity.ok(hoursService.getSchedule(businessId));
    }
}
