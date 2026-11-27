package com.studentseva.businesses;

import com.studentseva.businesses.dto.BusinessResponse;
import com.studentseva.businesses.dto.CreateBusinessRequest;
import com.studentseva.businesses.dto.NearbyBusinessProjection;
import com.studentseva.businesses.dto.NearbyBusinessResponse;
import com.studentseva.common.exceptions.ForbiddenException;
import com.studentseva.common.exceptions.NotFoundException;
import com.studentseva.users.User;
import com.studentseva.users.UserRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service managing business lifecycle and spatial coordinates conversion.
 */
@Service
public class BusinessService {

    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;

    /**
     * JTS GeometryFactory initialized with SRID 4326 (WGS 84 GPS standard).
     */
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public BusinessService(BusinessRepository businessRepository, UserRepository userRepository) {
        this.businessRepository = businessRepository;
        this.userRepository = userRepository;
    }

    /**
     * Registers a new business listing for the authenticated user.
     * Upgrades the user's role to VENDOR if they were previously STUDENT.
     */
    @Transactional
    public BusinessResponse createBusiness(CreateBusinessRequest request, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new NotFoundException("Owner user not found with email: " + ownerEmail));

        if (businessRepository.existsByOwnerId(owner.getId())) {
            throw new IllegalStateException("You already have a registered business. Only one business per account is allowed currently.");
        }

        // In JTS Geometry: X = Longitude, Y = Latitude
        Business.Category resolvedCategory = resolveCategory(request);
        Point location = geometryFactory.createPoint(new Coordinate(request.longitude(), request.latitude()));

        Business business = new Business();
        business.setOwner(owner);
        business.setName(request.name().trim());
        business.setCategory(resolvedCategory);
        business.setDescription(request.description() != null ? request.description().trim() : null);
        business.setAddress(request.address().trim());
        business.setLocation(location);
        business.setPhone(request.phone() != null ? request.phone().trim() : null);
        business.setWhatsapp(request.whatsapp() != null ? request.whatsapp().trim() : null);
        if (request.metadata() != null) {
            business.setMetadata(request.metadata());
        }

        Business saved = businessRepository.save(business);

        // Auto-upgrade role to VENDOR if currently STUDENT
        if (owner.getRole() == User.Role.STUDENT) {
            owner.setRole(User.Role.VENDOR);
            userRepository.save(owner);
        }

        return toBusinessResponse(saved);
    }

    /**
     * Updates the authenticated owner's shop profile, address, contact info, and GPS coordinates.
     */
    @Transactional
    public BusinessResponse updateMyBusiness(CreateBusinessRequest request, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new NotFoundException("Owner user not found with email: " + ownerEmail));

        Business business = businessRepository.findByOwnerId(owner.getId())
                .orElseThrow(() -> new NotFoundException("No business listing found for your account."));

        Business.Category resolvedCategory = resolveCategory(request);
        Point location = geometryFactory.createPoint(new Coordinate(request.longitude(), request.latitude()));
        business.setName(request.name().trim());
        business.setCategory(resolvedCategory);
        business.setDescription(request.description() != null ? request.description().trim() : null);
        business.setAddress(request.address().trim());
        business.setLocation(location);
        business.setPhone(request.phone() != null ? request.phone().trim() : null);
        business.setWhatsapp(request.whatsapp() != null ? request.whatsapp().trim() : null);
        if (request.metadata() != null) {
            business.setMetadata(request.metadata());
        }

        Business saved = businessRepository.saveAndFlush(business);
        return toBusinessResponse(saved);
    }

    /**
     * Merges updated category-specific settings/rules into the owner's business metadata JSONB map.
     */
    @Transactional
    public BusinessResponse updateMyBusinessMetadata(Map<String, Object> updates, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new NotFoundException("Owner user not found with email: " + ownerEmail));

        Business business = businessRepository.findByOwnerId(owner.getId())
                .orElseThrow(() -> new NotFoundException("No business listing found for your account."));

        Map<String, Object> merged = business.getMetadata() != null
                ? new HashMap<>(business.getMetadata())
                : new HashMap<>();
        if (updates != null) {
            merged.putAll(updates);
        }
        business.setMetadata(merged);

        Business saved = businessRepository.saveAndFlush(business);
        return toBusinessResponse(saved);
    }

    /**
     * Lists all OPEN, non-suspended businesses across all locations, ordered by distance from (lat, lng).
     */
    @Transactional(readOnly = true)
    public List<NearbyBusinessResponse> listAllOpenBusinesses(
            Double lat,
            Double lng,
            Business.Category category
    ) {
        double refLat = (lat != null && lat >= -90.0 && lat <= 90.0) ? lat : 28.475;
        double refLng = (lng != null && lng >= -180.0 && lng <= 180.0) ? lng : 77.495;
        String categoryName = category != null ? category.name() : null;

        return businessRepository.findAllOpenOrderedByDistance(refLat, refLng, categoryName, 100)
                .stream()
                .map(this::toNearbyResponse)
                .toList();
    }

    /**
     * Retrieves the business belonging to the currently authenticated user.
     */
    @Transactional(readOnly = true)
    public BusinessResponse getMyBusiness(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new NotFoundException("User not found with email: " + ownerEmail));

        Business business = businessRepository.findByOwnerId(owner.getId())
                .orElseThrow(() -> new NotFoundException("No business listing found for your account."));

        return toBusinessResponse(business);
    }

    /**
     * Retrieves a business by its UUID.
     */
    @Transactional(readOnly = true)
    public BusinessResponse getBusinessById(UUID id) {
        Business business = businessRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Business not found with ID: " + id));

        return toBusinessResponse(business);
    }

    /**
     * Loads a business by ID and verifies that the authenticated user is its owner.
     */
    @Transactional(readOnly = true)
    public Business getOwnedBusiness(UUID businessId, String userEmail) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new NotFoundException("Business not found with ID: " + businessId));

        if (!business.getOwner().getEmail().equalsIgnoreCase(userEmail)) {
            throw new ForbiddenException("You do not have permission to manage this business.");
        }
        return business;
    }

    /**
     * Searches for nearby businesses within a given radius using PostGIS ST_DWithin and ST_Distance.
     */
    @Transactional(readOnly = true)
    public List<NearbyBusinessResponse> searchNearby(
            Double lat,
            Double lng,
            Double radiusMeters,
            Business.Category category
    ) {
        if (lat == null || lat < -90.0 || lat > 90.0) {
            throw new IllegalArgumentException("Valid latitude between -90.0 and 90.0 is required.");
        }
        if (lng == null || lng < -180.0 || lng > 180.0) {
            throw new IllegalArgumentException("Valid longitude between -180.0 and 180.0 is required.");
        }

        double radius = (radiusMeters == null || radiusMeters <= 0) ? 2000.0 : Math.min(radiusMeters, 50000.0);
        int limit = 50;

        List<NearbyBusinessProjection> projections = (category != null)
                ? businessRepository.findNearbyByCategory(lat, lng, radius, category.name(), limit)
                : businessRepository.findNearby(lat, lng, radius, limit);

        return projections.stream()
                .map(this::toNearbyResponse)
                .toList();
    }

    private NearbyBusinessResponse toNearbyResponse(NearbyBusinessProjection p) {
        return new NearbyBusinessResponse(
                p.getId(),
                p.getOwnerId(),
                p.getOwnerName(),
                p.getName(),
                p.getCategory(),
                p.getDescription(),
                p.getAddress(),
                p.getLatitude(),
                p.getLongitude(),
                p.getPhone(),
                p.getWhatsapp(),
                p.getStatus(),
                p.getVerificationStatus(),
                p.getDistanceMeters(),
                p.getCreatedAt()
        );
    }

    /**
     * Maps a Business entity to a clean API response DTO.
     */
    public BusinessResponse toBusinessResponse(Business b) {
        // In JTS Point: getX() is Longitude, getY() is Latitude
        Double longitude = b.getLocation() != null ? b.getLocation().getX() : null;
        Double latitude = b.getLocation() != null ? b.getLocation().getY() : null;

        return new BusinessResponse(
                b.getId(),
                b.getOwner().getId(),
                b.getOwner().getName(),
                b.getName(),
                b.getCategory().name(),
                b.getCategory().toBusinessType(),
                b.getDescription(),
                b.getAddress(),
                latitude,
                longitude,
                b.getPhone(),
                b.getWhatsapp(),
                b.getStatus().name(),
                b.getVerificationStatus().name(),
                b.getMetadata() != null ? b.getMetadata() : Map.of(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }

    private Business.Category resolveCategory(CreateBusinessRequest request) {
        if (request.businessType() != null && !request.businessType().isBlank()) {
            return Business.Category.fromBusinessType(request.businessType());
        }
        if (request.category() != null) {
            return request.category();
        }
        throw new IllegalArgumentException("Either businessType or category is required.");
    }
}

