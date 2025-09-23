package com.craftify.backend;

import static java.time.ZoneOffset.UTC;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@OpenAPIDefinition(
        info = @Info(title = "Craftify API", version = "v1"),
        servers = {@Server(url = "http://localhost:8080")})
@EnableMongoRepositories
@EnableMongoAuditing
public class MainApplication {

    public static void main(String[] args) {
        // Set the default time zone to UTC.
        TimeZone.setDefault(TimeZone.getTimeZone(UTC));

        // Start the Spring Boot application.
        SpringApplication.run(MainApplication.class, args);
    }
}