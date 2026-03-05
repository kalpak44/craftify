package com.craftify.backend.config;

import static org.springframework.security.config.http.SessionCreationPolicy.STATELESS;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.util.Assert;

@Configuration
public class SecurityConfig {

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(session -> session.sessionCreationPolicy(STATELESS))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(
                        "/swagger-ui", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs", "/v3/api-docs/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.OPTIONS, "/**")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}));

    return http.build();
  }

  @Bean
  public JwtDecoder jwtDecoder(
      @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuerUri,
      @Value("${auth0.audience}") String audience) {
    Assert.hasText(issuerUri, "spring.security.oauth2.resourceserver.jwt.issuer-uri must be set");
    Assert.hasText(audience, "auth0.audience must be set");

    String normalizedIssuer = issuerUri.endsWith("/") ? issuerUri.substring(0, issuerUri.length() - 1) : issuerUri;
    String jwkSetUri = normalizedIssuer + "/.well-known/jwks.json";

    // Avoid startup hard-failure on OIDC discovery outages/timeouts.
    NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
    OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(issuerUri);
    OAuth2TokenValidator<Jwt> withAudience = new AudienceValidator(audience);
    jwtDecoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(withIssuer, withAudience));

    return jwtDecoder;
  }
}
