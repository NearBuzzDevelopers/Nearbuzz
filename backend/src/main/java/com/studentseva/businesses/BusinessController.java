package com.studentseva.businesses;

import com.studentseva.businesses.dto.BusinessResponse;
import com.studentseva.businesses.dto.CreateBusinessRequest;
import com.studentseva.businesses.dto.NearbyBusinessResponse;
import com.studentseva.businesses.dto.UpdateBusinessMetadataRequest;
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
 * REST controller for business listings and vendor onboarding.
 */
@RestController
@RequestMapping("/api/v1/businesses")
@Tag(name = "Businesses", description = "Endpoints for vendor business registration and spatial profile management")
public class BusinessController {

    private final BusinessService businessService;

    public BusinessController(BusinessService businessService) {
        this.businessService = businessService;
    }

    @PostMapping
    @Operation(summary = "Register a new business listing (requires authentication)")
    public ResponseEntity<BusinessResponse> createBusiness(
            @Valid @RequestBody CreateBusinessRequest request,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        BusinessResponse response = businessService.createBusiness(request, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my")
    @Operation(summary = "Get the business owned by the currently authenticated vendor")
    public ResponseEntity<BusinessResponse> getMyBusiness(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(businessService.getMyBusiness(userEmail));
    }

    @PutMapping("/my")
    @Operation(summary = "Update the business owned by the currently authenticated vendor")
    public ResponseEntity<BusinessResponse> updateMyBusiness(
            @Valid @RequestBody CreateBusinessRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(businessService.updateMyBusiness(request, authentication.getName()));
    }

    @PatchMapping("/my/metadata")
    @Operation(summary = "Merge category-specific rules, facilities, or settings into the vendor's business metadata")
    public ResponseEntity<BusinessResponse> updateMyBusinessMetadata(
            @Valid @RequestBody UpdateBusinessMetadataRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(businessService.updateMyBusinessMetadata(request.metadata(), authentication.getName()));
    }

    @GetMapping
    @Operation(summary = "List all open businesses across all areas ordered by distance (public)")
    public ResponseEntity<List<NearbyBusinessResponse>> listAllOpenBusinesses(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Business.Category category
    ) {
        return ResponseEntity.ok(businessService.listAllOpenBusinesses(lat, lng, category));
    }

    @GetMapping("/nearby")
    @Operation(summary = "Search for nearby businesses by GPS coordinates (public)")
    public ResponseEntity<List<NearbyBusinessResponse>> getNearbyBusinesses(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(required = false, defaultValue = "2000") Double radius,
            @RequestParam(required = false) Business.Category category
    ) {
        return ResponseEntity.ok(businessService.searchNearby(lat, lng, radius, category));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get business details by UUID (public)")
    public ResponseEntity<BusinessResponse> getBusinessById(@PathVariable UUID id) {
        return ResponseEntity.ok(businessService.getBusinessById(id));
    }
}

