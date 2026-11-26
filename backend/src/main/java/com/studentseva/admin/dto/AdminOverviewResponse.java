package com.studentseva.admin.dto;

/**
 * Summary counts displayed at the top of the Admin Control Center.
 */
public record AdminOverviewResponse(
        long totalUsers,
        long totalStudents,
        long totalVendors,
        long totalBusinesses,
        long verifiedBusinesses,
        long pendingBusinesses,
        long suspendedBusinesses,
        long openReports,
        long totalReports
) {
}
