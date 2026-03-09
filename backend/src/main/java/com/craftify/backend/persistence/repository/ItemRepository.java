package com.craftify.backend.persistence.repository;

import com.craftify.backend.model.Status;
import com.craftify.backend.persistence.entity.ItemEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ItemRepository extends JpaRepository<ItemEntity, UUID>, JpaSpecificationExecutor<ItemEntity> {

  Optional<ItemEntity> findByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);

  boolean existsByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);

  long countByOwnerSub(String ownerSub);

  long countByStatusAndOwnerSub(Status status, String ownerSub);

  @Query(
      value =
          """
          select coalesce(max(cast(substring(code from '[0-9]+$') as integer)), 0)
          from items
          where owner_sub = :ownerSub
            and code like 'ITM-%'
          """,
      nativeQuery = true)
  int findMaxCodeSuffixByOwnerSub(@Param("ownerSub") String ownerSub);
}
