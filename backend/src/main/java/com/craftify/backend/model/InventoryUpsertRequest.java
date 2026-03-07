package com.craftify.backend.model;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class InventoryUpsertRequest {

  private String code;
  @NotBlank
  private String itemId;
  @NotBlank
  private String itemName;
  @NotBlank
  private String itemCategoryName;
  private Boolean categoryDetached;
  private String detachedCategoryName;
  @NotBlank
  private String uom;
  @NotNull
  private BigDecimal available;

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  public String getItemId() {
    return itemId;
  }

  public void setItemId(String itemId) {
    this.itemId = itemId;
  }

  public String getItemName() {
    return itemName;
  }

  public void setItemName(String itemName) {
    this.itemName = itemName;
  }

  public String getItemCategoryName() {
    return itemCategoryName;
  }

  public void setItemCategoryName(String itemCategoryName) {
    this.itemCategoryName = itemCategoryName;
  }

  public Boolean getCategoryDetached() {
    return categoryDetached;
  }

  public void setCategoryDetached(Boolean categoryDetached) {
    this.categoryDetached = categoryDetached;
  }

  public String getDetachedCategoryName() {
    return detachedCategoryName;
  }

  public void setDetachedCategoryName(String detachedCategoryName) {
    this.detachedCategoryName = detachedCategoryName;
  }

  public String getUom() {
    return uom;
  }

  public void setUom(String uom) {
    this.uom = uom;
  }

  public BigDecimal getAvailable() {
    return available;
  }

  public void setAvailable(BigDecimal available) {
    this.available = available;
  }

  @AssertTrue(message = "detachedCategoryName is required when categoryDetached is true")
  public boolean isDetachedCategoryConsistent() {
    if (!Boolean.TRUE.equals(categoryDetached)) {
      return true;
    }
    return detachedCategoryName != null && !detachedCategoryName.isBlank();
  }
}
