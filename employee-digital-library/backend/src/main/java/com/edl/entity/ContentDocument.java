package com.edl.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "content_documents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContentDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_id", nullable = false, unique = true)
    private ContentItem content;

    @Column(name = "body_html", columnDefinition = "TEXT")
    private String bodyHtml;

    @Column(name = "file_url", length = 500)
    private String fileUrl;
}
