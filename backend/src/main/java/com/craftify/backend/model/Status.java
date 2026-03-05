package com.craftify.backend.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import jakarta.annotation.Generated;
import java.io.Serializable;

/** Gets or Sets Status */
@Generated(
    value = "org.openapitools.codegen.languages.SpringCodegen",
    comments = "Generator version: 7.15.0")
public enum Status implements Serializable {
  DRAFT("Draft"),

  ACTIVE("Active"),

  HOLD("Hold"),

  DISCONTINUED("Discontinued");

  private final String value;

  Status(String value) {
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
  public static Status fromValue(String value) {
    if (value == null) {
      throw new IllegalArgumentException("Unexpected value 'null'");
    }
    String normalized = value.trim();
    for (Status b : Status.values()) {
      if (b.value.equalsIgnoreCase(normalized) || b.name().equalsIgnoreCase(normalized)) {
        return b;
      }
    }
    throw new IllegalArgumentException("Unexpected value '" + value + "'");
  }
}
