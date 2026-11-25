package com.studentseva.updates;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for vendor announcement updates and active feed queries.
 */
@Repository
public interface VendorUpdateRepository extends JpaRepository<VendorUpdate, UUID> {

    /**
     * Fetches non-expired updates for a specific business using JOIN FETCH
     * to prevent N+1 queries when reading business/offering summaries.
     */
    @Query("""
            SELECT u FROM VendorUpdate u
            JOIN FETCH u.business b
            LEFT JOIN FETCH u.offering o
            WHERE b.id = :businessId
              AND (u.expiresAt IS NULL OR u.expiresAt > :now)
            ORDER BY u.createdAt DESC
            """)
    List<VendorUpdate> findActiveByBusinessId(@Param("businessId") UUID businessId, @Param("now") Instant now);

    /**
     * Fetches the latest active updates across all businesses for the public hyperlocal feed.
     */
    @Query("""
            SELECT u FROM VendorUpdate u
            JOIN FETCH u.business b
            LEFT JOIN FETCH u.offering o
            WHERE u.expiresAt IS NULL OR u.expiresAt > :now
            ORDER BY u.createdAt DESC
            """)
    List<VendorUpdate> findActiveFeed(@Param("now") Instant now, Pageable pageable);

    /**
     * Fetches recent active updates strictly from businesses the specified user follows.
     */
    @Query("""
            SELECT u FROM VendorUpdate u
            JOIN FETCH u.business b
            LEFT JOIN FETCH u.offering o
            WHERE b.id IN (
                SELECT f.business.id FROM Follow f WHERE f.user.id = :userId
            )
              AND (u.expiresAt IS NULL OR u.expiresAt > :now)
            ORDER BY u.createdAt DESC
            """)
    List<VendorUpdate> findFollowingFeed(
            @Param("userId") UUID userId,
            @Param("now") Instant now,
            Pageable pageable
    );
}
