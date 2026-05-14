package com.edl.repository;

import com.edl.entity.ContentVideo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ContentVideoRepository extends JpaRepository<ContentVideo, UUID> {
    Optional<ContentVideo> findByContent_Id(UUID contentId);
}
