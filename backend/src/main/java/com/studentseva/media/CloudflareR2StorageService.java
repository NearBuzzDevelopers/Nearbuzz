package com.studentseva.media;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.InputStream;

/**
 * Production object storage implementation backed by Cloudflare R2 (via AWS SDK v2 S3 API).
 */
public class CloudflareR2StorageService implements StorageService {

    private final S3Client s3Client;
    private final R2Properties properties;

    public CloudflareR2StorageService(S3Client s3Client, R2Properties properties) {
        this.s3Client = s3Client;
        this.properties = properties;
    }

    @Override
    public StoredObject store(String storageKey, InputStream data, long contentLength, String contentType) {
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(properties.getBucket())
                .key(storageKey)
                .contentType(contentType)
                .contentLength(contentLength)
                .build();

        s3Client.putObject(putRequest, RequestBody.fromInputStream(data, contentLength));

        String baseUrl = properties.getPublicUrl().replaceAll("/+$", "");
        return new StoredObject(storageKey, baseUrl + "/" + storageKey);
    }

    @Override
    public void delete(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return;
        }
        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(properties.getBucket())
                .key(storageKey)
                .build();
        s3Client.deleteObject(deleteRequest);
    }

    @Override
    public String getBackendName() {
        return "CLOUDFLARE_R2";
    }
}
