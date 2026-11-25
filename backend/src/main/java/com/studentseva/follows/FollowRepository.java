package com.studentseva.follows;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for user-to-business follow relationships.
 */
@Repository
public interface FollowRepository extends JpaRepository<Follow, UUID> {

    boolean existsByUserIdAndBusinessId(UUID userId, UUID businessId);

    void deleteByUserIdAndBusinessId(UUID userId, UUID businessId);

    long countByBusinessId(UUID businessId);

    @Query("""
            SELECT f FROM Follow f
            JOIN FETCH f.business b
            WHERE f.user.id = :userId
            ORDER BY f.createdAt DESC
            """)
    List<Follow> findByUserIdWithBusinessOrderByCreatedAtDesc(@Param("userId") UUID userId);
}
