package com.craftify.backend.controller.impl;

import com.craftify.backend.model.UpsertUserPreferencesRequest;
import com.craftify.backend.model.UserPreferences;
import com.craftify.backend.service.UserPreferenceService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserPreferencesApiController {

  private final UserPreferenceService userPreferenceService;

  public UserPreferencesApiController(UserPreferenceService userPreferenceService) {
    this.userPreferenceService = userPreferenceService;
  }

  @GetMapping(value = "/me/preferences", produces = {"application/json"})
  public ResponseEntity<UserPreferences> mePreferencesGet() {
    return ResponseEntity.ok(userPreferenceService.getCurrentUserPreferences());
  }

  @PutMapping(value = "/me/preferences", produces = {"application/json"}, consumes = {"application/json"})
  public ResponseEntity<UserPreferences> mePreferencesPut(
      @Valid @NotNull @RequestBody UpsertUserPreferencesRequest request) {
    return ResponseEntity.ok(userPreferenceService.saveCurrentUserPreferences(request));
  }
}
