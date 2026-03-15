package com.craftify.backend.persistence.repository;

import com.craftify.backend.persistence.entity.UserPreferenceEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPreferenceRepository extends JpaRepository<UserPreferenceEntity, UUID> {

  Optional<UserPreferenceEntity> findByOwnerSub(String ownerSub);
}
