package com.studentseva.businesses;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for weekly business operating hours.
 */
@Repository
public interface BusinessHoursRepository extends JpaRepository<BusinessHours, UUID> {

    List<BusinessHours> findByBusinessIdOrderByDayOfWeekAsc(UUID businessId);

    Optional<BusinessHours> findByBusinessIdAndDayOfWeek(UUID businessId, Short dayOfWeek);
}
