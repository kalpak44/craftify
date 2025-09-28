package com.craftify.backend.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.annotation.Generated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * ItemDetail
 */

public class ItemDetail implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;

    private String code;

    private String name;

    private Status status;

    private String categoryName;

    private String uomBase;

    private @Nullable String description;

    @Valid
    private List<@Valid ItemUom> uoms = new ArrayList<>();

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private @Nullable OffsetDateTime createdAt;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private @Nullable OffsetDateTime updatedAt;

    private Integer version;

    public ItemDetail() {
        super();
    }

    /**
     * Constructor with only required parameters
     */
    public ItemDetail(String id, String code, String name, Status status, String categoryName, String uomBase, Integer version) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.status = status;
        this.categoryName = categoryName;
        this.uomBase = uomBase;
        this.version = version;
    }

    public ItemDetail id(String id) {
        this.id = id;
        return this;
    }

    /**
     * Get id
     *
     * @return id
     */
    @NotNull
    @Valid
    @Schema(name = "id", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("id")
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public ItemDetail code(String code) {
        this.code = code;
        return this;
    }

    /**
     * Get code
     *
     * @return code
     */
    @NotNull
    @Schema(name = "code", example = "ITM-001", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("code")
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public ItemDetail name(String name) {
        this.name = name;
        return this;
    }

    /**
     * Get name
     *
     * @return name
     */
    @NotNull
    @Size(min = 1, max = 200)
    @Schema(name = "name", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("name")
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ItemDetail status(Status status) {
        this.status = status;
        return this;
    }

    /**
     * Get status
     *
     * @return status
     */
    @NotNull
    @Valid
    @Schema(name = "status", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("status")
    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public ItemDetail categoryName(String categoryName) {
        this.categoryName = categoryName;
        return this;
    }

    /**
     * Get categoryName
     *
     * @return categoryName
     */
    @NotNull
    @Schema(name = "categoryName", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("categoryName")
    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public ItemDetail uomBase(String uomBase) {
        this.uomBase = uomBase;
        return this;
    }

    /**
     * Get uomBase
     *
     * @return uomBase
     */
    @NotNull
    @Size(min = 1, max = 16)
    @Schema(name = "uomBase", example = "pcs", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("uomBase")
    public String getUomBase() {
        return uomBase;
    }

    public void setUomBase(String uomBase) {
        this.uomBase = uomBase;
    }

    public ItemDetail description(@Nullable String description) {
        this.description = description;
        return this;
    }

    /**
     * Get description
     *
     * @return description
     */
    @Size(max = 4000)
    @Schema(name = "description", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("description")
    public @Nullable String getDescription() {
        return description;
    }

    public void setDescription(@Nullable String description) {
        this.description = description;
    }

    public ItemDetail uoms(List<@Valid ItemUom> uoms) {
        this.uoms = uoms;
        return this;
    }

    public ItemDetail addUomsItem(ItemUom uomsItem) {
        if (this.uoms == null) {
            this.uoms = new ArrayList<>();
        }
        this.uoms.add(uomsItem);
        return this;
    }

    /**
     * Get uoms
     *
     * @return uoms
     */
    @Valid
    @Schema(name = "uoms", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("uoms")
    public List<@Valid ItemUom> getUoms() {
        return uoms;
    }

    public void setUoms(List<@Valid ItemUom> uoms) {
        this.uoms = uoms;
    }

    public ItemDetail createdAt(@Nullable OffsetDateTime createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    /**
     * Get createdAt
     *
     * @return createdAt
     */
    @Valid
    @Schema(name = "createdAt", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("createdAt")
    public @Nullable OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(@Nullable OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public ItemDetail updatedAt(@Nullable OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
        return this;
    }

    /**
     * Get updatedAt
     *
     * @return updatedAt
     */
    @Valid
    @Schema(name = "updatedAt", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("updatedAt")
    public @Nullable OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(@Nullable OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public ItemDetail version(Integer version) {
        this.version = version;
        return this;
    }

    /**
     * Get version
     * minimum: 0
     *
     * @return version
     */
    @NotNull
    @Min(0)
    @Schema(name = "version", example = "3", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("version")
    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        ItemDetail itemDetail = (ItemDetail) o;
        return Objects.equals(this.id, itemDetail.id) &&
                Objects.equals(this.code, itemDetail.code) &&
                Objects.equals(this.name, itemDetail.name) &&
                Objects.equals(this.status, itemDetail.status) &&
                Objects.equals(this.categoryName, itemDetail.categoryName) &&
                Objects.equals(this.uomBase, itemDetail.uomBase) &&
                Objects.equals(this.description, itemDetail.description) &&
                Objects.equals(this.uoms, itemDetail.uoms) &&
                Objects.equals(this.createdAt, itemDetail.createdAt) &&
                Objects.equals(this.updatedAt, itemDetail.updatedAt) &&
                Objects.equals(this.version, itemDetail.version);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, code, name, status, categoryName, uomBase, description, uoms, createdAt, updatedAt, version);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("class ItemDetail {\n");
        sb.append("    id: ").append(toIndentedString(id)).append("\n");
        sb.append("    code: ").append(toIndentedString(code)).append("\n");
        sb.append("    name: ").append(toIndentedString(name)).append("\n");
        sb.append("    status: ").append(toIndentedString(status)).append("\n");
        sb.append("    categoryName: ").append(toIndentedString(categoryName)).append("\n");
        sb.append("    uomBase: ").append(toIndentedString(uomBase)).append("\n");
        sb.append("    description: ").append(toIndentedString(description)).append("\n");
        sb.append("    uoms: ").append(toIndentedString(uoms)).append("\n");
        sb.append("    createdAt: ").append(toIndentedString(createdAt)).append("\n");
        sb.append("    updatedAt: ").append(toIndentedString(updatedAt)).append("\n");
        sb.append("    version: ").append(toIndentedString(version)).append("\n");
        sb.append("}");
        return sb.toString();
    }

    /**
     * Convert the given object to string with each line indented by 4 spaces
     * (except the first line).
     */
    private String toIndentedString(Object o) {
        if (o == null) {
            return "null";
        }
        return o.toString().replace("\n", "\n    ");
    }
}

