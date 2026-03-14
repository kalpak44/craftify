package com.craftify.backend.persistence.converter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.craftify.backend.model.Status;
import org.junit.jupiter.api.Test;

class StatusConverterTest {

  private final StatusConverter converter = new StatusConverter();

  @Test
  void convertToEntityAttributeAcceptsEnumName() {
    assertEquals(Status.ACTIVE, converter.convertToEntityAttribute("ACTIVE"));
  }

  @Test
  void convertToEntityAttributeAcceptsDisplayValue() {
    assertEquals(Status.ACTIVE, converter.convertToEntityAttribute("Active"));
  }

  @Test
  void convertToDatabaseColumnWritesEnumName() {
    assertEquals("DISCONTINUED", converter.convertToDatabaseColumn(Status.DISCONTINUED));
  }

  @Test
  void convertToEntityAttributeReturnsNullForBlankValue() {
    assertNull(converter.convertToEntityAttribute(" "));
  }
}
