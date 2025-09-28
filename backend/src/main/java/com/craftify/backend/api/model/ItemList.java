package com.craftify.backend.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.annotation.Generated;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * ItemList
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.15.0")
public class ItemList implements Serializable {

    private static final long serialVersionUID = 1L;

    private @Nullable String id;

    private @Nullable String code;

    private @Nullable String name;

    private @Nullable Status status;

    private @Nullable UUID categoryId;

    private @Nullable String categoryName;

    private @Nullable String uomBase;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private @Nullable OffsetDateTime updatedAt;

    public ItemList id(@Nullable String id) {
        this.id = id;
        return this;
    }

    /**
     * Get id
     *
     * @return id
     */
    @Valid
    @Schema(name = "id", example = "ITM-001", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("id")
    public @Nullable String getId() {
        return id;
    }

    public void setId(@Nullable String id) {
        this.id = id;
    }

    public ItemList code(@Nullable String code) {
        this.code = code;
        return this;
    }

    /**
     * Business code (e.g., ITM-001)
     *
     * @return code
     */

    @Schema(name = "code", example = "ITM-001", description = "Business code (e.g., ITM-001)", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("code")
    public @Nullable String getCode() {
        return code;
    }

    public void setCode(@Nullable String code) {
        this.code = code;
    }

    public ItemList name(@Nullable String name) {
        this.name = name;
        return this;
    }

    /**
     * Get name
     *
     * @return name
     */

    @Schema(name = "name", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("name")
    public @Nullable String getName() {
        return name;
    }

    public void setName(@Nullable String name) {
        this.name = name;
    }

    public ItemList status(@Nullable Status status) {
        this.status = status;
        return this;
    }

    /**
     * Get status
     *
     * @return status
     */
    @Valid
    @Schema(name = "status", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("status")
    public @Nullable Status getStatus() {
        return status;
    }

    public void setStatus(@Nullable Status status) {
        this.status = status;
    }

    public ItemList categoryId(@Nullable UUID categoryId) {
        this.categoryId = categoryId;
        return this;
    }

    /**
     * Get categoryId
     *
     * @return categoryId
     */
    @Valid
    @Schema(name = "categoryId", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("categoryId")
    public @Nullable UUID getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(@Nullable UUID categoryId) {
        this.categoryId = categoryId;
    }

    public ItemList categoryName(@Nullable String categoryName) {
        this.categoryName = categoryName;
        return this;
    }

    /**
     * Get categoryName
     *
     * @return categoryName
     */

    @Schema(name = "categoryName", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("categoryName")
    public @Nullable String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(@Nullable String categoryName) {
        this.categoryName = categoryName;
    }

    public ItemList uomBase(@Nullable String uomBase) {
        this.uomBase = uomBase;
        return this;
    }

    /**
     * Get uomBase
     *
     * @return uomBase
     */

    @Schema(name = "uomBase", example = "pcs", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("uomBase")
    public @Nullable String getUomBase() {
        return uomBase;
    }

    public void setUomBase(@Nullable String uomBase) {
        this.uomBase = uomBase;
    }

    public ItemList updatedAt(@Nullable OffsetDateTime updatedAt) {
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

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        ItemList itemList = (ItemList) o;
        return Objects.equals(this.id, itemList.id) &&
                Objects.equals(this.code, itemList.code) &&
                Objects.equals(this.name, itemList.name) &&
                Objects.equals(this.status, itemList.status) &&
                Objects.equals(this.categoryId, itemList.categoryId) &&
                Objects.equals(this.categoryName, itemList.categoryName) &&
                Objects.equals(this.uomBase, itemList.uomBase) &&
                Objects.equals(this.updatedAt, itemList.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, code, name, status, categoryId, categoryName, uomBase, updatedAt);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("class ItemList {\n");
        sb.append("    id: ").append(toIndentedString(id)).append("\n");
        sb.append("    code: ").append(toIndentedString(code)).append("\n");
        sb.append("    name: ").append(toIndentedString(name)).append("\n");
        sb.append("    status: ").append(toIndentedString(status)).append("\n");
        sb.append("    categoryId: ").append(toIndentedString(categoryId)).append("\n");
        sb.append("    categoryName: ").append(toIndentedString(categoryName)).append("\n");
        sb.append("    uomBase: ").append(toIndentedString(uomBase)).append("\n");
        sb.append("    updatedAt: ").append(toIndentedString(updatedAt)).append("\n");
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

