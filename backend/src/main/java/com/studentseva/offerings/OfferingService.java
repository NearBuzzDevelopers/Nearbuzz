package com.studentseva.offerings;

import com.studentseva.businesses.Business;
import com.studentseva.businesses.BusinessRepository;
import com.studentseva.common.exceptions.ForbiddenException;
import com.studentseva.common.exceptions.NotFoundException;
import com.studentseva.offerings.dto.CreateOfferingRequest;
import com.studentseva.offerings.dto.OfferingResponse;
import com.studentseva.offerings.dto.UpdateOfferingRequest;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * Service managing business offerings, JSONB attribute storage, freshness timestamps,
 * and optimistic concurrency checks.
 */
@Service
public class OfferingService {

    private final OfferingRepository offeringRepository;
    private final BusinessRepository businessRepository;

    public OfferingService(OfferingRepository offeringRepository, BusinessRepository businessRepository) {
        this.offeringRepository = offeringRepository;
        this.businessRepository = businessRepository;
    }

    /**
     * Creates a new offering under the specified business after verifying vendor ownership.
     */
    @Transactional
    public OfferingResponse createOffering(UUID businessId, CreateOfferingRequest request, String userEmail) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new NotFoundException("Business not found with ID: " + businessId));

        verifyOwnership(business, userEmail);

        Offering offering = new Offering();
        offering.setBusiness(business);
        offering.setOfferingType(request.offeringType());
        offering.setTitle(request.title().trim());
        offering.setPrice(request.price());
        offering.setPricingUnit(request.pricingUnit() != null ? request.pricingUnit().trim() : null);
        offering.setStatus(request.status() != null ? request.status() : Offering.Status.AVAILABLE);
        offering.setAttributes(request.attributes() != null ? request.attributes() : new HashMap<>());
        offering.setLastConfirmedAt(Instant.now());

        Offering saved = offeringRepository.saveAndFlush(offering);
        return toOfferingResponse(saved);
    }

    /**
     * Lists all offerings belonging to a business, optionally filtered by type and/or status.
     */
    @Transactional(readOnly = true)
    public List<OfferingResponse> getOfferingsByBusiness(
            UUID businessId,
            Offering.OfferingType type,
            Offering.Status status
    ) {
        if (!businessRepository.existsById(businessId)) {
            throw new NotFoundException("Business not found with ID: " + businessId);
        }

        List<Offering> offerings;
        if (type != null && status != null) {
            offerings = offeringRepository.findByBusinessIdAndOfferingTypeAndStatusOrderByCreatedAtDesc(
                    businessId, type, status);
        } else if (type != null) {
            offerings = offeringRepository.findByBusinessIdAndOfferingTypeOrderByCreatedAtDesc(businessId, type);
        } else if (status != null) {
            offerings = offeringRepository.findByBusinessIdAndStatusOrderByCreatedAtDesc(businessId, status);
        } else {
            offerings = offeringRepository.findByBusinessIdOrderByCreatedAtDesc(businessId);
        }

        return offerings.stream()
                .map(this::toOfferingResponse)
                .toList();
    }

    /**
     * Retrieves a single offering by UUID.
     */
    @Transactional(readOnly = true)
    public OfferingResponse getOfferingById(UUID offeringId) {
        Offering offering = offeringRepository.findById(offeringId)
                .orElseThrow(() -> new NotFoundException("Offering not found with ID: " + offeringId));
        return toOfferingResponse(offering);
    }

    /**
     * Updates an offering after verifying ownership and optional optimistic lock version.
     */
    @Transactional
    public OfferingResponse updateOffering(UUID offeringId, UpdateOfferingRequest request, String userEmail) {
        Offering offering = findOwnedOffering(offeringId, userEmail);

        if (request.expectedVersion() != null
                && !Objects.equals(request.expectedVersion(), offering.getVersion())) {
            throw new OptimisticLockingFailureException(
                    "Version mismatch for offering " + offeringId
                            + ": expected " + request.expectedVersion()
                            + ", current " + offering.getVersion());
        }

        if (request.offeringType() != null) {
            offering.setOfferingType(request.offeringType());
        }
        if (request.title() != null) {
            String trimmedTitle = request.title().trim();
            if (trimmedTitle.isEmpty()) {
                throw new IllegalArgumentException("Offering title cannot be blank");
            }
            offering.setTitle(trimmedTitle);
        }
        if (request.price() != null) {
            offering.setPrice(request.price());
        }
        if (request.pricingUnit() != null) {
            offering.setPricingUnit(request.pricingUnit().trim());
        }
        if (request.status() != null) {
            offering.setStatus(request.status());
        }
        if (request.attributes() != null) {
            offering.setAttributes(request.attributes());
        }

        offering.setLastConfirmedAt(Instant.now());
        Offering saved = offeringRepository.saveAndFlush(offering);
        return toOfferingResponse(saved);
    }

    /**
     * One-tap freshness confirmation: updates lastConfirmedAt to now and restores
     * UNCONFIRMED offerings back to AVAILABLE.
     */
    @Transactional
    public OfferingResponse confirmFreshness(UUID offeringId, String userEmail) {
        Offering offering = findOwnedOffering(offeringId, userEmail);
        offering.setLastConfirmedAt(Instant.now());
        if (offering.getStatus() == Offering.Status.UNCONFIRMED) {
            offering.setStatus(Offering.Status.AVAILABLE);
        }

        Offering saved = offeringRepository.saveAndFlush(offering);
        return toOfferingResponse(saved);
    }

    /**
     * Deletes an offering after verifying vendor ownership.
     */
    @Transactional
    public void deleteOffering(UUID offeringId, String userEmail) {
        Offering offering = findOwnedOffering(offeringId, userEmail);
        offeringRepository.delete(offering);
    }

    private Offering findOwnedOffering(UUID offeringId, String userEmail) {
        Offering offering = offeringRepository.findById(offeringId)
                .orElseThrow(() -> new NotFoundException("Offering not found with ID: " + offeringId));
        verifyOwnership(offering.getBusiness(), userEmail);
        return offering;
    }

    private void verifyOwnership(Business business, String userEmail) {
        if (!business.getOwner().getEmail().equalsIgnoreCase(userEmail)) {
            throw new ForbiddenException("You do not have permission to manage offerings for this business.");
        }
    }

    private OfferingResponse toOfferingResponse(Offering o) {
        return new OfferingResponse(
                o.getId(),
                o.getBusiness().getId(),
                o.getBusiness().getName(),
                o.getOfferingType().name(),
                o.getTitle(),
                o.getPrice(),
                o.getPricingUnit(),
                o.getStatus().name(),
                o.getLastConfirmedAt(),
                o.getAttributes(),
                o.getVersion(),
                o.getCreatedAt(),
                o.getUpdatedAt()
        );
    }
}
