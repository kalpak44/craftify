package com.craftify.backend.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.io.Serializable;

/** BOM status values */
public enum BomStatus implements Serializable {
  DRAFT("Draft"),
  ACTIVE("Active"),
  HOLD("Hold"),
  OBSOLITE("Obsolite");

  private final String value;

  BomStatus(String value) {
    this.value = value;
  }

  @JsonValue
  public String getValue() {
    return value;
  }

  @Override
  public String toString() {
    return String.valueOf(value);
  }

  @JsonCreator
  public static BomStatus fromValue(String value) {
    if (value == null) {
      throw new IllegalArgumentException("Unexpected value 'null'");
    }
    String normalized = value.trim();
    for (BomStatus b : BomStatus.values()) {
      if (b.value.equalsIgnoreCase(normalized) || b.name().equalsIgnoreCase(normalized)) {
        return b;
      }
    }
    throw new IllegalArgumentException("Unexpected value '" + value + "'");
  }
}
