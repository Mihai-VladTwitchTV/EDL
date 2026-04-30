package com.edl.repository;

import com.edl.entity.ContentRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ContentRequestRepository extends JpaRepository<ContentRequest, UUID> {
    Page<ContentRequest> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    Page<ContentRequest> findByRequesterIdOrderByCreatedAtDesc(UUID requesterId, Pageable pageable);
}
