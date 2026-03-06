package com.craftify.backend.model;

import java.math.BigDecimal;

public class CreateInventoryFromItemRequest {

  private String itemId;
  private BigDecimal available;
  private String mode;

  public String getItemId() {
    return itemId;
  }

  public void setItemId(String itemId) {
    this.itemId = itemId;
  }

  public BigDecimal getAvailable() {
    return available;
  }

  public void setAvailable(BigDecimal available) {
    this.available = available;
  }

  public String getMode() {
    return mode;
  }

  public void setMode(String mode) {
    this.mode = mode;
  }
}
