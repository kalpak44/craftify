package com.craftify.backend.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.math.BigDecimal;

@Embeddable
public class ItemUomEmbeddable {

  @Column(name = "uom", nullable = false, length = 16)
  private String uom;

  @Column(name = "coef", nullable = false, precision = 19, scale = 6)
  private BigDecimal coef;

  @Column(name = "notes", length = 200)
  private String notes;

  public String getUom() {
    return uom;
  }

  public void setUom(String uom) {
    this.uom = uom;
  }

  public BigDecimal getCoef() {
    return coef;
  }

  public void setCoef(BigDecimal coef) {
    this.coef = coef;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }
}
