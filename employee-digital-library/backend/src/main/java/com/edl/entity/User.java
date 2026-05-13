package com.edl.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "user_role")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    @Builder.Default
    private UserRole role = UserRole.EMPLOYEE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private Section section;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_lang", columnDefinition = "language_code")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    @Builder.Default
    private LanguageCode preferredLang = LanguageCode.RO;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "xp_points", nullable = false)
    @Builder.Default
    private Integer xpPoints = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer level = 1;

    @Column(name = "streak_days", nullable = false)
    @Builder.Default
    private Integer streakDays = 0;

    @Column(name = "streak_last_active")
    private LocalDate streakLastActive;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "last_login_at")
    private OffsetDateTime lastLoginAt;

    public enum UserRole { EMPLOYEE, MASTER_MENTOR, HR_ADMIN }
    public enum LanguageCode { RO, EN }
}
