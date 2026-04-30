package com.edl.controller;

import com.edl.dto.response.Responses.ContentCardResponse;
import com.edl.dto.response.Responses.PagedResponse;
import com.edl.entity.User;
import com.edl.service.ContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/feed")
@RequiredArgsConstructor
public class FeedController {

    private final ContentService contentService;

    /** Main feed — personalized, mandatory items floated to top */
    @GetMapping
    public ResponseEntity<PagedResponse<ContentCardResponse>> getFeed(
        @AuthenticationPrincipal User user,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(contentService.getFeed(user, PageRequest.of(page, size)));
    }

    /** Unacknowledged mandatory items for banner display */
    @GetMapping("/mandatory-pending")
    public ResponseEntity<List<ContentCardResponse>> getMandatoryPending(
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(contentService.getMandatoryPending(user));
    }
}
