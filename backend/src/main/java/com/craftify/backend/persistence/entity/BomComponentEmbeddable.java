package com.craftify.backend.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.math.BigDecimal;

@Embeddable
public class BomComponentEmbeddable {

  @Column(name = "item_id", nullable = false, length = 64)
  private String itemId;

  @Column(name = "quantity", nullable = false, precision = 19, scale = 6)
  private BigDecimal quantity;

  @Column(name = "uom", nullable = false, length = 16)
  private String uom;

  @Column(name = "note", length = 4000)
  private String note;

  public String getItemId() {
    return itemId;
  }

  public void setItemId(String itemId) {
    this.itemId = itemId;
  }

  public BigDecimal getQuantity() {
    return quantity;
  }

  public void setQuantity(BigDecimal quantity) {
    this.quantity = quantity;
  }

  public String getUom() {
    return uom;
  }

  public void setUom(String uom) {
    this.uom = uom;
  }

  public String getNote() {
    return note;
  }

  public void setNote(String note) {
    this.note = note;
  }
}
