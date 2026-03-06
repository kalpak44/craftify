package com.craftify.backend.model;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.springframework.lang.Nullable;

public class WorkItemDetail implements Serializable {

  private static final long serialVersionUID = 1L;

  private @Nullable String id;
  private @Nullable String bomId;
  private @Nullable String parentBomItem;
  private @Nullable String bomVersion;
  private @Nullable Integer componentsCount;
  private @Nullable BigDecimal requestedQty;
  private @Nullable OffsetDateTime requestedAt;
  private @Nullable WorkItemStatus status;
  private @Nullable OffsetDateTime createdAt;
  private @Nullable OffsetDateTime updatedAt;
  private @Nullable Integer version;

  public @Nullable String getId() {
    return id;
  }

  public void setId(@Nullable String id) {
    this.id = id;
  }

  public @Nullable String getBomId() {
    return bomId;
  }

  public void setBomId(@Nullable String bomId) {
    this.bomId = bomId;
  }

  public @Nullable String getParentBomItem() {
    return parentBomItem;
  }

  public void setParentBomItem(@Nullable String parentBomItem) {
    this.parentBomItem = parentBomItem;
  }

  public @Nullable String getBomVersion() {
    return bomVersion;
  }

  public void setBomVersion(@Nullable String bomVersion) {
    this.bomVersion = bomVersion;
  }

  public @Nullable Integer getComponentsCount() {
    return componentsCount;
  }

  public void setComponentsCount(@Nullable Integer componentsCount) {
    this.componentsCount = componentsCount;
  }

  public @Nullable BigDecimal getRequestedQty() {
    return requestedQty;
  }

  public void setRequestedQty(@Nullable BigDecimal requestedQty) {
    this.requestedQty = requestedQty;
  }

  public @Nullable OffsetDateTime getRequestedAt() {
    return requestedAt;
  }

  public void setRequestedAt(@Nullable OffsetDateTime requestedAt) {
    this.requestedAt = requestedAt;
  }

  public @Nullable WorkItemStatus getStatus() {
    return status;
  }

  public void setStatus(@Nullable WorkItemStatus status) {
    this.status = status;
  }

  public @Nullable OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(@Nullable OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public @Nullable OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(@Nullable OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  public @Nullable Integer getVersion() {
    return version;
  }

  public void setVersion(@Nullable Integer version) {
    this.version = version;
  }
}
