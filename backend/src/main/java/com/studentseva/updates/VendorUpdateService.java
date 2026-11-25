package com.studentseva.updates;

import com.studentseva.businesses.Business;
import com.studentseva.businesses.BusinessRepository;
import com.studentseva.businesses.BusinessService;
import com.studentseva.common.exceptions.NotFoundException;
import com.studentseva.offerings.Offering;
import com.studentseva.offerings.OfferingRepository;
import com.studentseva.updates.dto.CreateUpdateRequest;
import com.studentseva.updates.dto.VendorUpdateResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service managing vendor announcements, optional offering links, expiration filtering,
 * and ownership checks.
 */
@Service
public class VendorUpdateService {

    private static final int MAX_FEED_LIMIT = 50;

    private final VendorUpdateRepository updateRepository;
    private final BusinessRepository businessRepository;
    private final BusinessService businessService;
    private final OfferingRepository offeringRepository;

    public VendorUpdateService(
            VendorUpdateRepository updateRepository,
            BusinessRepository businessRepository,
            BusinessService businessService,
            OfferingRepository offeringRepository
    ) {
        this.updateRepository = updateRepository;
        this.businessRepository = businessRepository;
        this.businessService = businessService;
        this.offeringRepository = offeringRepository;
    }

    /**
     * Publishes a new update for a business owned by the authenticated caller.
     */
    @Transactional
    public VendorUpdateResponse createUpdate(UUID businessId, CreateUpdateRequest request, String userEmail) {
        Business business = businessService.getOwnedBusiness(businessId, userEmail);

        Offering offering = null;
        if (request.offeringId() != null) {
            offering = offeringRepository.findById(request.offeringId())
                    .orElseThrow(() -> new NotFoundException("Offering not found with ID: " + request.offeringId()));
            if (!offering.getBusiness().getId().equals(businessId)) {
                throw new IllegalArgumentException("Offering does not belong to business " + businessId);
            }
        }

        if (request.expiresAt() != null && !request.expiresAt().isAfter(Instant.now())) {
            throw new IllegalArgumentException("expiresAt must be a future timestamp.");
        }

        VendorUpdate update = new VendorUpdate();
        update.setBusiness(business);
        update.setOffering(offering);
        update.setUpdateType(request.updateType());
        update.setTitle(request.title().trim());
        update.setContent(request.content().trim());
        update.setExpiresAt(request.expiresAt());

        VendorUpdate saved = updateRepository.saveAndFlush(update);
        return toUpdateResponse(saved);
    }

    /**
     * Lists all active (non-expired) updates posted by a specific business.
     */
    @Transactional(readOnly = true)
    public List<VendorUpdateResponse> getBusinessUpdates(UUID businessId) {
        if (!businessRepository.existsById(businessId)) {
            throw new NotFoundException("Business not found with ID: " + businessId);
        }

        return updateRepository.findActiveByBusinessId(businessId, Instant.now())
                .stream()
                .map(this::toUpdateResponse)
                .toList();
    }

    /**
     * Returns recent active updates across all businesses for the student discovery feed.
     */
    @Transactional(readOnly = true)
    public List<VendorUpdateResponse> getPublicFeed(int limit) {
        int clampedLimit = Math.min(Math.max(limit, 1), MAX_FEED_LIMIT);
        return updateRepository.findActiveFeed(Instant.now(), PageRequest.of(0, clampedLimit))
                .stream()
                .map(this::toUpdateResponse)
                .toList();
    }

    /**
     * Deletes an update post after verifying business ownership.
     */
    @Transactional
    public void deleteUpdate(UUID updateId, String userEmail) {
        VendorUpdate update = updateRepository.findById(updateId)
                .orElseThrow(() -> new NotFoundException("Update not found with ID: " + updateId));

        businessService.getOwnedBusiness(update.getBusiness().getId(), userEmail);
        updateRepository.delete(update);
    }

    private VendorUpdateResponse toUpdateResponse(VendorUpdate u) {
        return new VendorUpdateResponse(
                u.getId(),
                u.getBusiness().getId(),
                u.getBusiness().getName(),
                u.getBusiness().getCategory().name(),
                u.getOffering() != null ? u.getOffering().getId() : null,
                u.getOffering() != null ? u.getOffering().getTitle() : null,
                u.getUpdateType().name(),
                u.getTitle(),
                u.getContent(),
                u.getExpiresAt(),
                u.getCreatedAt()
        );
    }
}
