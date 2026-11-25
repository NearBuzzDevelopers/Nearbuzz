package com.studentseva.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for Google Gemini AI query parsing.
 * Falls back gracefully to rule-based NLP parsing when GEMINI_API_KEY is unset.
 */
@Configuration
@ConfigurationProperties(prefix = "app.gemini")
public class GeminiProperties {

    private String apiKey = "";
    private String model = "gemini-2.0-flash";

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }
}
