package com.craftify.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import java.io.Serializable;
import org.springframework.lang.Nullable;

/** Component line in a BOM */
public class BomComponent implements Serializable {

  private static final long serialVersionUID = 1L;

  private String itemId;
  private Double quantity;
  private String uom;
  private @Nullable String note;

  public BomComponent itemId(String itemId) {
    this.itemId = itemId;
    return this;
  }

  @Schema(name = "itemId", example = "ITM-001")
  @JsonProperty("itemId")
  public String getItemId() {
    return itemId;
  }

  public void setItemId(String itemId) {
    this.itemId = itemId;
  }

  public BomComponent quantity(Double quantity) {
    this.quantity = quantity;
    return this;
  }

  @Schema(name = "quantity", example = "1.0")
  @JsonProperty("quantity")
  public Double getQuantity() {
    return quantity;
  }

  public void setQuantity(Double quantity) {
    this.quantity = quantity;
  }

  public BomComponent uom(String uom) {
    this.uom = uom;
    return this;
  }

  @Schema(name = "uom", example = "pcs")
  @JsonProperty("uom")
  public String getUom() {
    return uom;
  }

  public void setUom(String uom) {
    this.uom = uom;
  }

  public BomComponent note(@Nullable String note) {
    this.note = note;
    return this;
  }

  @Schema(name = "note")
  @JsonProperty("note")
  public @Nullable String getNote() {
    return note;
  }

  public void setNote(@Nullable String note) {
    this.note = note;
  }
}
