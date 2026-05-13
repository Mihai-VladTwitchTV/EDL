package com.edl.repository;

import com.edl.entity.CompanyPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyPageRepository extends JpaRepository<CompanyPage, UUID> {
    List<CompanyPage> findBySectionAndPublishedTrueOrderByDisplayOrderAsc(String section);
    Optional<CompanyPage> findBySlug(String slug);
}
