package com.craftify.backend;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import java.util.TimeZone;

import static java.time.ZoneOffset.UTC;

@SpringBootApplication
@ConfigurationPropertiesScan("com.craftify.backend.config")
@OpenAPIDefinition(
        info = @Info(title = "Craftify API", version = "v1"),
        servers = {@Server(url = "http://localhost:8080")})
public class MainApplication {

    public static void main(String[] args) {
        // Set the default time zone to UTC.
        TimeZone.setDefault(TimeZone.getTimeZone(UTC));

        // Start the Spring Boot application.
        SpringApplication.run(MainApplication.class, args);
    }
}