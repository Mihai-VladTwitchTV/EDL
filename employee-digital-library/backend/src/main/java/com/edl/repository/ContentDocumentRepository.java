package com.edl.repository;

import com.edl.entity.ContentDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ContentDocumentRepository extends JpaRepository<ContentDocument, UUID> {
    Optional<ContentDocument> findByContent_Id(UUID contentId);
}
