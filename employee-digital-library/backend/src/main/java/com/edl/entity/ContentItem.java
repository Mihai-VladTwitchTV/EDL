package com.edl.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "content_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, columnDefinition = "content_type")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private ContentType contentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "content_status")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private ContentStatus status = ContentStatus.DRAFT;

    @Column(name = "is_mandatory", nullable = false)
    private boolean mandatory = false;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "language_code")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private User.LanguageCode language = User.LanguageCode.RO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    @Column(nullable = false)
    private Integer version = 1;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "content_departments",
        joinColumns = @JoinColumn(name = "content_id"),
        inverseJoinColumns = @JoinColumn(name = "department_id")
    )
    @Builder.Default
    private Set<Department> targetDepartments = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum ContentType { DOCUMENT, VIDEO, QUIZ }
    public enum ContentStatus { DRAFT, PENDING_REVIEW, PUBLISHED, ARCHIVED }
}
