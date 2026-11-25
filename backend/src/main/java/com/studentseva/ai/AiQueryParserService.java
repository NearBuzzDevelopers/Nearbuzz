package com.studentseva.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studentseva.ai.dto.ParsedSearchIntent;
import com.studentseva.businesses.Business;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Translates natural-language student search queries (e.g. "AC room under 9000 within 2 km")
 * into structured filters using Google Gemini API, with automatic rule-based NLP fallback
 * when no API key is configured or the external API is unreachable.
 */
@Service
public class AiQueryParserService {

    private static final Logger log = LoggerFactory.getLogger(AiQueryParserService.class);
    private static final double DEFAULT_RADIUS_METERS = 2000.0;
    private static final String GEMINI_URL_TEMPLATE =
            "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}";

    private static final Pattern RADIUS_PATTERN =
            Pattern.compile("(?:within|under|in|radius)?\\s*(\\d+(?:\\.\\d+)?)\\s*(km|kilometers?|m|meters?)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern PRICE_PATTERN =
            Pattern.compile("(?:under|below|max|less\\s+than|upto|up\\s+to|<=|rs\\.?|inr|₹)\\s*(?:rs\\.?|inr|₹)?\\s*(\\d{2,6})\\b", Pattern.CASE_INSENSITIVE);

    private static final Set<String> STOP_WORDS = Set.of(
            "a", "an", "the", "is", "are", "near", "me", "nearby", "around", "close",
            "within", "under", "below", "max", "less", "than", "upto", "up", "to",
            "for", "with", "and", "or", "in", "at", "of", "rs", "inr", "km", "m",
            "meter", "meters", "kilometer", "kilometers", "rupees", "find", "show", "get",
            "need", "want", "looking", "best", "good", "cheap", "affordable", "shop", "shops"
    );

    private static final Map<Business.Category, List<String>> CATEGORY_HINTS = Map.of(
            Business.Category.HOSTEL_PG, List.of("hostel", "pg", "room", "rooms", "accommodation", "bed", "flat", "stay", "sharing"),
            Business.Category.MESS_TIFFIN, List.of("mess", "tiffin", "food", "meal", "meals", "thali", "lunch", "dinner", "breakfast", "dabba"),
            Business.Category.PRINTING, List.of("print", "printing", "xerox", "photocopy", "binding", "scan", "printout"),
            Business.Category.BOOKS_STATIONERY, List.of("book", "books", "stationery", "notebook", "notebooks", "pen", "notes"),
            Business.Category.KIRANA, List.of("kirana", "grocery", "groceries", "snacks", "milk", "water", "general store"),
            Business.Category.LIBRARY, List.of("library", "libraries", "study", "reading", "cabin", "seat", "seats")
    );

    private final GeminiProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public AiQueryParserService(GeminiProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
    }

    public String getActiveMode() {
        return properties.isConfigured() ? "GEMINI_API" : "RULE_BASED_FALLBACK";
    }

    /**
     * Parses a natural-language query into structured search filters.
     */
    public ParsedSearchIntent parse(String query) {
        if (properties.isConfigured()) {
            try {
                return parseWithGemini(query);
            } catch (Exception ex) {
                log.warn("Gemini AI call failed ({}); falling back to rule-based parser.", ex.getMessage());
            }
        }
        return parseWithRules(query);
    }

    private ParsedSearchIntent parseWithGemini(String query) throws Exception {
        String prompt = """
                Extract hyperlocal student service search parameters from this query: "%s"
                Return ONLY a JSON object with exact keys:
                - "category": one of ["HOSTEL_PG", "MESS_TIFFIN", "PRINTING", "BOOKS_STATIONERY", "KIRANA", "LIBRARY"] or null
                - "radiusMeters": number in meters (convert km to meters, default 2000) or null
                - "maxPrice": numeric maximum budget in INR or null
                - "keywords": array of short lowercase feature/item keywords (e.g. ["ac", "wifi", "double", "veg"])
                """.formatted(query.replace("\"", "'"));

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.1
                )
        );

        String rawResponse = restClient.post()
                .uri(GEMINI_URL_TEMPLATE, properties.getModel(), properties.getApiKey().trim())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        JsonNode root = objectMapper.readTree(rawResponse);
        String jsonText = root.path("candidates").path(0)
                .path("content").path("parts").path(0)
                .path("text").asText();

        JsonNode parsed = objectMapper.readTree(jsonText);

        Business.Category category = parseCategory(parsed.path("category").asText(null));
        Double radius = parsed.hasNonNull("radiusMeters")
                ? clampRadius(parsed.get("radiusMeters").asDouble())
                : DEFAULT_RADIUS_METERS;
        BigDecimal maxPrice = parsed.hasNonNull("maxPrice")
                ? BigDecimal.valueOf(parsed.get("maxPrice").asDouble())
                : null;

        List<String> keywords = new ArrayList<>();
        JsonNode kwNode = parsed.path("keywords");
        if (kwNode.isArray()) {
            kwNode.forEach(node -> {
                String kw = node.asText("").trim().toLowerCase();
                if (!kw.isEmpty()) {
                    keywords.add(kw);
                }
            });
        }

        return new ParsedSearchIntent(category, radius, maxPrice, keywords, "GEMINI_API");
    }

    /**
     * Deterministic NLP fallback that extracts category, radius, maxPrice, and feature keywords.
     */
    public ParsedSearchIntent parseWithRules(String query) {
        String lower = query.toLowerCase(Locale.ROOT);

        // 1. Extract radius (km or m)
        double radius = DEFAULT_RADIUS_METERS;
        Matcher radiusMatcher = RADIUS_PATTERN.matcher(lower);
        if (radiusMatcher.find()) {
            double value = Double.parseDouble(radiusMatcher.group(1));
            String unit = radiusMatcher.group(2).toLowerCase(Locale.ROOT);
            radius = clampRadius(unit.startsWith("km") || unit.startsWith("kilo") ? value * 1000.0 : value);
            lower = radiusMatcher.replaceFirst(" ");
        }

        // 2. Extract max budget
        BigDecimal maxPrice = null;
        Matcher priceMatcher = PRICE_PATTERN.matcher(lower);
        if (priceMatcher.find()) {
            maxPrice = new BigDecimal(priceMatcher.group(1));
            lower = priceMatcher.replaceFirst(" ");
        }

        // 3. Infer Business.Category from matched tokens
        Set<String> tokens = tokenize(lower);
        Business.Category inferredCategory = inferCategory(tokens);

        // 4. Keep remaining meaningful feature/attribute keywords
        List<String> keywords = tokens.stream()
                .filter(t -> !STOP_WORDS.contains(t))
                .filter(t -> !t.matches("\\d+"))
                .distinct()
                .toList();

        return new ParsedSearchIntent(inferredCategory, radius, maxPrice, keywords, "RULE_BASED_FALLBACK");
    }

    private Business.Category inferCategory(Set<String> tokens) {
        for (Map.Entry<Business.Category, List<String>> entry : CATEGORY_HINTS.entrySet()) {
            for (String hint : entry.getValue()) {
                if (tokens.contains(hint)) {
                    return entry.getKey();
                }
            }
        }
        return null;
    }

    private Set<String> tokenize(String text) {
        Set<String> result = new LinkedHashSet<>();
        for (String raw : text.split("[^a-z0-9]+")) {
            if (raw.length() >= 2) {
                result.add(raw);
            }
        }
        return result;
    }

    private Business.Category parseCategory(String raw) {
        if (raw == null || raw.isBlank() || "null".equalsIgnoreCase(raw)) {
            return null;
        }
        try {
            return Business.Category.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private double clampRadius(double meters) {
        return Math.min(Math.max(meters, 100.0), 50000.0);
    }
}
