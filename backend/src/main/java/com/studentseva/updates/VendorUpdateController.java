package com.studentseva.updates;

import com.studentseva.updates.dto.CreateUpdateRequest;
import com.studentseva.updates.dto.VendorUpdateResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for vendor announcements and the live hyperlocal updates feed.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Vendor Updates", description = "Endpoints for live vendor announcements, expiry-aware updates, and student feed")
public class VendorUpdateController {

    private final VendorUpdateService updateService;

    public VendorUpdateController(VendorUpdateService updateService) {
        this.updateService = updateService;
    }

    @PostMapping("/businesses/{businessId}/updates")
    @Operation(summary = "Publish a new update for a business (owner only)")
    public ResponseEntity<VendorUpdateResponse> createUpdate(
            @PathVariable UUID businessId,
            @Valid @RequestBody CreateUpdateRequest request,
            Authentication authentication
    ) {
        VendorUpdateResponse response = updateService.createUpdate(businessId, request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/businesses/{businessId}/updates")
    @Operation(summary = "List active updates for a specific business (public)")
    public ResponseEntity<List<VendorUpdateResponse>> getBusinessUpdates(@PathVariable UUID businessId) {
        return ResponseEntity.ok(updateService.getBusinessUpdates(businessId));
    }

    @GetMapping("/updates/feed")
    @Operation(summary = "Get recent active updates across all businesses (public)")
    public ResponseEntity<List<VendorUpdateResponse>> getPublicFeed(
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(updateService.getPublicFeed(limit));
    }

    @GetMapping("/updates/following")
    @Operation(summary = "Get recent active updates from businesses the user follows (authenticated)")
    public ResponseEntity<List<VendorUpdateResponse>> getFollowingFeed(
            @RequestParam(defaultValue = "20") int limit,
            Authentication authentication
    ) {
        return ResponseEntity.ok(updateService.getFollowingFeed(authentication.getName(), limit));
    }

    @DeleteMapping("/updates/{id}")
    @Operation(summary = "Delete an update post (owner only)")
    public ResponseEntity<Void> deleteUpdate(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        updateService.deleteUpdate(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
