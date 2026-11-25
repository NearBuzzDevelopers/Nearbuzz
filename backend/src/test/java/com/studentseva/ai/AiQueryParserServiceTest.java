package com.studentseva.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studentseva.ai.dto.ParsedSearchIntent;
import com.studentseva.businesses.Business;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class AiQueryParserServiceTest {

    private AiQueryParserService parserService;

    @BeforeEach
    void setUp() {
        GeminiProperties props = new GeminiProperties(); // apiKey blank -> rule-based fallback
        parserService = new AiQueryParserService(props, new ObjectMapper());
    }

    @Test
    void extractsHostelCategoryBudgetAndKilometerRadius() {
        ParsedSearchIntent intent = parserService.parse("AC double sharing room under 9000 within 1.5 km");

        assertEquals(Business.Category.HOSTEL_PG, intent.category());
        assertEquals(1500.0, intent.radiusMeters());
        assertEquals(new BigDecimal("9000"), intent.maxPrice());
        assertTrue(intent.keywords().contains("ac"));
        assertTrue(intent.keywords().contains("double"));
        assertEquals("RULE_BASED_FALLBACK", intent.parserSource());
    }

    @Test
    void extractsMessCategoryAndMeterRadius() {
        ParsedSearchIntent intent = parserService.parse("veg tiffin below 3000 within 500 m");

        assertEquals(Business.Category.MESS_TIFFIN, intent.category());
        assertEquals(500.0, intent.radiusMeters());
        assertEquals(new BigDecimal("3000"), intent.maxPrice());
        assertTrue(intent.keywords().contains("veg"));
        assertTrue(intent.keywords().contains("tiffin"));
    }

    @Test
    void clampsExtremeRadiusValuesToMaxFiftyKm() {
        ParsedSearchIntent intent = parserService.parse("color printing shop within 200 km");

        assertEquals(Business.Category.PRINTING, intent.category());
        assertEquals(50_000.0, intent.radiusMeters());
    }

    @Test
    void usesDefaultTwoKmRadiusWhenUnspecified() {
        ParsedSearchIntent intent = parserService.parse("quiet reading library");

        assertEquals(Business.Category.LIBRARY, intent.category());
        assertEquals(2000.0, intent.radiusMeters());
        assertNull(intent.maxPrice());
    }
}
