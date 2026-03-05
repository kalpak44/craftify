package com.craftify.backend.config;

import java.util.List;

import org.jspecify.annotations.NonNull;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

public class AudienceValidator implements OAuth2TokenValidator<Jwt> {

  private static final OAuth2Error INVALID_TOKEN_ERROR =
      new OAuth2Error(
          "invalid_token",
          "The required audience is missing",
          "https://tools.ietf.org/html/rfc6750#section-3.1");

  private final String audience;

  public AudienceValidator(String audience) {
    this.audience = audience;
  }

  @Override
  @NonNull
  public OAuth2TokenValidatorResult validate(Jwt jwt) {
    List<String> audiences = jwt.getAudience();
    if (audiences != null && audiences.contains(audience)) {
      return OAuth2TokenValidatorResult.success();
    }
    return OAuth2TokenValidatorResult.failure(INVALID_TOKEN_ERROR);
  }
}
