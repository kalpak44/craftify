package com.craftify.backend.model;

public class UpsertUserPreferencesRequest {

  private String locale;
  private String theme;
  private Boolean onboardingCompleted;

  public String getLocale() {
    return locale;
  }

  public void setLocale(String locale) {
    this.locale = locale;
  }

  public String getTheme() {
    return theme;
  }

  public void setTheme(String theme) {
    this.theme = theme;
  }

  public Boolean getOnboardingCompleted() {
    return onboardingCompleted;
  }

  public void setOnboardingCompleted(Boolean onboardingCompleted) {
    this.onboardingCompleted = onboardingCompleted;
  }
}
