package com.studentseva.offerings.dto;

import com.studentseva.offerings.Offering;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Request payload for updating an existing offering's price, status, or JSONB attributes.
 * Includes optional `expectedVersion` for optimistic concurrency control across clients.
 */
public record UpdateOfferingRequest(
        Offering.OfferingType offeringType,

        @Size(max = 300, message = "Title cannot exceed 300 characters")
        String title,

        @DecimalMin(value = "0.00", message = "Price cannot be negative")
        BigDecimal price,

        @Size(max = 50, message = "Pricing unit cannot exceed 50 characters")
        String pricingUnit,

        Offering.Status status,

        Map<String, Object> attributes,

        Integer expectedVersion
) {
}
