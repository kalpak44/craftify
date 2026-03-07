package com.craftify.backend.persistence.repository;

import com.craftify.backend.persistence.entity.CalendarEventEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CalendarEventRepository
    extends JpaRepository<CalendarEventEntity, UUID>, JpaSpecificationExecutor<CalendarEventEntity> {

  Optional<CalendarEventEntity> findByIdAndOwnerSub(UUID id, String ownerSub);
}
