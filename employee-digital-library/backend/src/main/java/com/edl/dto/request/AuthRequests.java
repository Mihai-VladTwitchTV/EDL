package com.edl.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

public class AuthRequests {

    @Data
    public static class LoginRequest {
        @NotBlank @Email
        private String email;
        @NotBlank
        private String password;
    }

    @Data
    public static class RegisterRequest {
        @NotBlank @Email
        private String email;
        @NotBlank @Size(min = 6, max = 100)
        private String password;
        @NotBlank @Size(min = 2, max = 150)
        private String fullName;
        private String departmentId;
        private String preferredLang = "RO";
    }

    @Data
    public static class QuizAttemptRequest {
        private List<QuestionAnswer> answers;

        @Data
        public static class QuestionAnswer {
            private UUID questionId;
            private List<UUID> selectedAnswerIds;
        }
    }

    @Data
    public static class FeedbackRequest {
        @NotBlank
        private String category;
        @NotBlank
        private String message;
        private boolean anonymous = false;
    }

    @Data
    public static class SupportTicketRequest {
        @NotBlank
        private String ticketType;
        @NotBlank
        private String subject;
        @NotBlank
        private String description;
    }

    @Data
    public static class CreateCertificationRequest {
        @NotBlank
        private String name;
        private String description;
        private String contentId;
        private short passThreshold = 70;
        private Integer validDays;
    }
}
