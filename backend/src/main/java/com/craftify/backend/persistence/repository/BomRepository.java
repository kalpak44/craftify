package com.craftify.backend.persistence.repository;

import com.craftify.backend.persistence.entity.BomEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BomRepository extends JpaRepository<BomEntity, UUID>, JpaSpecificationExecutor<BomEntity> {

  Optional<BomEntity> findByCodeIgnoreCase(String code);

  Optional<BomEntity> findByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);

  boolean existsByCodeIgnoreCase(String code);

  boolean existsByCodeIgnoreCaseAndOwnerSub(String code, String ownerSub);
}
