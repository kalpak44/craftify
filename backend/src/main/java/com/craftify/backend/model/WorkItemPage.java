package com.craftify.backend.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import jakarta.annotation.Nullable;

public class WorkItemPage implements Serializable {

  private static final long serialVersionUID = 1L;

  private @Nullable List<WorkItemList> content = new ArrayList<>();
  private @Nullable Integer page;
  private @Nullable Integer size;
  private @Nullable Integer totalElements;
  private @Nullable Integer totalPages;
  private @Nullable List<String> sort = new ArrayList<>();

  public @Nullable List<WorkItemList> getContent() {
    return content;
  }

  public void setContent(@Nullable List<WorkItemList> content) {
    this.content = content;
  }

  public @Nullable Integer getPage() {
    return page;
  }

  public void setPage(@Nullable Integer page) {
    this.page = page;
  }

  public @Nullable Integer getSize() {
    return size;
  }

  public void setSize(@Nullable Integer size) {
    this.size = size;
  }

  public @Nullable Integer getTotalElements() {
    return totalElements;
  }

  public void setTotalElements(@Nullable Integer totalElements) {
    this.totalElements = totalElements;
  }

  public @Nullable Integer getTotalPages() {
    return totalPages;
  }

  public void setTotalPages(@Nullable Integer totalPages) {
    this.totalPages = totalPages;
  }

  public @Nullable List<String> getSort() {
    return sort;
  }

  public void setSort(@Nullable List<String> sort) {
    this.sort = sort;
  }
}
