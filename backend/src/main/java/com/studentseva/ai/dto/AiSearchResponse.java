package com.studentseva.ai.dto;

import java.util.List;

/**
 * Response envelope returned by GET /api/v1/ai/search.
 */
public record AiSearchResponse(
        String query,
        ParsedSearchIntent interpretedIntent,
        int totalMatches,
        List<AiSearchMatch> results
) {
}
