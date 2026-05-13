package com.edl.repository;

import com.edl.entity.XpEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface XpEventRepository extends JpaRepository<XpEvent, UUID> {
    List<XpEvent> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("""
        SELECT SUM(x.xpAwarded) FROM XpEvent x
        WHERE x.user.section.id = :sectionId
        """)
    Integer sumXpBySectionId(@Param("sectionId") UUID sectionId);
}
