package com.craftify.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.lang.Nullable;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class BomPage implements Serializable {
    private static final long serialVersionUID = 1L;

    @Valid
    private List<@Valid BomList> content = new ArrayList<>();
    private @Nullable Integer page;
    private @Nullable Integer size;
    private @Nullable Integer totalElements;
    private @Nullable Integer totalPages;
    @Valid
    private List<String> sort = new ArrayList<>();

    public BomPage content(List<@Valid BomList> content) { this.content = content; return this; }
    @Schema(name = "content")
    @JsonProperty("content")
    public List<@Valid BomList> getContent() { return content; }
    public void setContent(List<@Valid BomList> content) { this.content = content; }

    public BomPage page(@Nullable Integer page) { this.page = page; return this; }
    @Min(0)
    @Schema(name = "page")
    @JsonProperty("page")
    public @Nullable Integer getPage() { return page; }
    public void setPage(@Nullable Integer page) { this.page = page; }

    public BomPage size(@Nullable Integer size) { this.size = size; return this; }
    @Min(1)
    @Schema(name = "size")
    @JsonProperty("size")
    public @Nullable Integer getSize() { return size; }
    public void setSize(@Nullable Integer size) { this.size = size; }

    public BomPage totalElements(@Nullable Integer totalElements) { this.totalElements = totalElements; return this; }
    @Schema(name = "totalElements")
    @JsonProperty("totalElements")
    public @Nullable Integer getTotalElements() { return totalElements; }
    public void setTotalElements(@Nullable Integer totalElements) { this.totalElements = totalElements; }

    public BomPage totalPages(@Nullable Integer totalPages) { this.totalPages = totalPages; return this; }
    @Schema(name = "totalPages")
    @JsonProperty("totalPages")
    public @Nullable Integer getTotalPages() { return totalPages; }
    public void setTotalPages(@Nullable Integer totalPages) { this.totalPages = totalPages; }

    public BomPage sort(List<String> sort) { this.sort = sort; return this; }
    @Schema(name = "sort")
    @JsonProperty("sort")
    public List<String> getSort() { return sort; }
    public void setSort(List<String> sort) { this.sort = sort; }
}
