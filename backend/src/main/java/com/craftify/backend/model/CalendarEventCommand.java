package com.craftify.backend.model;

import java.time.OffsetDateTime;

public record CalendarEventCommand(
    String title,
    OffsetDateTime start,
    OffsetDateTime end,
    String color,
    String calendar,
    String location,
    String description) {}
