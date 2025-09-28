package com.craftify.backend.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.annotation.Generated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.lang.Nullable;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * ImportResult
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.15.0")
public class ImportResult implements Serializable {

    private static final long serialVersionUID = 1L;

    private @Nullable Integer created;

    private @Nullable Integer updated;

    @Valid
    private List<@Valid ImportResultErrorsInner> errors = new ArrayList<>();

    public ImportResult created(@Nullable Integer created) {
        this.created = created;
        return this;
    }

    /**
     * Get created
     * minimum: 0
     *
     * @return created
     */
    @Min(0)
    @Schema(name = "created", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("created")
    public @Nullable Integer getCreated() {
        return created;
    }

    public void setCreated(@Nullable Integer created) {
        this.created = created;
    }

    public ImportResult updated(@Nullable Integer updated) {
        this.updated = updated;
        return this;
    }

    /**
     * Get updated
     * minimum: 0
     *
     * @return updated
     */
    @Min(0)
    @Schema(name = "updated", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("updated")
    public @Nullable Integer getUpdated() {
        return updated;
    }

    public void setUpdated(@Nullable Integer updated) {
        this.updated = updated;
    }

    public ImportResult errors(List<@Valid ImportResultErrorsInner> errors) {
        this.errors = errors;
        return this;
    }

    public ImportResult addErrorsItem(ImportResultErrorsInner errorsItem) {
        if (this.errors == null) {
            this.errors = new ArrayList<>();
        }
        this.errors.add(errorsItem);
        return this;
    }

    /**
     * Get errors
     *
     * @return errors
     */
    @Valid
    @Schema(name = "errors", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("errors")
    public List<@Valid ImportResultErrorsInner> getErrors() {
        return errors;
    }

    public void setErrors(List<@Valid ImportResultErrorsInner> errors) {
        this.errors = errors;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        ImportResult importResult = (ImportResult) o;
        return Objects.equals(this.created, importResult.created) &&
                Objects.equals(this.updated, importResult.updated) &&
                Objects.equals(this.errors, importResult.errors);
    }

    @Override
    public int hashCode() {
        return Objects.hash(created, updated, errors);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("class ImportResult {\n");
        sb.append("    created: ").append(toIndentedString(created)).append("\n");
        sb.append("    updated: ").append(toIndentedString(updated)).append("\n");
        sb.append("    errors: ").append(toIndentedString(errors)).append("\n");
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

