package com.craftify.backend.persistence.repository;

import com.craftify.backend.persistence.entity.BomEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BomRepository extends JpaRepository<BomEntity, UUID>, JpaSpecificationExecutor<BomEntity> {

  Optional<BomEntity> findByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);

  List<BomEntity> findAllByOwnerSub(String ownerSub);

  boolean existsByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);

  @Query(
      value =
          """
          select coalesce(max(cast(substring(code from '[0-9]+$') as integer)), 0)
          from boms
          where owner_sub = :ownerSub
            and code like 'BOM-%'
          """,
      nativeQuery = true)
  int findMaxCodeSuffixByOwnerSub(@Param("ownerSub") String ownerSub);
}
