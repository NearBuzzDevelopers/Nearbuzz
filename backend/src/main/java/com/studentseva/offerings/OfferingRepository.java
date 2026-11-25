package com.studentseva.offerings;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for vendor offerings and availability queries.
 */
@Repository
public interface OfferingRepository extends JpaRepository<Offering, UUID> {

    List<Offering> findByBusinessIdOrderByCreatedAtDesc(UUID businessId);

    List<Offering> findByBusinessIdAndOfferingTypeOrderByCreatedAtDesc(
            UUID businessId, Offering.OfferingType offeringType);

    List<Offering> findByBusinessIdAndStatusOrderByCreatedAtDesc(
            UUID businessId, Offering.Status status);

    List<Offering> findByBusinessIdAndOfferingTypeAndStatusOrderByCreatedAtDesc(
            UUID businessId, Offering.OfferingType offeringType, Offering.Status status);
}
