package com.studentseva.businesses;

import jakarta.persistence.*;

import java.time.LocalTime;
import java.util.UUID;

/**
 * JPA Entity mapping the 'business_hours' table in PostgreSQL (Supabase).
 *
 * Stores weekly operating schedule per day (0 = Sunday .. 6 = Saturday),
 * matching PostgreSQL SMALLINT and TIME column definitions.
 */
@Entity
@Table(
        name = "business_hours",
        uniqueConstraints = @UniqueConstraint(columnNames = {"business_id", "day_of_week"})
)
public class BusinessHours {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    /**
     * 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
     * Mapped as Short to match PostgreSQL SMALLINT under hibernate.ddl-auto=validate.
     */
    @Column(name = "day_of_week", nullable = false)
    private Short dayOfWeek;

    @Column(name = "opens_at")
    private LocalTime opensAt;

    @Column(name = "closes_at")
    private LocalTime closesAt;

    @Column(name = "is_closed", nullable = false)
    private boolean closed;

    public BusinessHours() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Business getBusiness() {
        return business;
    }

    public void setBusiness(Business business) {
        this.business = business;
    }

    public Short getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(Short dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public LocalTime getOpensAt() {
        return opensAt;
    }

    public void setOpensAt(LocalTime opensAt) {
        this.opensAt = opensAt;
    }

    public LocalTime getClosesAt() {
        return closesAt;
    }

    public void setClosesAt(LocalTime closesAt) {
        this.closesAt = closesAt;
    }

    public boolean isClosed() {
        return closed;
    }

    public void setClosed(boolean closed) {
        this.closed = closed;
    }
}
