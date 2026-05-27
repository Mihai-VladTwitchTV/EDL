package com.edl.repository;

import com.edl.entity.CompanyPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyPageRepository extends JpaRepository<CompanyPage, UUID> {
    
    @Query("SELECT p FROM CompanyPage p WHERE p.section = :section AND p.published = true ORDER BY p.displayOrder ASC")
    List<CompanyPage> findPublishedBySection(String section);
    
    @Query("SELECT p FROM CompanyPage p WHERE p.published = true ORDER BY p.section ASC, p.displayOrder ASC")
    List<CompanyPage> findAllPublished();
    
    Optional<CompanyPage> findBySlug(String slug);
}