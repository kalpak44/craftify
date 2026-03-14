package com.craftify.backend.persistence.converter;

import com.craftify.backend.model.Status;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class StatusConverter implements AttributeConverter<Status, String> {

  @Override
  public String convertToDatabaseColumn(Status attribute) {
    return attribute == null ? null : attribute.name();
  }

  @Override
  public Status convertToEntityAttribute(String dbData) {
    if (dbData == null || dbData.isBlank()) {
      return null;
    }
    return Status.fromValue(dbData);
  }
}
