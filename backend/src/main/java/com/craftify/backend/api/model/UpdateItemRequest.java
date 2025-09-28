package com.craftify.backend.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.annotation.Generated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.lang.Nullable;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * UpdateItemRequest
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.15.0")
public class UpdateItemRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    private String code;

    private String name;

    private Status status;

    private String categoryName;

    private String uomBase;

    private @Nullable String description;

    @Valid
    private List<@Valid ItemUom> uoms = new ArrayList<>();

    public UpdateItemRequest() {
        super();
    }

    /**
     * Constructor with only required parameters
     */
    public UpdateItemRequest(String code, String name, Status status, String categoryName, String uomBase) {
        this.code = code;
        this.name = name;
        this.status = status;
        this.categoryName = categoryName;
        this.uomBase = uomBase;
    }

    public UpdateItemRequest code(String code) {
        this.code = code;
        return this;
    }

    /**
     * Get code
     *
     * @return code
     */
    @NotNull
    @Schema(name = "code", example = "ITM-011", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("code")
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public UpdateItemRequest name(String name) {
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

    public UpdateItemRequest status(Status status) {
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

    public UpdateItemRequest categoryName(String categoryName) {
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

    public UpdateItemRequest uomBase(String uomBase) {
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
    @Schema(name = "uomBase", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("uomBase")
    public String getUomBase() {
        return uomBase;
    }

    public void setUomBase(String uomBase) {
        this.uomBase = uomBase;
    }

    public UpdateItemRequest description(@Nullable String description) {
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

    public UpdateItemRequest uoms(List<@Valid ItemUom> uoms) {
        this.uoms = uoms;
        return this;
    }

    public UpdateItemRequest addUomsItem(ItemUom uomsItem) {
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

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        UpdateItemRequest updateItemRequest = (UpdateItemRequest) o;
        return Objects.equals(this.code, updateItemRequest.code) &&
                Objects.equals(this.name, updateItemRequest.name) &&
                Objects.equals(this.status, updateItemRequest.status) &&
                Objects.equals(this.categoryName, updateItemRequest.categoryName) &&
                Objects.equals(this.uomBase, updateItemRequest.uomBase) &&
                Objects.equals(this.description, updateItemRequest.description) &&
                Objects.equals(this.uoms, updateItemRequest.uoms);
    }

    @Override
    public int hashCode() {
        return Objects.hash(code, name, status, categoryName, uomBase, description, uoms);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("class UpdateItemRequest {\n");
        sb.append("    code: ").append(toIndentedString(code)).append("\n");
        sb.append("    name: ").append(toIndentedString(name)).append("\n");
        sb.append("    status: ").append(toIndentedString(status)).append("\n");
        sb.append("    categoryName: ").append(toIndentedString(categoryName)).append("\n");
        sb.append("    uomBase: ").append(toIndentedString(uomBase)).append("\n");
        sb.append("    description: ").append(toIndentedString(description)).append("\n");
        sb.append("    uoms: ").append(toIndentedString(uoms)).append("\n");
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

