package com.craftify.backend.persistence.repository;

import com.craftify.backend.persistence.entity.InventoryEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InventoryRepository
    extends JpaRepository<InventoryEntity, UUID>, JpaSpecificationExecutor<InventoryEntity> {

  Optional<InventoryEntity> findByCodeIgnoreCase(String code);

  Optional<InventoryEntity> findByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);

  Optional<InventoryEntity> findByItemIdIgnoreCase(String itemId);

  Optional<InventoryEntity> findByItemIdIgnoreCaseAndOwnerSub(String itemId, String ownerSub);

  boolean existsByCodeIgnoreCase(String code);

  boolean existsByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);

  boolean existsByItemIdIgnoreCase(String itemId);

  boolean existsByItemIdIgnoreCaseAndOwnerSub(String itemId, String ownerSub);
}
