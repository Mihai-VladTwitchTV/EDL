package com.edl.controller;

import com.edl.dto.request.AuthRequests.QuizAttemptRequest;
import com.edl.dto.response.Responses.*;
import com.edl.entity.User;
import com.edl.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @GetMapping("/{contentId}/questions")
    public ResponseEntity<List<QuizQuestionResponse>> getQuestions(
        @PathVariable UUID contentId
    ) {
        return ResponseEntity.ok(quizService.getQuestions(contentId));
    }

    @PostMapping("/{contentId}/attempt")
    public ResponseEntity<QuizResultResponse> submitAttempt(
        @AuthenticationPrincipal User user,
        @PathVariable UUID contentId,
        @RequestBody QuizAttemptRequest req
    ) {
        return ResponseEntity.ok(quizService.submitAttempt(user, contentId, req));
    }

    @GetMapping("/{contentId}/attempts")
    public ResponseEntity<List<QuizAttemptHistoryResponse>> getAttemptHistory(
        @AuthenticationPrincipal User user,
        @PathVariable UUID contentId
    ) {
        return ResponseEntity.ok(quizService.getAttemptHistory(user, contentId));
    }
}
