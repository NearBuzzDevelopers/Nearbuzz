package com.studentseva.media;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * Local development fallback StorageService when Cloudflare R2 env vars are not configured.
 * Stores files safely inside ./uploads and serves them under /uploads/**.
 */
public class LocalDevStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalDevStorageService.class);
    private final Path rootDir = Paths.get("uploads").toAbsolutePath().normalize();

    @Override
    public StoredObject store(String storageKey, InputStream data, long contentLength, String contentType) {
        try {
            Path target = rootDir.resolve(storageKey).normalize();
            if (!target.startsWith(rootDir)) {
                throw new IllegalArgumentException("Invalid storage key path.");
            }
            Files.createDirectories(target.getParent());
            Files.copy(data, target, StandardCopyOption.REPLACE_EXISTING);
            return new StoredObject(storageKey, "/uploads/" + storageKey);
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store uploaded file locally", ex);
        }
    }

    @Override
    public void delete(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return;
        }
        try {
            Path target = rootDir.resolve(storageKey).normalize();
            if (target.startsWith(rootDir)) {
                Files.deleteIfExists(target);
            }
        } catch (IOException ex) {
            log.warn("Could not delete local media file {}: {}", storageKey, ex.getMessage());
        }
    }

    @Override
    public String getBackendName() {
        return "LOCAL_DEV";
    }
}
