package com.studentseva.businesses;

import com.studentseva.users.User;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * JPA Entity mapping the 'businesses' table in PostgreSQL (Supabase).
 *
 * Utilizes PostGIS GEOGRAPHY(Point, 4326) to store accurate geodesic
 * GPS coordinates on the Earth's surface with GiST spatial indexing.
 */
@Entity
@Table(name = "businesses")
public class Business {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "name", nullable = false, length = 300)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private Category category;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "address", nullable = false, columnDefinition = "TEXT")
    private String address;

    /**
     * PostGIS Spatial Geometry.
     * SRID 4326 = WGS 84 (Standard GPS latitude / longitude).
     *
     * In JTS geometry:
     *   Point.getX() = Longitude
     *   Point.getY() = Latitude
     */
    @Column(name = "location", columnDefinition = "geography(Point, 4326)", nullable = false)
    private Point location;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "whatsapp", length = 30)
    private String whatsapp;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private Status status;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 30)
    private VerificationStatus verificationStatus;

    /**
     * Category-specific shop settings, rules, policies, and facilities stored as JSONB.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> metadata = new HashMap<>();

    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.status == null) {
            this.status = Status.OPEN;
        }
        if (this.verificationStatus == null) {
            this.verificationStatus = VerificationStatus.VERIFIED;
        }
        if (this.metadata == null) {
            this.metadata = new HashMap<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public enum Category {
        HOSTEL_PG,
        MESS_TIFFIN,
        PRINTING,
        BOOKS_STATIONERY,
        KIRANA,
        LIBRARY;

        /**
         * Canonical short slug used by frontend vendor dashboards (/vendor/{businessType}).
         */
        public String toBusinessType() {
            return switch (this) {
                case HOSTEL_PG -> "hostel";
                case MESS_TIFFIN -> "mess";
                case PRINTING -> "printing";
                case BOOKS_STATIONERY -> "books";
                case KIRANA -> "kirana";
                case LIBRARY -> "library";
            };
        }

        /**
         * Resolves a Category from either the short frontend businessType slug or enum name.
         */
        public static Category fromBusinessType(String businessType) {
            if (businessType == null || businessType.isBlank()) {
                return null;
            }
            return switch (businessType.trim().toLowerCase()) {
                case "hostel", "hostel_pg" -> HOSTEL_PG;
                case "mess", "mess_tiffin" -> MESS_TIFFIN;
                case "printing" -> PRINTING;
                case "books", "books_stationery" -> BOOKS_STATIONERY;
                case "kirana" -> KIRANA;
                case "library" -> LIBRARY;
                default -> throw new IllegalArgumentException("Unsupported businessType: " + businessType);
            };
        }
    }

    public enum Status {
        OPEN,
        CLOSED,
        TEMPORARILY_CLOSED
    }

    public enum VerificationStatus {
        PENDING,
        VERIFIED,
        SUSPENDED
    }

    public Business() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Point getLocation() {
        return location;
    }

    public void setLocation(Point location) {
        this.location = location;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getWhatsapp() {
        return whatsapp;
    }

    public void setWhatsapp(String whatsapp) {
        this.whatsapp = whatsapp;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public VerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(VerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata != null ? new HashMap<>(metadata) : new HashMap<>();
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

