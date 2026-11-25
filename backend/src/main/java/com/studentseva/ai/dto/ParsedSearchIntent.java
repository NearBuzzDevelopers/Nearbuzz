package com.studentseva.ai.dto;

import com.studentseva.businesses.Business;

import java.math.BigDecimal;
import java.util.List;

/**
 * Structured search parameters extracted from a student's natural-language query.
 */
public record ParsedSearchIntent(
        Business.Category category,
        Double radiusMeters,
        BigDecimal maxPrice,
        List<String> keywords,
        String parserSource
) {
}
