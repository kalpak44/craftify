package com.craftify.backend.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_preferences")
public class UserPreferenceEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "owner_sub", nullable = false, length = 191, unique = true)
  private String ownerSub;

  @Column(name = "locale", nullable = false, length = 16)
  private String locale;

  @Column(name = "theme", nullable = false, length = 16)
  private String theme;

  @Column(name = "onboarding_completed", nullable = false)
  private boolean onboardingCompleted;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  @Version
  @Column(name = "version", nullable = false)
  private long version;

  @PrePersist
  void prePersist() {
    OffsetDateTime now = OffsetDateTime.now();
    if (createdAt == null) {
      createdAt = now;
    }
    updatedAt = now;
  }

  @PreUpdate
  void preUpdate() {
    updatedAt = OffsetDateTime.now();
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getOwnerSub() {
    return ownerSub;
  }

  public void setOwnerSub(String ownerSub) {
    this.ownerSub = ownerSub;
  }

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

  public boolean isOnboardingCompleted() {
    return onboardingCompleted;
  }

  public void setOnboardingCompleted(boolean onboardingCompleted) {
    this.onboardingCompleted = onboardingCompleted;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  public long getVersion() {
    return version;
  }

  public void setVersion(long version) {
    this.version = version;
  }
}
