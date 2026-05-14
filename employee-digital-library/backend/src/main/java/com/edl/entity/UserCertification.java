package com.edl.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_certifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserCertification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certification_id", nullable = false)
    private Certification certification;

    @CreationTimestamp
    @Column(name = "issued_at", updatable = false)
    private OffsetDateTime issuedAt;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;
}
