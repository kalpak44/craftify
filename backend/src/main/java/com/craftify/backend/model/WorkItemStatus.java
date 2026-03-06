package com.craftify.backend.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.io.Serializable;

public enum WorkItemStatus implements Serializable {
  QUEUED("Queued"),
  COMPLETED("Completed"),
  CANCELED("Canceled");

  private final String value;

  WorkItemStatus(String value) {
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
  public static WorkItemStatus fromValue(String value) {
    if (value == null) {
      throw new IllegalArgumentException("Unexpected value 'null'");
    }
    String normalized = value.trim();
    for (WorkItemStatus s : WorkItemStatus.values()) {
      if (s.value.equalsIgnoreCase(normalized) || s.name().equalsIgnoreCase(normalized)) {
        return s;
      }
    }
    throw new IllegalArgumentException("Unexpected value '" + value + "'");
  }
}
