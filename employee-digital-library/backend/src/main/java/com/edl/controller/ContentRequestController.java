package com.edl.controller;

import com.edl.dto.response.Responses.*;
import com.edl.entity.ContentRequest;
import com.edl.entity.User;
import com.edl.exception.ApiException;
import com.edl.repository.ContentRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/content-requests")
@RequiredArgsConstructor
public class ContentRequestController {

    private final ContentRequestRepository requestRepo;

    @PostMapping
    public ResponseEntity<ContentRequestResponse> createRequest(
        @AuthenticationPrincipal User user,
        @RequestBody Map<String, String> body
    ) {
        String desc = body.get("description");
        if (desc == null || desc.isBlank()) {
            throw new ApiException("Description is required", HttpStatus.BAD_REQUEST);
        }
        ContentRequest req = ContentRequest.builder()
            .requester(user)
            .searchTerm(body.get("searchTerm"))
            .description(desc)
            .build();
        requestRepo.save(req);
        return ResponseEntity.status(201).body(toDto(req));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ContentRequestResponse>> myRequests(
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(
            requestRepo.findByRequesterIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, 50))
                .stream().map(this::toDto).collect(Collectors.toList())
        );
    }

    @GetMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<PagedResponse<ContentRequestResponse>> allRequests(
        @RequestParam(defaultValue = "OPEN") String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Page<ContentRequest> p = requestRepo.findByStatusOrderByCreatedAtDesc(status, PageRequest.of(page, size));
        return ResponseEntity.ok(PagedResponse.<ContentRequestResponse>builder()
            .content(p.getContent().stream().map(this::toDto).collect(Collectors.toList()))
            .page(p.getNumber()).size(p.getSize())
            .totalElements(p.getTotalElements()).totalPages(p.getTotalPages())
            .last(p.isLast()).build());
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Void> resolve(
        @AuthenticationPrincipal User user,
        @PathVariable UUID id
    ) {
        requestRepo.findById(id).ifPresent(req -> {
            req.setStatus("RESOLVED");
            req.setResolvedBy(user);
            req.setResolvedAt(java.time.OffsetDateTime.now());
            requestRepo.save(req);
        });
        return ResponseEntity.noContent().build();
    }

    private ContentRequestResponse toDto(ContentRequest r) {
        return ContentRequestResponse.builder()
            .id(r.getId())
            .searchTerm(r.getSearchTerm())
            .description(r.getDescription())
            .status(r.getStatus())
            .createdAt(r.getCreatedAt())
            .build();
    }
}
