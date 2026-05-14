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
    @Builder.Default
    private ContentStatus status = ContentStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", nullable = false, columnDefinition = "post_type")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    @Builder.Default
    private PostType postType = PostType.TRAINING;

    @Column(name = "is_mandatory", nullable = false)
    @Builder.Default
    private boolean mandatory = false;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "language_code")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    @Builder.Default
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
    @Builder.Default
    private Integer version = 1;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    // Event-specific fields
    @Column(name = "event_date")
    private OffsetDateTime eventDate;

    @Column(name = "event_location", length = 255)
    private String eventLocation;

    // Career-specific fields
    @Column(name = "job_department", length = 100)
    private String jobDepartment;

    @Column(name = "job_location", length = 100)
    private String jobLocation;

    @Column(name = "application_url", length = 500)
    private String applicationUrl;

    // Linked quiz (auto-triggers after document/video completion)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_quiz_id")
    private ContentItem linkedQuiz;

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
    public enum PostType { TRAINING, NEWS, EVENT, CHANGE, CAREER, REGULATION }
}
