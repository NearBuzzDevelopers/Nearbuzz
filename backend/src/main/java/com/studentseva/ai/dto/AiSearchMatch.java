package com.studentseva.ai.dto;

import com.studentseva.businesses.dto.NearbyBusinessResponse;
import com.studentseva.offerings.dto.OfferingResponse;

import java.util.List;

/**
 * Single ranked search hit combining PostGIS nearby business details and matching offerings.
 */
public record AiSearchMatch(
        NearbyBusinessResponse business,
        List<OfferingResponse> matchingOfferings
) {
}
