package com.studentseva.media;

import java.io.InputStream;

/**
 * Abstraction over object storage (Cloudflare R2 in production, local filesystem in dev fallback).
 */
public interface StorageService {

    record StoredObject(String storageKey, String publicUrl) {
    }

    StoredObject store(String storageKey, InputStream data, long contentLength, String contentType);

    void delete(String storageKey);

    String getBackendName();
}
