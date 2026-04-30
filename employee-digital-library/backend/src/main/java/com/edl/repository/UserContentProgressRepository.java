package com.edl.repository;

import com.edl.entity.UserContentProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserContentProgressRepository extends JpaRepository<UserContentProgress, UUID> {
    Optional<UserContentProgress> findByUserIdAndContentId(UUID userId, UUID contentId);
}
