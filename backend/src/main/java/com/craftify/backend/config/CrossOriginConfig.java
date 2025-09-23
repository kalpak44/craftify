package com.craftify.backend.config;


import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Unified configuration for managing allowed origins for CORS and WebSocket endpoints. */
@Configuration
@ConfigurationProperties(prefix = "app.cors")
public class CrossOriginConfig {

    /** List of allowed origins for both HTTP and WebSocket connections. */
    private List<String> allowedOrigins;

    public List<String> getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }
}