package com.craftify.backend.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;

import java.io.Serializable;
import java.time.OffsetDateTime;

public class BomList implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private String productId;
    private String productName;
    private String revision;
    private BomStatus status;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private @Nullable OffsetDateTime updatedAt;

    private Integer componentsCount;

    public BomList id(String id) { this.id = id; return this; }
    @Schema(name = "id", example = "BOM-001")
    @JsonProperty("id")
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public BomList productId(String productId) { this.productId = productId; return this; }
    @Schema(name = "productId", example = "ITM-001")
    @JsonProperty("productId")
    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public BomList productName(String productName) { this.productName = productName; return this; }
    @Schema(name = "productName")
    @JsonProperty("productName")
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public BomList revision(String revision) { this.revision = revision; return this; }
    @Schema(name = "revision", example = "v1")
    @JsonProperty("revision")
    public String getRevision() { return revision; }
    public void setRevision(String revision) { this.revision = revision; }

    public BomList status(BomStatus status) { this.status = status; return this; }
    @Schema(name = "status")
    @JsonProperty("status")
    public BomStatus getStatus() { return status; }
    public void setStatus(BomStatus status) { this.status = status; }

    public BomList updatedAt(@Nullable OffsetDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
    @Schema(name = "updatedAt")
    @JsonProperty("updatedAt")
    public @Nullable OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(@Nullable OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public BomList componentsCount(Integer componentsCount) { this.componentsCount = componentsCount; return this; }
    @Schema(name = "componentsCount")
    @JsonProperty("componentsCount")
    public Integer getComponentsCount() { return componentsCount; }
    public void setComponentsCount(Integer componentsCount) { this.componentsCount = componentsCount; }
}
