package com.studentseva.offerings;

import com.studentseva.offerings.dto.CreateOfferingRequest;
import com.studentseva.offerings.dto.OfferingResponse;
import com.studentseva.offerings.dto.UpdateOfferingRequest;
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
 * REST controller for granular business offerings (rooms, mess menus, print rates, library seats).
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Offerings", description = "Endpoints for managing and browsing business offerings and JSONB attributes")
public class OfferingController {

    private final OfferingService offeringService;

    public OfferingController(OfferingService offeringService) {
        this.offeringService = offeringService;
    }

    @PostMapping("/businesses/{businessId}/offerings")
    @Operation(summary = "Add a new offering to a business (owner only)")
    public ResponseEntity<OfferingResponse> createOffering(
            @PathVariable UUID businessId,
            @Valid @RequestBody CreateOfferingRequest request,
            Authentication authentication
    ) {
        OfferingResponse response = offeringService.createOffering(businessId, request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/businesses/{businessId}/offerings")
    @Operation(summary = "List offerings for a business with optional type and status filters (public)")
    public ResponseEntity<List<OfferingResponse>> getOfferingsByBusiness(
            @PathVariable UUID businessId,
            @RequestParam(required = false) Offering.OfferingType type,
            @RequestParam(required = false) Offering.Status status
    ) {
        return ResponseEntity.ok(offeringService.getOfferingsByBusiness(businessId, type, status));
    }

    @GetMapping("/offerings/{id}")
    @Operation(summary = "Get offering details by UUID (public)")
    public ResponseEntity<OfferingResponse> getOfferingById(@PathVariable UUID id) {
        return ResponseEntity.ok(offeringService.getOfferingById(id));
    }

    @PutMapping("/offerings/{id}")
    @Operation(summary = "Update an offering's price, status, or JSONB attributes (owner only)")
    public ResponseEntity<OfferingResponse> updateOffering(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOfferingRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(offeringService.updateOffering(id, request, authentication.getName()));
    }

    @PatchMapping("/offerings/{id}/confirm")
    @Operation(summary = "Confirm offering availability freshness (owner only)")
    public ResponseEntity<OfferingResponse> confirmFreshness(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(offeringService.confirmFreshness(id, authentication.getName()));
    }

    @DeleteMapping("/offerings/{id}")
    @Operation(summary = "Delete an offering (owner only)")
    public ResponseEntity<Void> deleteOffering(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        offeringService.deleteOffering(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
