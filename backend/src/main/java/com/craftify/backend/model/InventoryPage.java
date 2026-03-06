package com.craftify.backend.model;

import java.util.ArrayList;
import java.util.List;

public class InventoryPage {

  private List<InventoryList> content = new ArrayList<>();
  private Integer page;
  private Integer size;
  private Integer totalElements;
  private Integer totalPages;
  private List<String> sort = new ArrayList<>();

  public List<InventoryList> getContent() {
    return content;
  }

  public void setContent(List<InventoryList> content) {
    this.content = content == null ? new ArrayList<>() : content;
  }

  public Integer getPage() {
    return page;
  }

  public void setPage(Integer page) {
    this.page = page;
  }

  public Integer getSize() {
    return size;
  }

  public void setSize(Integer size) {
    this.size = size;
  }

  public Integer getTotalElements() {
    return totalElements;
  }

  public void setTotalElements(Integer totalElements) {
    this.totalElements = totalElements;
  }

  public Integer getTotalPages() {
    return totalPages;
  }

  public void setTotalPages(Integer totalPages) {
    this.totalPages = totalPages;
  }

  public List<String> getSort() {
    return sort;
  }

  public void setSort(List<String> sort) {
    this.sort = sort == null ? new ArrayList<>() : sort;
  }
}
