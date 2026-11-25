package com.studentseva.businesses;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for business gallery photos.
 */
@Repository
public interface BusinessPhotoRepository extends JpaRepository<BusinessPhoto, UUID> {

    List<BusinessPhoto> findByBusinessIdOrderBySortOrderAscCreatedAtAsc(UUID businessId);

    long countByBusinessId(UUID businessId);
}
