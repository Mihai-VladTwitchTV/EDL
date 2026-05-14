package com.edl.repository;

import com.edl.entity.UserCertification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserCertificationRepository extends JpaRepository<UserCertification, UUID> {
    List<UserCertification> findByUserIdOrderByIssuedAtDesc(UUID userId);
    boolean existsByUserIdAndCertificationId(UUID userId, UUID certificationId);
}
