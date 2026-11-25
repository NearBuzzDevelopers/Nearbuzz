package com.studentseva.offerings.dto;

import com.studentseva.offerings.Offering;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Request payload for creating a new business offering (room, meal plan, print rate, etc.).
 */
public record CreateOfferingRequest(
        @NotNull(message = "Offering type is required")
        Offering.OfferingType offeringType,

        @NotBlank(message = "Offering title is required")
        @Size(max = 300, message = "Title cannot exceed 300 characters")
        String title,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.00", message = "Price cannot be negative")
        BigDecimal price,

        @Size(max = 50, message = "Pricing unit cannot exceed 50 characters")
        String pricingUnit,

        Offering.Status status,

        Map<String, Object> attributes
) {
}
