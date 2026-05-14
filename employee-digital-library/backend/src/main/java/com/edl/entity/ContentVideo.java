package com.edl.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "content_videos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContentVideo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_id", nullable = false, unique = true)
    private ContentItem content;

    @Column(name = "video_url", length = 500, nullable = false)
    private String videoUrl;

    @Column(name = "duration_secs")
    private Integer durationSecs;

    @Column(name = "subtitle_url", length = 500)
    private String subtitleUrl;
}
