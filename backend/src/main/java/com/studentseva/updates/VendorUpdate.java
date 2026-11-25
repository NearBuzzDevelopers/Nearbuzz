package com.studentseva.updates;

import com.studentseva.businesses.Business;
import com.studentseva.offerings.Offering;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity mapping the 'updates' table in PostgreSQL (Supabase).
 *
 * Powers the hyperlocal vendor announcement stream (e.g., today's mess menu,
 * hostel room vacancy alerts, stock arrivals, price revisions, or holiday notices),
 * optionally linked to a specific Offering and optionally expiring automatically.
 */
@Entity
@Table(name = "updates")
public class VendorUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offering_id")
    private Offering offering;

    @Enumerated(EnumType.STRING)
    @Column(name = "update_type", nullable = false, length = 50)
    private UpdateType updateType;

    @Column(name = "title", nullable = false, length = 300)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public enum UpdateType {
        MENU_UPDATE,
        HOURS_CHANGE,
        STOCK_ARRIVAL,
        PRICE_CHANGE,
        ANNOUNCEMENT
    }

    public VendorUpdate() {
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

    public Offering getOffering() {
        return offering;
    }

    public void setOffering(Offering offering) {
        this.offering = offering;
    }

    public UpdateType getUpdateType() {
        return updateType;
    }

    public void setUpdateType(UpdateType updateType) {
        this.updateType = updateType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
