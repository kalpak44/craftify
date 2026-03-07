package com.craftify.backend.persistence.repository;

import com.craftify.backend.model.Status;
import com.craftify.backend.persistence.entity.ItemEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ItemRepository extends JpaRepository<ItemEntity, UUID>, JpaSpecificationExecutor<ItemEntity> {

  Optional<ItemEntity> findByCodeIgnoreCase(String code);

  Optional<ItemEntity> findByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);

  boolean existsByCodeIgnoreCase(String code);

  boolean existsByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);

  boolean existsByDeletedFalseAndCategoryNameIgnoreCase(String categoryName);

  boolean existsByDeletedFalseAndCategoryNameIgnoreCaseAndOwnerSub(String categoryName, String ownerSub);

  long countByDeletedFalse();

  long countByDeletedFalseAndOwnerSub(String ownerSub);

  long countByDeletedFalseAndStatus(Status status);

  long countByDeletedFalseAndStatusAndOwnerSub(Status status, String ownerSub);
}
