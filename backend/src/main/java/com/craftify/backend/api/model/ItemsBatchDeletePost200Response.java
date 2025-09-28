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
 * ItemsBatchDeletePost200Response
 */

@JsonTypeName("_items_batch_delete_post_200_response")
@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.15.0")
public class ItemsBatchDeletePost200Response implements Serializable {

    private static final long serialVersionUID = 1L;

    private @Nullable Integer deleted;

    public ItemsBatchDeletePost200Response deleted(@Nullable Integer deleted) {
        this.deleted = deleted;
        return this;
    }

    /**
     * Get deleted
     * minimum: 0
     *
     * @return deleted
     */
    @Min(0)
    @Schema(name = "deleted", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("deleted")
    public @Nullable Integer getDeleted() {
        return deleted;
    }

    public void setDeleted(@Nullable Integer deleted) {
        this.deleted = deleted;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        ItemsBatchDeletePost200Response itemsBatchDeletePost200Response = (ItemsBatchDeletePost200Response) o;
        return Objects.equals(this.deleted, itemsBatchDeletePost200Response.deleted);
    }

    @Override
    public int hashCode() {
        return Objects.hash(deleted);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("class ItemsBatchDeletePost200Response {\n");
        sb.append("    deleted: ").append(toIndentedString(deleted)).append("\n");
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

