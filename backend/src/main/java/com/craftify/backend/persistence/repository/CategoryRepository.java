package com.craftify.backend.persistence.repository;

import com.craftify.backend.persistence.entity.CategoryEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CategoryRepository
    extends JpaRepository<CategoryEntity, UUID>, JpaSpecificationExecutor<CategoryEntity> {

  boolean existsByNameIgnoreCase(String name);

  boolean existsByNameIgnoreCaseAndOwnerSub(String name, String ownerSub);

  Optional<CategoryEntity> findByNameIgnoreCase(String name);

  Optional<CategoryEntity> findByNameIgnoreCaseAndOwnerSub(String name, String ownerSub);

  Optional<CategoryEntity> findByIdAndOwnerSub(UUID id, String ownerSub);
}
