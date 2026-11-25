package com.studentseva.reports;

import com.studentseva.businesses.dto.BusinessResponse;
import com.studentseva.reports.dto.CreateReportRequest;
import com.studentseva.reports.dto.ListingReportResponse;
import com.studentseva.reports.dto.ResolveReportRequest;
import com.studentseva.reports.dto.UpdateBusinessVerificationRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for community listing reports and ROLE_ADMIN moderation actions.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Reports & Admin Moderation", description = "Endpoints for flagging listings and admin verification/suspension")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/businesses/{businessId}/reports")
    @Operation(summary = "Report an inaccurate or problematic business listing (authenticated)")
    public ResponseEntity<ListingReportResponse> submitReport(
            @PathVariable UUID businessId,
            @Valid @RequestBody CreateReportRequest request,
            Authentication authentication
    ) {
        ListingReportResponse response = reportService.submitReport(businessId, request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/reports/my")
    @Operation(summary = "List reports submitted by the currently authenticated user")
    public ResponseEntity<List<ListingReportResponse>> getMyReports(Authentication authentication) {
        return ResponseEntity.ok(reportService.getMyReports(authentication.getName()));
    }

    @GetMapping("/admin/reports")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all listing reports with optional status filter (ADMIN only)")
    public ResponseEntity<List<ListingReportResponse>> getAllReports(
            @RequestParam(required = false) ListingReport.Status status
    ) {
        return ResponseEntity.ok(reportService.getAllReports(status));
    }

    @PatchMapping("/admin/reports/{reportId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Resolve or dismiss a listing report, optionally suspending the listing (ADMIN only)")
    public ResponseEntity<ListingReportResponse> resolveReport(
            @PathVariable UUID reportId,
            @Valid @RequestBody ResolveReportRequest request
    ) {
        return ResponseEntity.ok(reportService.resolveReport(reportId, request));
    }

    @PatchMapping("/admin/businesses/{businessId}/verification")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a business verification status (VERIFIED / SUSPENDED / PENDING) (ADMIN only)")
    public ResponseEntity<BusinessResponse> updateBusinessVerification(
            @PathVariable UUID businessId,
            @Valid @RequestBody UpdateBusinessVerificationRequest request
    ) {
        return ResponseEntity.ok(
                reportService.updateBusinessVerification(businessId, request.verificationStatus()));
    }
}
