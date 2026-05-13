package com.edl.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

public class Responses {

    @Data @Builder
    public static class AuthResponse {
        private String accessToken;
        private String tokenType;
        private UserSummary user;
    }

    @Data @Builder
    public static class UserSummary {
        private UUID id;
        private String email;
        private String fullName;
        private String role;
        private String department;
        private String departmentId;
        private String sectionId;
        private String sectionName;
        private String avatarUrl;
        private String preferredLang;
        private int xpPoints;
        private int level;
        private int streakDays;
    }

    @Data @Builder
    public static class ContentCardResponse {
        private UUID id;
        private String title;
        private String description;
        private String contentType;
        private String postType;
        private boolean mandatory;
        private String categoryName;
        private String categoryIconName;
        private String categoryColorHex;
        private String thumbnailUrl;
        private String authorName;
        private int viewCount;
        private OffsetDateTime createdAt;
        private OffsetDateTime eventDate;
        private String eventLocation;
        private String jobDepartment;
        private String jobLocation;
        private String applicationUrl;
        private UUID linkedQuizId;
        private Boolean userAcknowledged;
        private Boolean userCompleted;
        private Short userProgressPct;
    }

    @Data @Builder
    public static class NotificationResponse {
        private UUID id;
        private String type;
        private String title;
        private String body;
        private UUID contentId;
        private boolean read;
        private OffsetDateTime createdAt;
    }

    @Data @Builder
    public static class ContentRequestResponse {
        private UUID id;
        private String searchTerm;
        private String description;
        private String status;
        private OffsetDateTime createdAt;
    }

    @Data @Builder
    public static class ApiError {
        private int status;
        private String message;
        private OffsetDateTime timestamp;
    }

    @Data @Builder
    public static class PagedResponse<T> {
        private java.util.List<T> content;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean last;
    }
}
