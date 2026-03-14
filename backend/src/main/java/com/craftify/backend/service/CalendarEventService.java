package com.craftify.backend.service;

import com.craftify.backend.model.CalendarEventDetail;
import com.craftify.backend.model.CalendarEventCommand;
import com.craftify.backend.persistence.entity.CalendarEventEntity;
import com.craftify.backend.persistence.repository.CalendarEventRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CalendarEventService {

  private final CalendarEventRepository calendarEventRepository;
  private final CurrentUserService currentUserService;

  public CalendarEventService(
      CalendarEventRepository calendarEventRepository, CurrentUserService currentUserService) {
    this.calendarEventRepository = calendarEventRepository;
    this.currentUserService = currentUserService;
  }

  @Transactional(readOnly = true)
  public List<CalendarEventDetail> list(OffsetDateTime from, OffsetDateTime to) {
    String ownerSub = currentUserService.requiredSub();
    Specification<CalendarEventEntity> spec =
        (root, cq, cb) -> {
          List<Predicate> predicates = new ArrayList<>();
          predicates.add(cb.equal(root.get("ownerSub"), ownerSub));
          if (from != null) {
            predicates.add(cb.greaterThan(root.get("endAt"), from));
          }
          if (to != null) {
            predicates.add(cb.lessThan(root.get("startAt"), to));
          }
          return cb.and(predicates.toArray(Predicate[]::new));
        };

    return calendarEventRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "startAt")).stream()
        .map(this::toModel)
        .toList();
  }

  @Transactional(readOnly = true)
  public CalendarEventDetail getById(UUID id) {
    String ownerSub = currentUserService.requiredSub();
    return calendarEventRepository.findByIdAndOwnerSub(id, ownerSub).map(this::toModel).orElse(null);
  }

  @Transactional
  public CalendarEventDetail create(CalendarEventCommand command) {
    CalendarEventEntity entity = new CalendarEventEntity();
    apply(entity, command);
    entity.setOwnerSub(currentUserService.requiredSub());
    return toModel(calendarEventRepository.save(entity));
  }

  @Transactional
  public CalendarEventDetail update(UUID id, CalendarEventCommand command) {
    String ownerSub = currentUserService.requiredSub();
    CalendarEventEntity existing = calendarEventRepository.findByIdAndOwnerSub(id, ownerSub).orElse(null);
    if (existing == null) {
      return null;
    }
    apply(existing, command);
    return toModel(calendarEventRepository.save(existing));
  }

  @Transactional
  public boolean delete(UUID id) {
    String ownerSub = currentUserService.requiredSub();
    CalendarEventEntity existing = calendarEventRepository.findByIdAndOwnerSub(id, ownerSub).orElse(null);
    if (existing == null) {
      return false;
    }
    calendarEventRepository.delete(existing);
    return true;
  }

  public static OffsetDateTime parseDateTime(String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }
    String value = raw.trim();
    try {
      return OffsetDateTime.parse(value);
    } catch (DateTimeParseException ignored) {
      return LocalDateTime.parse(value).atOffset(ZoneOffset.UTC);
    }
  }

  private void apply(CalendarEventEntity entity, CalendarEventCommand command) {
    entity.setTitle(command.title().trim());
    entity.setStartAt(command.start());
    entity.setEndAt(command.end());
    entity.setColor(normalize(command.color(), "indigo"));
    entity.setCalendarName(normalize(command.calendar(), "General"));
    entity.setLocation(normalize(command.location(), null));
    entity.setDescription(normalize(command.description(), null));
  }

  private static String normalize(String value, String fallback) {
    if (value == null) {
      return fallback;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? fallback : trimmed;
  }

  private CalendarEventDetail toModel(CalendarEventEntity entity) {
    CalendarEventDetail model = new CalendarEventDetail();
    model.setId(entity.getId().toString());
    model.setTitle(entity.getTitle());
    model.setStart(entity.getStartAt());
    model.setEnd(entity.getEndAt());
    model.setColor(entity.getColor());
    model.setCalendar(entity.getCalendarName());
    model.setLocation(entity.getLocation());
    model.setDescription(entity.getDescription());
    model.setCreatedAt(entity.getCreatedAt());
    model.setUpdatedAt(entity.getUpdatedAt());
    model.setVersion(entity.getVersion());
    return model;
  }
}
