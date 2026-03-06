package com.craftify.backend.persistence.repository;

import com.craftify.backend.persistence.entity.InventoryEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InventoryRepository
    extends JpaRepository<InventoryEntity, UUID>, JpaSpecificationExecutor<InventoryEntity> {

  Optional<InventoryEntity> findByCodeIgnoreCase(String code);

  boolean existsByCodeIgnoreCase(String code);
}
