package com.studentseva.offerings;

import com.studentseva.businesses.Business;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * JPA Entity mapping the 'offerings' table in PostgreSQL (Supabase).
 *
 * Represents granular, live-availability services or products offered by a business:
 *   - Hostel/PG rooms (Single AC, Triple Non-AC)
 *   - Mess/Tiffin menus (Monthly Meal Plan, Single Thali)
 *   - Printing services (B&W Xerox, Color Laser Print)
 *   - Books & Stationery / Kirana stock items
 *   - Library reading seats / cabins
 *
 * Uses PostgreSQL JSONB (`attributes`) for category-specific fields without schema rigidity,
 * and JPA `@Version` optimistic locking to prevent concurrent vendor updates from colliding.
 */
@Entity
@Table(name = "offerings")
public class Offering {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @Enumerated(EnumType.STRING)
    @Column(name = "offering_type", nullable = false, length = 50)
    private OfferingType offeringType;

    @Column(name = "title", nullable = false, length = 300)
    private String title;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "pricing_unit", length = 50)
    private String pricingUnit;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private Status status;

    @Column(name = "last_confirmed_at", nullable = false)
    private Instant lastConfirmedAt;

    /**
     * Flexible category-specific metadata stored as PostgreSQL JSONB.
     * Examples:
     *   HOSTEL_ROOM   -> {"ac": true, "wifi": true, "sharing": 2, "attachedWashroom": true}
     *   MESS_MENU     -> {"isVeg": true, "mealTime": "LUNCH_DINNER", "items": ["Dal", "Paneer"]}
     *   PRINT_SERVICE -> {"duplex": true, "paperSize": "A4", "bindingAvailable": true}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attributes", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> attributes = new HashMap<>();

    /**
     * Optimistic locking counter incremented automatically by JPA on every update.
     */
    @Version
    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.lastConfirmedAt == null) {
            this.lastConfirmedAt = now;
        }
        if (this.status == null) {
            this.status = Status.AVAILABLE;
        }
        if (this.price == null) {
            this.price = BigDecimal.ZERO;
        }
        if (this.attributes == null) {
            this.attributes = new HashMap<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public enum OfferingType {
        HOSTEL_ROOM,
        MESS_MENU,
        PRINT_SERVICE,
        PRODUCT_STOCK,
        LIBRARY_SEAT
    }

    public enum Status {
        AVAILABLE,
        OCCUPIED,
        SOLD_OUT,
        OUT_OF_STOCK,
        UNAVAILABLE,
        UNCONFIRMED
    }

    public Offering() {
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

    public OfferingType getOfferingType() {
        return offeringType;
    }

    public void setOfferingType(OfferingType offeringType) {
        this.offeringType = offeringType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getPricingUnit() {
        return pricingUnit;
    }

    public void setPricingUnit(String pricingUnit) {
        this.pricingUnit = pricingUnit;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Instant getLastConfirmedAt() {
        return lastConfirmedAt;
    }

    public void setLastConfirmedAt(Instant lastConfirmedAt) {
        this.lastConfirmedAt = lastConfirmedAt;
    }

    public Map<String, Object> getAttributes() {
        return attributes;
    }

    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes != null ? new HashMap<>(attributes) : new HashMap<>();
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
