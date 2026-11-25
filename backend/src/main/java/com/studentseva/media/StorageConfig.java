package com.studentseva.media;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;
import java.nio.file.Paths;

/**
 * Configures active StorageService (Cloudflare R2 when configured, local dev directory otherwise)
 * and serves local uploaded files at /uploads/**.
 */
@Configuration
public class StorageConfig implements WebMvcConfigurer {

    private static final Logger log = LoggerFactory.getLogger(StorageConfig.class);

    @Bean
    public StorageService storageService(R2Properties r2) {
        if (r2.isConfigured()) {
            S3Client s3Client = S3Client.builder()
                    .endpointOverride(URI.create(r2.getEndpoint().trim()))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(r2.getAccessKeyId().trim(), r2.getSecretAccessKey().trim())))
                    .region(Region.of("auto"))
                    .serviceConfiguration(S3Configuration.builder()
                            .pathStyleAccessEnabled(true)
                            .build())
                    .build();
            log.info("StorageService initialized with Cloudflare R2 bucket '{}'", r2.getBucket());
            return new CloudflareR2StorageService(s3Client, r2);
        }

        log.info("Cloudflare R2 credentials not configured; using LocalDevStorageService (./uploads)");
        return new LocalDevStorageService();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadUri = Paths.get("uploads").toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadUri);
    }
}
