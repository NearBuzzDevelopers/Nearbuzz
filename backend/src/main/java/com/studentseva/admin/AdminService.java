package com.studentseva.admin;

import com.studentseva.admin.dto.AdminOverviewResponse;
import com.studentseva.admin.dto.AdminUserResponse;
import com.studentseva.businesses.Business;
import com.studentseva.businesses.BusinessRepository;
import com.studentseva.businesses.BusinessService;
import com.studentseva.businesses.dto.BusinessResponse;
import com.studentseva.common.exceptions.NotFoundException;
import com.studentseva.reports.ListingReport;
import com.studentseva.reports.ListingReportRepository;
import com.studentseva.users.User;
import com.studentseva.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service powering the Admin Control Center: platform metrics, listing oversight, and user moderation.
 */
@Service
public class AdminService {

    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final BusinessService businessService;
    private final ListingReportRepository reportRepository;

    public AdminService(
            UserRepository userRepository,
            BusinessRepository businessRepository,
            BusinessService businessService,
            ListingReportRepository reportRepository
    ) {
        this.userRepository = userRepository;
        this.businessRepository = businessRepository;
        this.businessService = businessService;
        this.reportRepository = reportRepository;
    }

    @Transactional(readOnly = true)
    public AdminOverviewResponse getOverview() {
        return new AdminOverviewResponse(
                userRepository.count(),
                userRepository.countByRole(User.Role.STUDENT),
                userRepository.countByRole(User.Role.VENDOR),
                businessRepository.count(),
                businessRepository.countByVerificationStatus(Business.VerificationStatus.VERIFIED),
                businessRepository.countByVerificationStatus(Business.VerificationStatus.PENDING),
                businessRepository.countByVerificationStatus(Business.VerificationStatus.SUSPENDED),
                reportRepository.countByStatus(ListingReport.Status.OPEN),
                reportRepository.count()
        );
    }

    @Transactional(readOnly = true)
    public List<BusinessResponse> listBusinesses(Business.VerificationStatus status) {
        return businessRepository.findAllWithOwner(status)
                .stream()
                .map(businessService::toBusinessResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> listUsers(User.Role role) {
        List<User> users = role != null
                ? userRepository.findByRoleOrderByCreatedAtDesc(role)
                : userRepository.findAllByOrderByCreatedAtDesc();

        return users.stream()
                .map(this::toAdminUserResponse)
                .toList();
    }

    @Transactional
    public AdminUserResponse updateUserStatus(UUID userId, User.Status status, String currentAdminEmail) {
        if (status != User.Status.ACTIVE && status != User.Status.SUSPENDED) {
            throw new IllegalArgumentException("Admin can only set status to ACTIVE or SUSPENDED.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));

        if (user.getEmail().equalsIgnoreCase(currentAdminEmail) && status == User.Status.SUSPENDED) {
            throw new IllegalArgumentException("You cannot suspend your own currently signed-in admin account.");
        }

        user.setStatus(status);
        User saved = userRepository.saveAndFlush(user);
        return toAdminUserResponse(saved);
    }

    private AdminUserResponse toAdminUserResponse(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole().name(),
                user.getStatus().name(),
                user.getCreatedAt()
        );
    }
}
