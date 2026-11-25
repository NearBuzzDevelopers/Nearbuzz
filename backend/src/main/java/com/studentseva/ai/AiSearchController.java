package com.studentseva.ai;

import com.studentseva.ai.dto.AiSearchResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST controller exposing natural-language AI search powered by Google Gemini + PostGIS.
 */
@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "AI Search", description = "Natural-language hyperlocal discovery powered by Google Gemini and PostGIS")
public class AiSearchController {

    private final AiSearchService aiSearchService;
    private final AiQueryParserService parserService;
    private final GeminiProperties geminiProperties;

    public AiSearchController(
            AiSearchService aiSearchService,
            AiQueryParserService parserService,
            GeminiProperties geminiProperties
    ) {
        this.aiSearchService = aiSearchService;
        this.parserService = parserService;
        this.geminiProperties = geminiProperties;
    }

    @GetMapping("/search")
    @Operation(summary = "Search nearby student services using natural language (public)")
    public ResponseEntity<AiSearchResponse> search(
            @RequestParam String query,
            @RequestParam Double lat,
            @RequestParam Double lng
    ) {
        return ResponseEntity.ok(aiSearchService.search(query, lat, lng));
    }

    @GetMapping("/status")
    @Operation(summary = "Check whether Google Gemini API or rule-based NLP fallback is active (public)")
    public ResponseEntity<Map<String, String>> getStatus() {
        return ResponseEntity.ok(Map.of(
                "mode", parserService.getActiveMode(),
                "model", geminiProperties.getModel()
        ));
    }
}
