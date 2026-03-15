package com.craftify.backend.service;

import com.craftify.backend.error.ApiException;
import com.craftify.backend.model.UpsertUserPreferencesRequest;
import com.craftify.backend.model.UserPreferences;
import com.craftify.backend.persistence.entity.UserPreferenceEntity;
import com.craftify.backend.persistence.repository.UserPreferenceRepository;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserPreferenceService {

  private static final String DEFAULT_LOCALE = "en";
  private static final String DEFAULT_THEME = "dark";

  private final CurrentUserService currentUserService;
  private final UserPreferenceRepository userPreferenceRepository;

  public UserPreferenceService(
      CurrentUserService currentUserService, UserPreferenceRepository userPreferenceRepository) {
    this.currentUserService = currentUserService;
    this.userPreferenceRepository = userPreferenceRepository;
  }

  @Transactional(readOnly = true)
  public UserPreferences getCurrentUserPreferences() {
    String ownerSub = currentUserService.requiredSub();
    return userPreferenceRepository
        .findByOwnerSub(ownerSub)
        .map(this::toModel)
        .orElseGet(() -> new UserPreferences(DEFAULT_LOCALE, DEFAULT_THEME, false));
  }

  @Transactional
  public UserPreferences saveCurrentUserPreferences(UpsertUserPreferencesRequest request) {
    String ownerSub = currentUserService.requiredSub();
    UserPreferenceEntity entity =
        userPreferenceRepository.findByOwnerSub(ownerSub).orElseGet(UserPreferenceEntity::new);

    entity.setOwnerSub(ownerSub);
    entity.setLocale(normalizeLocale(request.getLocale()));
    entity.setTheme(normalizeTheme(request.getTheme()));
    entity.setOnboardingCompleted(Boolean.TRUE.equals(request.getOnboardingCompleted()));

    return toModel(userPreferenceRepository.save(entity));
  }

  private UserPreferences toModel(UserPreferenceEntity entity) {
    return new UserPreferences(entity.getLocale(), entity.getTheme(), entity.isOnboardingCompleted());
  }

  private String normalizeLocale(String locale) {
    String value = locale == null ? "" : locale.trim().toLowerCase(Locale.ROOT);
    if (value.isBlank()) {
      throw ApiException.badRequest("preferences_locale_required");
    }
    return value;
  }

  private String normalizeTheme(String theme) {
    String value = theme == null ? "" : theme.trim().toLowerCase(Locale.ROOT);
    if (!"light".equals(value) && !"dark".equals(value)) {
      throw ApiException.badRequest("preferences_theme_invalid");
    }
    return value;
  }
}
