package com.edl.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;
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
        private String bodyHtml;
        private String videoUrl;
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

    // ── Quiz ────────────────────────────────────────────────

    @Data @Builder
    public static class QuizQuestionResponse {
        private UUID id;
        private String questionText;
        private String questionType;
        private int position;
        private List<QuizAnswerResponse> answers;
    }

    @Data @Builder
    public static class QuizAnswerResponse {
        private UUID id;
        private String answerText;
        private int position;
    }

    @Data @Builder
    public static class QuizResultResponse {
        private UUID attemptId;
        private short scorePct;
        private boolean passed;
        private int xpAwarded;
        private String certificationName;
    }

    @Data @Builder
    public static class QuizAttemptHistoryResponse {
        private UUID id;
        private short scorePct;
        private boolean passed;
        private OffsetDateTime attemptedAt;
    }

    // ── Certifications ──────────────────────────────────────

    @Data @Builder
    public static class CertificationResponse {
        private UUID id;
        private String name;
        private String description;
        private short passThreshold;
    }

    @Data @Builder
    public static class UserCertificationResponse {
        private UUID id;
        private String name;
        private String description;
        private OffsetDateTime issuedAt;
        private OffsetDateTime expiresAt;
        private boolean expired;
    }

    // ── Gamification ────────────────────────────────────────

    @Data @Builder
    public static class GamificationProfileResponse {
        private int xpPoints;
        private int level;
        private int xpToNextLevel;
        private int streakDays;
        private List<XpEventResponse> recentEvents;
    }

    @Data @Builder
    public static class XpEventResponse {
        private String eventType;
        private int xpAwarded;
        private OffsetDateTime createdAt;
    }

    @Data @Builder
    public static class LeaderboardEntryResponse {
        private UUID userId;
        private String fullName;
        private String avatarUrl;
        private int xpPoints;
        private int level;
        private int rank;
    }

    // ── Feedback ────────────────────────────────────────────

    @Data @Builder
    public static class FeedbackResponse {
        private UUID id;
        private String category;
        private String message;
        private boolean anonymous;
        private OffsetDateTime createdAt;
        private String authorName;
    }

    // ── Support Tickets ─────────────────────────────────────

    @Data @Builder
    public static class SupportTicketResponse {
        private UUID id;
        private String ticketType;
        private String subject;
        private String description;
        private String status;
        private OffsetDateTime createdAt;
        private OffsetDateTime resolvedAt;
    }

    // ── Company Pages ───────────────────────────────────────

    @Data @Builder
    public static class CompanyPageResponse {
        private UUID id;
        private String slug;
        private String section;
        private String title;
        private String bodyHtml;
        private int displayOrder;
    }

    // ── Compliance ──────────────────────────────────────────

    @Data @Builder
    public static class ComplianceSummaryResponse {
        private String contentId;
        private String contentTitle;
        private long totalTargeted;
        private long acknowledged;
        private long completed;
        private int ackPct;
        private int completedPct;
    }

    // ── Meta ────────────────────────────────────────────────

    @Data @Builder
    public static class SectionResponse {
        private UUID id;
        private String name;
        private String description;
        private UUID departmentId;
        private String departmentName;
    }
}
