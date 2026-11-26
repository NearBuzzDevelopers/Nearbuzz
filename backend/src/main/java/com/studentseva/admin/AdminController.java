package com.studentseva.admin;

import com.studentseva.admin.dto.AdminOverviewResponse;
import com.studentseva.admin.dto.AdminUserResponse;
import com.studentseva.admin.dto.UpdateUserStatusRequest;
import com.studentseva.businesses.Business;
import com.studentseva.businesses.dto.BusinessResponse;
import com.studentseva.users.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST endpoints for platform overview, all-business moderation, and user account management.
 */
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Control Center", description = "Platform metrics, business listing oversight, and user moderation (ADMIN only)")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/overview")
    @Operation(summary = "Get platform summary metrics for the Admin dashboard")
    public ResponseEntity<AdminOverviewResponse> getOverview() {
        return ResponseEntity.ok(adminService.getOverview());
    }

    @GetMapping("/businesses")
    @Operation(summary = "List all registered businesses with optional verificationStatus filter")
    public ResponseEntity<List<BusinessResponse>> listBusinesses(
            @RequestParam(required = false) Business.VerificationStatus verificationStatus
    ) {
        return ResponseEntity.ok(adminService.listBusinesses(verificationStatus));
    }

    @GetMapping("/users")
    @Operation(summary = "List all users with optional role filter")
    public ResponseEntity<List<AdminUserResponse>> listUsers(
            @RequestParam(required = false) User.Role role
    ) {
        return ResponseEntity.ok(adminService.listUsers(role));
    }

    @PatchMapping("/users/{userId}/status")
    @Operation(summary = "Activate or suspend a user account")
    public ResponseEntity<AdminUserResponse> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                adminService.updateUserStatus(userId, request.status(), authentication.getName()));
    }
}
