package com.craftify.backend.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeName;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.annotation.Generated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * ItemsBatchDeletePostRequest
 */

@JsonTypeName("_items_batch_delete_post_request")
@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.15.0")
public class ItemsBatchDeletePostRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @Valid
    private List<UUID> ids = new ArrayList<>();

    public ItemsBatchDeletePostRequest() {
        super();
    }

    /**
     * Constructor with only required parameters
     */
    public ItemsBatchDeletePostRequest(List<UUID> ids) {
        this.ids = ids;
    }

    public ItemsBatchDeletePostRequest ids(List<UUID> ids) {
        this.ids = ids;
        return this;
    }

    public ItemsBatchDeletePostRequest addIdsItem(UUID idsItem) {
        if (this.ids == null) {
            this.ids = new ArrayList<>();
        }
        this.ids.add(idsItem);
        return this;
    }

    /**
     * Get ids
     *
     * @return ids
     */
    @NotNull
    @Valid
    @Schema(name = "ids", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("ids")
    public List<UUID> getIds() {
        return ids;
    }

    public void setIds(List<UUID> ids) {
        this.ids = ids;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        ItemsBatchDeletePostRequest itemsBatchDeletePostRequest = (ItemsBatchDeletePostRequest) o;
        return Objects.equals(this.ids, itemsBatchDeletePostRequest.ids);
    }

    @Override
    public int hashCode() {
        return Objects.hash(ids);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("class ItemsBatchDeletePostRequest {\n");
        sb.append("    ids: ").append(toIndentedString(ids)).append("\n");
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

