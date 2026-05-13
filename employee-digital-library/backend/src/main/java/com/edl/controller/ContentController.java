package com.edl.controller;

import com.edl.dto.response.Responses.*;
import com.edl.entity.ContentItem;
import com.edl.entity.User;
import com.edl.service.ContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/content")
@RequiredArgsConstructor
public class ContentController {

    private final ContentService contentService;

    /** Search — returns empty page with a flag if 0 results (triggers ContentRequest UI) */
    @GetMapping("/search")
    public ResponseEntity<PagedResponse<ContentCardResponse>> search(
        @AuthenticationPrincipal User user,
        @RequestParam String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(contentService.search(user, q, PageRequest.of(page, size)));
    }

    /** Category filter */
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<PagedResponse<ContentCardResponse>> byCategory(
        @AuthenticationPrincipal User user,
        @PathVariable UUID categoryId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(contentService.byCategory(user, categoryId, PageRequest.of(page, size)));
    }

    /** Get single content item detail */
    @GetMapping("/{id}")
    public ResponseEntity<ContentCardResponse> getById(
        @AuthenticationPrincipal User user,
        @PathVariable UUID id
    ) {
        return ResponseEntity.ok(contentService.getById(user, id));
    }

    /** Acknowledge mandatory content */
    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<Void> acknowledge(
        @AuthenticationPrincipal User user,
        @PathVariable UUID id
    ) {
        contentService.acknowledge(user, id);
        return ResponseEntity.noContent().build();
    }

    /** Mark as completed */
    @PostMapping("/{id}/complete")
    public ResponseEntity<Void> complete(
        @AuthenticationPrincipal User user,
        @PathVariable UUID id
    ) {
        contentService.markCompleted(user, id);
        return ResponseEntity.noContent().build();
    }

    /** Update video progress (0-100) */
    @PatchMapping("/{id}/progress")
    public ResponseEntity<Void> updateProgress(
        @AuthenticationPrincipal User user,
        @PathVariable UUID id,
        @RequestBody Map<String, Short> body
    ) {
        contentService.updateProgress(user, id, body.getOrDefault("pct", (short) 0));
        return ResponseEntity.noContent().build();
    }

    // ---- Content Creation (MASTER_MENTOR / HR_ADMIN) ----

    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER_MENTOR','HR_ADMIN')")
    public ResponseEntity<ContentCardResponse> createContent(
        @AuthenticationPrincipal User user,
        @RequestParam String title,
        @RequestParam(required = false) String description,
        @RequestParam(defaultValue = "DOCUMENT") String contentType,
        @RequestParam(defaultValue = "TRAINING") String postType,
        @RequestParam(defaultValue = "EN") String language,
        @RequestParam(defaultValue = "false") boolean mandatory,
        @RequestParam(required = false) String categoryId,
        @RequestParam(required = false) List<String> departmentIds,
        @RequestParam(required = false) MultipartFile file
    ) {
        return ResponseEntity.status(201).body(
            contentService.createContent(user, title, description, contentType, postType, language, mandatory, categoryId, departmentIds, file)
        );
    }

    @GetMapping("/compliance")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<ComplianceSummaryResponse>> getCompliance() {
        return ResponseEntity.ok(contentService.getComplianceSummary());
    }

    @PostMapping("/{id}/submit-review")
    @PreAuthorize("hasAnyRole('MASTER_MENTOR','HR_ADMIN')")
    public ResponseEntity<Void> submitForReview(
        @AuthenticationPrincipal User user,
        @PathVariable UUID id
    ) {
        contentService.submitForReview(user, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Void> approve(
        @AuthenticationPrincipal User user,
        @PathVariable UUID id
    ) {
        contentService.approve(user, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/pending-review")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<PagedResponse<ContentCardResponse>> pendingReview(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(contentService.getPendingReview(PageRequest.of(page, size)));
    }
}
