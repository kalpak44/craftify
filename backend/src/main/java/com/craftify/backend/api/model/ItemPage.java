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
 * ItemPage
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.15.0")
public class ItemPage implements Serializable {

    private static final long serialVersionUID = 1L;

    @Valid
    private List<@Valid ItemList> content = new ArrayList<>();

    private @Nullable Integer page;

    private @Nullable Integer size;

    private @Nullable Integer totalElements;

    private @Nullable Integer totalPages;

    @Valid
    private List<String> sort = new ArrayList<>();

    public ItemPage content(List<@Valid ItemList> content) {
        this.content = content;
        return this;
    }

    public ItemPage addContentItem(ItemList contentItem) {
        if (this.content == null) {
            this.content = new ArrayList<>();
        }
        this.content.add(contentItem);
        return this;
    }

    /**
     * Get content
     *
     * @return content
     */
    @Valid
    @Schema(name = "content", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("content")
    public List<@Valid ItemList> getContent() {
        return content;
    }

    public void setContent(List<@Valid ItemList> content) {
        this.content = content;
    }

    public ItemPage page(@Nullable Integer page) {
        this.page = page;
        return this;
    }

    /**
     * Get page
     * minimum: 0
     *
     * @return page
     */
    @Min(0)
    @Schema(name = "page", example = "0", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("page")
    public @Nullable Integer getPage() {
        return page;
    }

    public void setPage(@Nullable Integer page) {
        this.page = page;
    }

    public ItemPage size(@Nullable Integer size) {
        this.size = size;
        return this;
    }

    /**
     * Get size
     * minimum: 1
     *
     * @return size
     */
    @Min(1)
    @Schema(name = "size", example = "8", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("size")
    public @Nullable Integer getSize() {
        return size;
    }

    public void setSize(@Nullable Integer size) {
        this.size = size;
    }

    public ItemPage totalElements(@Nullable Integer totalElements) {
        this.totalElements = totalElements;
        return this;
    }

    /**
     * Get totalElements
     * minimum: 0
     *
     * @return totalElements
     */
    @Min(0)
    @Schema(name = "totalElements", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("totalElements")
    public @Nullable Integer getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(@Nullable Integer totalElements) {
        this.totalElements = totalElements;
    }

    public ItemPage totalPages(@Nullable Integer totalPages) {
        this.totalPages = totalPages;
        return this;
    }

    /**
     * Get totalPages
     * minimum: 1
     *
     * @return totalPages
     */
    @Min(1)
    @Schema(name = "totalPages", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("totalPages")
    public @Nullable Integer getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(@Nullable Integer totalPages) {
        this.totalPages = totalPages;
    }

    public ItemPage sort(List<String> sort) {
        this.sort = sort;
        return this;
    }

    public ItemPage addSortItem(String sortItem) {
        if (this.sort == null) {
            this.sort = new ArrayList<>();
        }
        this.sort.add(sortItem);
        return this;
    }

    /**
     * Get sort
     *
     * @return sort
     */

    @Schema(name = "sort", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @JsonProperty("sort")
    public List<String> getSort() {
        return sort;
    }

    public void setSort(List<String> sort) {
        this.sort = sort;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        ItemPage itemPage = (ItemPage) o;
        return Objects.equals(this.content, itemPage.content) &&
                Objects.equals(this.page, itemPage.page) &&
                Objects.equals(this.size, itemPage.size) &&
                Objects.equals(this.totalElements, itemPage.totalElements) &&
                Objects.equals(this.totalPages, itemPage.totalPages) &&
                Objects.equals(this.sort, itemPage.sort);
    }

    @Override
    public int hashCode() {
        return Objects.hash(content, page, size, totalElements, totalPages, sort);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("class ItemPage {\n");
        sb.append("    content: ").append(toIndentedString(content)).append("\n");
        sb.append("    page: ").append(toIndentedString(page)).append("\n");
        sb.append("    size: ").append(toIndentedString(size)).append("\n");
        sb.append("    totalElements: ").append(toIndentedString(totalElements)).append("\n");
        sb.append("    totalPages: ").append(toIndentedString(totalPages)).append("\n");
        sb.append("    sort: ").append(toIndentedString(sort)).append("\n");
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

