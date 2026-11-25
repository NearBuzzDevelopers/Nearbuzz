package com.studentseva.reports;

import com.studentseva.businesses.Business;
import com.studentseva.businesses.BusinessRepository;
import com.studentseva.businesses.BusinessService;
import com.studentseva.businesses.dto.BusinessResponse;
import com.studentseva.common.exceptions.NotFoundException;
import com.studentseva.reports.dto.CreateReportRequest;
import com.studentseva.reports.dto.ListingReportResponse;
import com.studentseva.reports.dto.ResolveReportRequest;
import com.studentseva.users.User;
import com.studentseva.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service managing community listing reports and admin moderation decisions.
 */
@Service
public class ReportService {

    private final ListingReportRepository reportRepository;
    private final BusinessRepository businessRepository;
    private final BusinessService businessService;
    private final UserRepository userRepository;

    public ReportService(
            ListingReportRepository reportRepository,
            BusinessRepository businessRepository,
            BusinessService businessService,
            UserRepository userRepository
    ) {
        this.reportRepository = reportRepository;
        this.businessRepository = businessRepository;
        this.businessService = businessService;
        this.userRepository = userRepository;
    }

    /**
     * Submits a moderation report against a business listing on behalf of the authenticated user.
     */
    @Transactional
    public ListingReportResponse submitReport(UUID businessId, CreateReportRequest request, String reporterEmail) {
        User reporter = userRepository.findByEmail(reporterEmail)
                .orElseThrow(() -> new NotFoundException("User not found with email: " + reporterEmail));

        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new NotFoundException("Business not found with ID: " + businessId));

        if (business.getOwner().getId().equals(reporter.getId())) {
            throw new IllegalArgumentException("You cannot report your own business listing.");
        }

        if (reportRepository.existsByReporterIdAndBusinessIdAndStatus(
                reporter.getId(), businessId, ListingReport.Status.OPEN)) {
            throw new IllegalArgumentException("You already have an open report pending review for this business.");
        }

        ListingReport report = new ListingReport();
        report.setReporter(reporter);
        report.setBusiness(business);
        report.setReason(request.reason().trim());
        report.setDescription(request.description() != null ? request.description().trim() : null);

        ListingReport saved = reportRepository.saveAndFlush(report);
        return toReportResponse(saved);
    }

    /**
     * Lists reports filed by the currently authenticated user.
     */
    @Transactional(readOnly = true)
    public List<ListingReportResponse> getMyReports(String reporterEmail) {
        User reporter = userRepository.findByEmail(reporterEmail)
                .orElseThrow(() -> new NotFoundException("User not found with email: " + reporterEmail));

        return reportRepository.findByReporterIdWithDetails(reporter.getId())
                .stream()
                .map(this::toReportResponse)
                .toList();
    }

    /**
     * Lists all listing reports (optionally filtered by status) for admin review.
     */
    @Transactional(readOnly = true)
    public List<ListingReportResponse> getAllReports(ListingReport.Status status) {
        return reportRepository.findAllWithDetails(status)
                .stream()
                .map(this::toReportResponse)
                .toList();
    }

    /**
     * Resolves or dismisses an open listing report, optionally suspending the reported business.
     */
    @Transactional
    public ListingReportResponse resolveReport(UUID reportId, ResolveReportRequest request) {
        if (request.status() == ListingReport.Status.OPEN) {
            throw new IllegalArgumentException("Resolution status must be RESOLVED or DISMISSED.");
        }

        ListingReport report = reportRepository.findByIdWithDetails(reportId)
                .orElseThrow(() -> new NotFoundException("Report not found with ID: " + reportId));

        report.setStatus(request.status());
        report.setResolvedAt(Instant.now());

        if (request.status() == ListingReport.Status.RESOLVED && request.suspendBusiness()) {
            Business business = report.getBusiness();
            business.setVerificationStatus(Business.VerificationStatus.SUSPENDED);
            businessRepository.save(business);
        }

        ListingReport saved = reportRepository.saveAndFlush(report);
        return toReportResponse(saved);
    }

    /**
     * Directly updates a business listing's verification status (PENDING, VERIFIED, SUSPENDED).
     */
    @Transactional
    public BusinessResponse updateBusinessVerification(
            UUID businessId,
            Business.VerificationStatus verificationStatus
    ) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new NotFoundException("Business not found with ID: " + businessId));

        business.setVerificationStatus(verificationStatus);
        Business saved = businessRepository.saveAndFlush(business);
        return businessService.toBusinessResponse(saved);
    }

    private ListingReportResponse toReportResponse(ListingReport r) {
        return new ListingReportResponse(
                r.getId(),
                r.getBusiness().getId(),
                r.getBusiness().getName(),
                r.getBusiness().getVerificationStatus().name(),
                r.getReporter().getId(),
                r.getReporter().getName(),
                r.getReporter().getEmail(),
                r.getReason(),
                r.getDescription(),
                r.getStatus().name(),
                r.getCreatedAt(),
                r.getResolvedAt()
        );
    }
}
