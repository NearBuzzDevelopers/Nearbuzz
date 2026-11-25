package com.studentseva.reports.dto;

import com.studentseva.reports.ListingReport;
import jakarta.validation.constraints.NotNull;

/**
 * Admin request payload to resolve or dismiss a listing report,
 * optionally suspending the reported business listing.
 */
public record ResolveReportRequest(
        @NotNull(message = "Resolution status is required")
        ListingReport.Status status,

        boolean suspendBusiness
) {
}
