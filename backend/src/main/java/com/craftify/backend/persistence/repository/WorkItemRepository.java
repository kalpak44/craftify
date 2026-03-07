package com.craftify.backend.persistence.repository;

import com.craftify.backend.persistence.entity.WorkItemEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface WorkItemRepository
    extends JpaRepository<WorkItemEntity, UUID>, JpaSpecificationExecutor<WorkItemEntity> {

  Optional<WorkItemEntity> findByCodeIgnoreCase(String code);

  Optional<WorkItemEntity> findByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);

  boolean existsByCodeIgnoreCase(String code);

  boolean existsByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);
}
