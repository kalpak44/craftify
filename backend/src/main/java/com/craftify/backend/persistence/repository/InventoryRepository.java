package com.craftify.backend.persistence.repository;

import com.craftify.backend.persistence.entity.InventoryEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InventoryRepository
    extends JpaRepository<InventoryEntity, UUID>, JpaSpecificationExecutor<InventoryEntity> {

  Optional<InventoryEntity> findByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);

  Optional<InventoryEntity> findByItemIdIgnoreCaseAndOwnerSub(String itemId, String ownerSub);

  boolean existsByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);

  boolean existsByItemIdIgnoreCaseAndOwnerSub(String itemId, String ownerSub);

  @Query(
      value =
          """
          select coalesce(max(cast(substring(code from '[0-9]+$') as integer)), 0)
          from inventory
          where owner_sub = :ownerSub
            and code like 'INV-%'
          """,
      nativeQuery = true)
  int findMaxCodeSuffixByOwnerSub(@Param("ownerSub") String ownerSub);
}
