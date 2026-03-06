package com.craftify.backend.model;

import java.math.BigDecimal;

public class WorkItemRequest {

  private String bomId;
  private BigDecimal requestedQty;

  public String getBomId() {
    return bomId;
  }

  public void setBomId(String bomId) {
    this.bomId = bomId;
  }

  public BigDecimal getRequestedQty() {
    return requestedQty;
  }

  public void setRequestedQty(BigDecimal requestedQty) {
    this.requestedQty = requestedQty;
  }
}
