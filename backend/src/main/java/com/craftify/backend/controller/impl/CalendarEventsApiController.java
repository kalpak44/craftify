package com.craftify.backend.controller.impl;

import com.craftify.backend.model.CalendarEventDetail;
import com.craftify.backend.model.CalendarEventCommand;
import com.craftify.backend.model.CalendarEventUpsertRequest;
import com.craftify.backend.service.CalendarEventService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;
import jakarta.annotation.Nullable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CalendarEventsApiController {

  private final CalendarEventService calendarEventService;

  public CalendarEventsApiController(CalendarEventService calendarEventService) {
    this.calendarEventService = calendarEventService;
  }

  @GetMapping(value = "/calendar/events", produces = {"application/json"})
  public ResponseEntity<List<CalendarEventDetail>> calendarEventsGet(
      @RequestParam(value = "from", required = false) @Nullable String from,
      @RequestParam(value = "to", required = false) @Nullable String to) {
    try {
      OffsetDateTime fromTs = CalendarEventService.parseDateTime(from);
      OffsetDateTime toTs = CalendarEventService.parseDateTime(to);
      return ResponseEntity.ok(calendarEventService.list(fromTs, toTs));
    } catch (DateTimeParseException ex) {
      return ResponseEntity.badRequest().build();
    }
  }

  @GetMapping(value = "/calendar/events/{id}", produces = {"application/json"})
  public ResponseEntity<CalendarEventDetail> calendarEventsIdGet(@PathVariable("id") String id) {
    UUID eventId = parseUuid(id);
    if (eventId == null) {
      return ResponseEntity.badRequest().build();
    }
    CalendarEventDetail existing = calendarEventService.getById(eventId);
    return existing == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(existing);
  }

  @PostMapping(value = "/calendar/events", produces = {"application/json"}, consumes = {"application/json"})
  public ResponseEntity<CalendarEventDetail> calendarEventsPost(
      @Valid @NotNull @RequestBody CalendarEventUpsertRequest req) {
    CalendarEventCommand command = toCommand(req);
    if (command == null) {
      return ResponseEntity.badRequest().build();
    }

    CalendarEventDetail created = calendarEventService.create(command);
    return ResponseEntity.created(URI.create("/calendar/events/" + created.getId())).body(created);
  }

  @PutMapping(
      value = "/calendar/events/{id}",
      produces = {"application/json"},
      consumes = {"application/json"})
  public ResponseEntity<CalendarEventDetail> calendarEventsIdPut(
      @PathVariable("id") String id, @Valid @NotNull @RequestBody CalendarEventUpsertRequest req) {
    UUID eventId = parseUuid(id);
    if (eventId == null) {
      return ResponseEntity.badRequest().build();
    }

    CalendarEventCommand command = toCommand(req);
    if (command == null) {
      return ResponseEntity.badRequest().build();
    }

    CalendarEventDetail updated = calendarEventService.update(eventId, command);
    return updated == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(updated);
  }

  @DeleteMapping(value = "/calendar/events/{id}")
  public ResponseEntity<Void> calendarEventsIdDelete(@PathVariable String id) {
    UUID eventId = parseUuid(id);
    if (eventId == null) {
      return ResponseEntity.badRequest().build();
    }
    boolean deleted = calendarEventService.delete(eventId);
    return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
  }

  private static UUID parseUuid(String raw) {
    try {
      return UUID.fromString(raw);
    } catch (IllegalArgumentException ex) {
      return null;
    }
  }

  private static CalendarEventCommand toCommand(CalendarEventUpsertRequest req) {
    try {
      OffsetDateTime start = CalendarEventService.parseDateTime(req.getStart());
      OffsetDateTime end = CalendarEventService.parseDateTime(req.getEnd());
      if (start == null || end == null || !end.isAfter(start)) {
        return null;
      }

      return new CalendarEventCommand(
          req.getTitle(),
          start,
          end,
          req.getColor(),
          req.getCalendar(),
          req.getLocation(),
          req.getDescription());
    } catch (DateTimeParseException ex) {
      return null;
    }
  }
}
