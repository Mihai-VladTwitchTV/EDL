package com.edl.repository;

import com.edl.entity.ContentItem;
import com.edl.entity.ContentItem.ContentStatus;
import com.edl.entity.ContentItem.PostType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContentItemRepository extends JpaRepository<ContentItem, UUID> {

    // -------------------------------------------------------
    // FEED: personalized content for a user's department
    // Orders: mandatory first, then by creation date desc
    // -------------------------------------------------------
    @Query("""
        SELECT DISTINCT c FROM ContentItem c
        LEFT JOIN c.targetDepartments d
        WHERE c.status = 'PUBLISHED'
          AND (d.id = :deptId OR c.targetDepartments IS EMPTY)
        ORDER BY c.mandatory DESC, c.createdAt DESC
        """)
    Page<ContentItem> findFeedForDepartment(@Param("deptId") UUID departmentId, Pageable pageable);

    // Feed for users without a department (all content)
    @Query("""
        SELECT c FROM ContentItem c
        WHERE c.status = 'PUBLISHED'
        ORDER BY c.mandatory DESC, c.createdAt DESC
        """)
    Page<ContentItem> findFeedAll(Pageable pageable);

    // -------------------------------------------------------
    // SEARCH: full-text + trigram fuzzy search
    // Uses native query to access PostgreSQL ts_rank and similarity
    // -------------------------------------------------------
    @Query(value = """
        SELECT ci.* FROM content_items ci
        LEFT JOIN content_departments cd ON cd.content_id = ci.id
        WHERE ci.status = 'PUBLISHED'
          AND (:deptId IS NULL OR cd.department_id = CAST(:deptId AS UUID) OR NOT EXISTS (
                SELECT 1 FROM content_departments WHERE content_id = ci.id
              ))
          AND (
                ci.search_vector @@ plainto_tsquery('romanian', :query)
             OR similarity(ci.title, :query) > 0.2
          )
        ORDER BY
            ts_rank(ci.search_vector, plainto_tsquery('romanian', :query)) DESC,
            similarity(ci.title, :query) DESC
        """,
        countQuery = """
        SELECT COUNT(DISTINCT ci.id) FROM content_items ci
        LEFT JOIN content_departments cd ON cd.content_id = ci.id
        WHERE ci.status = 'PUBLISHED'
          AND (:deptId IS NULL OR cd.department_id = CAST(:deptId AS UUID) OR NOT EXISTS (
                SELECT 1 FROM content_departments WHERE content_id = ci.id
              ))
          AND (
                ci.search_vector @@ plainto_tsquery('romanian', :query)
             OR similarity(ci.title, :query) > 0.2
          )
        """,
        nativeQuery = true)
    Page<ContentItem> search(
        @Param("query") String query,
        @Param("deptId") String departmentId,
        Pageable pageable
    );

    // -------------------------------------------------------
    // MANDATORY: unacknowledged mandatory items for a user
    // -------------------------------------------------------
    @Query("""
        SELECT DISTINCT c FROM ContentItem c
        LEFT JOIN c.targetDepartments d
        WHERE c.status = 'PUBLISHED'
          AND c.mandatory = TRUE
          AND (d.id = :deptId OR c.targetDepartments IS EMPTY)
          AND NOT EXISTS (
            SELECT p FROM UserContentProgress p
            WHERE p.user.id = :userId
              AND p.content.id = c.id
              AND p.acknowledged = TRUE
          )
        ORDER BY c.createdAt DESC
        """)
    List<ContentItem> findUnacknowledgedMandatoryForUser(
        @Param("userId") UUID userId,
        @Param("deptId") UUID departmentId
    );

    // -------------------------------------------------------
    // PENDING REVIEW (for HR/Admin)
    // -------------------------------------------------------
    Page<ContentItem> findByStatusOrderByCreatedAtDesc(ContentStatus status, Pageable pageable);

    // -------------------------------------------------------
    // INCREMENT VIEW COUNT
    // -------------------------------------------------------
    @Modifying
    @Query("UPDATE ContentItem c SET c.viewCount = c.viewCount + 1 WHERE c.id = :id")
    void incrementViewCount(@Param("id") UUID id);

    // -------------------------------------------------------
    // FEED WITH POST TYPE FILTER
    // -------------------------------------------------------
    @Query("""
        SELECT DISTINCT c FROM ContentItem c
        LEFT JOIN c.targetDepartments d
        WHERE c.status = 'PUBLISHED'
          AND c.postType = :postType
          AND (d.id = :deptId OR c.targetDepartments IS EMPTY)
        ORDER BY c.mandatory DESC, c.createdAt DESC
        """)
    Page<ContentItem> findFeedForDepartmentByPostType(
        @Param("deptId") UUID departmentId,
        @Param("postType") PostType postType,
        Pageable pageable
    );

    @Query("""
        SELECT c FROM ContentItem c
        WHERE c.status = 'PUBLISHED'
          AND c.postType = :postType
        ORDER BY c.mandatory DESC, c.createdAt DESC
        """)
    Page<ContentItem> findFeedAllByPostType(@Param("postType") PostType postType, Pageable pageable);

    // -------------------------------------------------------
    // CATEGORY FILTER
    // -------------------------------------------------------
    @Query("""
        SELECT DISTINCT c FROM ContentItem c
        LEFT JOIN c.targetDepartments d
        WHERE c.status = 'PUBLISHED'
          AND c.category.id = :categoryId
          AND (d.id = :deptId OR c.targetDepartments IS EMPTY)
        ORDER BY c.createdAt DESC
        """)
    Page<ContentItem> findByCategoryForDepartment(
        @Param("categoryId") UUID categoryId,
        @Param("deptId") UUID departmentId,
        Pageable pageable
    );
}
