package com.studentseva.reports;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for listing abuse/inaccuracy reports.
 */
@Repository
public interface ListingReportRepository extends JpaRepository<ListingReport, UUID> {

    boolean existsByReporterIdAndBusinessIdAndStatus(
            UUID reporterId, UUID businessId, ListingReport.Status status);

    long countByStatus(ListingReport.Status status);

    @Query("""
            SELECT r FROM ListingReport r
            JOIN FETCH r.reporter u
            JOIN FETCH r.business b
            WHERE r.id = :id
            """)
    Optional<ListingReport> findByIdWithDetails(@Param("id") UUID id);

    @Query("""
            SELECT r FROM ListingReport r
            JOIN FETCH r.reporter u
            JOIN FETCH r.business b
            WHERE (:status IS NULL OR r.status = :status)
            ORDER BY r.createdAt DESC
            """)
    List<ListingReport> findAllWithDetails(@Param("status") ListingReport.Status status);

    @Query("""
            SELECT r FROM ListingReport r
            JOIN FETCH r.reporter u
            JOIN FETCH r.business b
            WHERE u.id = :reporterId
            ORDER BY r.createdAt DESC
            """)
    List<ListingReport> findByReporterIdWithDetails(@Param("reporterId") UUID reporterId);
}
