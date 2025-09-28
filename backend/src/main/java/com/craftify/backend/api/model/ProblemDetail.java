package com.craftify.backend.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.annotation.Generated;
import jakarta.validation.Valid;
import org.springframework.lang.Nullable;

import java.io.Serializable;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * RFC-7807 Problem Details
 */

@Schema(name = "ProblemDetail", description = "RFC-7807 Problem Details")
@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.15.0")
public class ProblemDetail implements Serializable {

    private static final long serialVersionUID = 1L;

    private @Nullable URI type;

    private @Nullable String title;

    private @Nullable Integer status;

    private @Nullable String detail;

    private @Nullable String instance;

    @Valid
    private Map<String, String> errors = new HashMap<>();

    public ProblemDetail type(@Nullable URI type) {
        this.type = type;
        return this;
    }

    /**
     * Get type
     *
     * @return type
     */
    @Valid
    @Schema(name = "type", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("type")
    public @Nullable URI getType() {
        return type;
    }

    public void setType(@Nullable URI type) {
        this.type = type;
    }

    public ProblemDetail title(@Nullable String title) {
        this.title = title;
        return this;
    }

    /**
     * Get title
     *
     * @return title
     */

    @Schema(name = "title", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("title")
    public @Nullable String getTitle() {
        return title;
    }

    public void setTitle(@Nullable String title) {
        this.title = title;
    }

    public ProblemDetail status(@Nullable Integer status) {
        this.status = status;
        return this;
    }

    /**
     * Get status
     *
     * @return status
     */

    @Schema(name = "status", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("status")
    public @Nullable Integer getStatus() {
        return status;
    }

    public void setStatus(@Nullable Integer status) {
        this.status = status;
    }

    public ProblemDetail detail(@Nullable String detail) {
        this.detail = detail;
        return this;
    }

    /**
     * Get detail
     *
     * @return detail
     */

    @Schema(name = "detail", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("detail")
    public @Nullable String getDetail() {
        return detail;
    }

    public void setDetail(@Nullable String detail) {
        this.detail = detail;
    }

    public ProblemDetail instance(@Nullable String instance) {
        this.instance = instance;
        return this;
    }

    /**
     * Get instance
     *
     * @return instance
     */

    @Schema(name = "instance", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("instance")
    public @Nullable String getInstance() {
        return instance;
    }

    public void setInstance(@Nullable String instance) {
        this.instance = instance;
    }

    public ProblemDetail errors(Map<String, String> errors) {
        this.errors = errors;
        return this;
    }

    public ProblemDetail putErrorsItem(String key, String errorsItem) {
        if (this.errors == null) {
            this.errors = new HashMap<>();
        }
        this.errors.put(key, errorsItem);
        return this;
    }

    /**
     * Get errors
     *
     * @return errors
     */

    @Schema(name = "errors", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("errors")
    public Map<String, String> getErrors() {
        return errors;
    }

    public void setErrors(Map<String, String> errors) {
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
        ProblemDetail problemDetail = (ProblemDetail) o;
        return Objects.equals(this.type, problemDetail.type) &&
                Objects.equals(this.title, problemDetail.title) &&
                Objects.equals(this.status, problemDetail.status) &&
                Objects.equals(this.detail, problemDetail.detail) &&
                Objects.equals(this.instance, problemDetail.instance) &&
                Objects.equals(this.errors, problemDetail.errors);
    }

    @Override
    public int hashCode() {
        return Objects.hash(type, title, status, detail, instance, errors);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("class ProblemDetail {\n");
        sb.append("    type: ").append(toIndentedString(type)).append("\n");
        sb.append("    title: ").append(toIndentedString(title)).append("\n");
        sb.append("    status: ").append(toIndentedString(status)).append("\n");
        sb.append("    detail: ").append(toIndentedString(detail)).append("\n");
        sb.append("    instance: ").append(toIndentedString(instance)).append("\n");
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

