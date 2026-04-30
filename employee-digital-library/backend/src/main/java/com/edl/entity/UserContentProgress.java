package com.edl.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_content_progress",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "content_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserContentProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_id", nullable = false)
    private ContentItem content;

    @Column(nullable = false)
    private boolean acknowledged = false;

    @Column(name = "acknowledged_at")
    private OffsetDateTime acknowledgedAt;

    @Column(nullable = false)
    private boolean completed = false;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "progress_pct")
    private Short progressPct = 0;

    @Column(name = "last_accessed_at", nullable = false)
    private OffsetDateTime lastAccessedAt = OffsetDateTime.now();
}
