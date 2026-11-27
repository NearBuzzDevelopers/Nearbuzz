package com.studentseva.businesses.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Map;

/**
 * Partial update payload for persisting shop-wide JSONB settings (rules, facilities, rush mode, policies).
 */
public record UpdateBusinessMetadataRequest(
        @NotNull(message = "metadata map is required")
        Map<String, Object> metadata
) {
}
