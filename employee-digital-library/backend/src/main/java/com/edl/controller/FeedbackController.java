package com.edl.controller;

import com.edl.dto.request.AuthRequests.FeedbackRequest;
import com.edl.dto.response.Responses.*;
import com.edl.entity.User;
import com.edl.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<Void> submit(
        @AuthenticationPrincipal User user,
        @RequestBody FeedbackRequest req
    ) {
        feedbackService.submit(user, req);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<PagedResponse<FeedbackResponse>> listAll(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(feedbackService.listAll(PageRequest.of(page, size)));
    }
}
