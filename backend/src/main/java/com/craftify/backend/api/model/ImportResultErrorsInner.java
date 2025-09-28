package com.craftify.backend.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeName;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.annotation.Generated;
import jakarta.validation.constraints.Min;
import org.springframework.lang.Nullable;

import java.io.Serializable;
import java.util.Objects;

/**
 * ImportResultErrorsInner
 */

@JsonTypeName("ImportResult_errors_inner")
@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.15.0")
public class ImportResultErrorsInner implements Serializable {

    private static final long serialVersionUID = 1L;

    private @Nullable Integer row;

    private @Nullable String field;

    private @Nullable String message;

    public ImportResultErrorsInner row(@Nullable Integer row) {
        this.row = row;
        return this;
    }

    /**
     * Get row
     * minimum: 1
     *
     * @return row
     */
    @Min(1)
    @Schema(name = "row", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("row")
    public @Nullable Integer getRow() {
        return row;
    }

    public void setRow(@Nullable Integer row) {
        this.row = row;
    }

    public ImportResultErrorsInner field(@Nullable String field) {
        this.field = field;
        return this;
    }

    /**
     * Get field
     *
     * @return field
     */

    @Schema(name = "field", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("field")
    public @Nullable String getField() {
        return field;
    }

    public void setField(@Nullable String field) {
        this.field = field;
    }

    public ImportResultErrorsInner message(@Nullable String message) {
        this.message = message;
        return this;
    }

    /**
     * Get message
     *
     * @return message
     */

    @Schema(name = "message", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("message")
    public @Nullable String getMessage() {
        return message;
    }

    public void setMessage(@Nullable String message) {
        this.message = message;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        ImportResultErrorsInner importResultErrorsInner = (ImportResultErrorsInner) o;
        return Objects.equals(this.row, importResultErrorsInner.row) &&
                Objects.equals(this.field, importResultErrorsInner.field) &&
                Objects.equals(this.message, importResultErrorsInner.message);
    }

    @Override
    public int hashCode() {
        return Objects.hash(row, field, message);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("class ImportResultErrorsInner {\n");
        sb.append("    row: ").append(toIndentedString(row)).append("\n");
        sb.append("    field: ").append(toIndentedString(field)).append("\n");
        sb.append("    message: ").append(toIndentedString(message)).append("\n");
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

