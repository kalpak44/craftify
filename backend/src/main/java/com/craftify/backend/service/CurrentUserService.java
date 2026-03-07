package com.craftify.backend.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

  public String requiredSub() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null) {
      throw new IllegalStateException("missing_authentication");
    }
    Object principal = authentication.getPrincipal();
    if (!(principal instanceof Jwt jwt)) {
      throw new IllegalStateException("missing_jwt_principal");
    }
    String sub = jwt.getSubject();
    if (sub == null || sub.isBlank()) {
      throw new IllegalStateException("missing_sub_claim");
    }
    return sub.trim();
  }
}
