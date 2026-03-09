package com.craftify.backend.persistence.repository;

import com.craftify.backend.persistence.entity.WorkItemEntity;
import com.craftify.backend.model.WorkItemStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WorkItemRepository
    extends JpaRepository<WorkItemEntity, UUID>, JpaSpecificationExecutor<WorkItemEntity> {

  Optional<WorkItemEntity> findByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);

  List<WorkItemEntity> findAllByOwnerSubAndStatus(String ownerSub, WorkItemStatus status);

  boolean existsByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);

  @Query(
      value =
          """
          select coalesce(max(cast(substring(code from '[0-9]+$') as integer)), 0)
          from work_items
          where owner_sub = :ownerSub
            and code like 'WI-%'
          """,
      nativeQuery = true)
  int findMaxCodeSuffixByOwnerSub(@Param("ownerSub") String ownerSub);
}
