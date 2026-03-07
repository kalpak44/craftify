package com.craftify.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import jakarta.annotation.Nullable;

public class BomDetail implements Serializable {

  private static final long serialVersionUID = 1L;

  private String id; // BOM-xxx
  private String productId; // finished good item
  private @Nullable String productName;
  private String revision;
  private BomStatus status;
  private @Nullable String description;
  private @Nullable String note;

  private List<BomComponent> components = new ArrayList<>();

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private @Nullable OffsetDateTime createdAt;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private @Nullable OffsetDateTime updatedAt;

  private Integer version;

  public BomDetail id(String id) {
    this.id = id;
    return this;
  }

  @Schema(name = "id", example = "BOM-001")
  @JsonProperty("id")
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public BomDetail productId(String productId) {
    this.productId = productId;
    return this;
  }

  @Schema(name = "productId", example = "ITM-001")
  @NotBlank
  @JsonProperty("productId")
  public String getProductId() {
    return productId;
  }

  public void setProductId(String productId) {
    this.productId = productId;
  }

  public BomDetail productName(@Nullable String productName) {
    this.productName = productName;
    return this;
  }

  @Schema(name = "productName")
  @JsonProperty("productName")
  public @Nullable String getProductName() {
    return productName;
  }

  public void setProductName(@Nullable String productName) {
    this.productName = productName;
  }

  public BomDetail revision(String revision) {
    this.revision = revision;
    return this;
  }

  @Schema(name = "revision", example = "v1")
  @NotBlank
  @JsonProperty("revision")
  public String getRevision() {
    return revision;
  }

  public void setRevision(String revision) {
    this.revision = revision;
  }

  public BomDetail status(BomStatus status) {
    this.status = status;
    return this;
  }

  @NotNull
  @Valid
  @Schema(name = "status")
  @JsonProperty("status")
  public BomStatus getStatus() {
    return status;
  }

  public void setStatus(BomStatus status) {
    this.status = status;
  }

  public BomDetail description(@Nullable String description) {
    this.description = description;
    return this;
  }

  @Schema(name = "description")
  @JsonProperty("description")
  public @Nullable String getDescription() {
    return description;
  }

  public void setDescription(@Nullable String description) {
    this.description = description;
  }

  public BomDetail note(@Nullable String note) {
    this.note = note;
    return this;
  }

  @Schema(name = "note")
  @JsonProperty("note")
  public @Nullable String getNote() {
    return note;
  }

  public void setNote(@Nullable String note) {
    this.note = note;
  }

  public BomDetail components(List<BomComponent> components) {
    this.components = components;
    return this;
  }

  @Schema(name = "components")
  @JsonProperty("components")
  public List<BomComponent> getComponents() {
    return components;
  }

  public void setComponents(List<BomComponent> components) {
    this.components = components;
  }

  public BomDetail createdAt(@Nullable OffsetDateTime createdAt) {
    this.createdAt = createdAt;
    return this;
  }

  @Schema(name = "createdAt")
  @JsonProperty("createdAt")
  public @Nullable OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(@Nullable OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public BomDetail updatedAt(@Nullable OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
    return this;
  }

  @Schema(name = "updatedAt")
  @JsonProperty("updatedAt")
  public @Nullable OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(@Nullable OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  public BomDetail version(Integer version) {
    this.version = version;
    return this;
  }

  @Schema(name = "version")
  @JsonProperty("version")
  public Integer getVersion() {
    return version;
  }

  public void setVersion(Integer version) {
    this.version = version;
  }
}
