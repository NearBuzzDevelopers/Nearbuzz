package com.studentseva.media;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties binding Cloudflare R2 S3-compatible credentials from application.yml / env vars.
 */
@Configuration
@ConfigurationProperties(prefix = "app.r2")
public class R2Properties {

    private String endpoint = "";
    private String bucket = "nearbuzz-media";
    private String accessKeyId = "";
    private String secretAccessKey = "";
    private String publicUrl = "";

    public boolean isConfigured() {
        return isPresent(endpoint)
                && isPresent(bucket)
                && isPresent(accessKeyId)
                && isPresent(secretAccessKey)
                && isPresent(publicUrl);
    }

    private boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getBucket() {
        return bucket;
    }

    public void setBucket(String bucket) {
        this.bucket = bucket;
    }

    public String getAccessKeyId() {
        return accessKeyId;
    }

    public void setAccessKeyId(String accessKeyId) {
        this.accessKeyId = accessKeyId;
    }

    public String getSecretAccessKey() {
        return secretAccessKey;
    }

    public void setSecretAccessKey(String secretAccessKey) {
        this.secretAccessKey = secretAccessKey;
    }

    public String getPublicUrl() {
        return publicUrl;
    }

    public void setPublicUrl(String publicUrl) {
        this.publicUrl = publicUrl;
    }
}
