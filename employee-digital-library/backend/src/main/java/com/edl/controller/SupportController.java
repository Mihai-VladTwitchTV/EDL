package com.edl.controller;

import com.edl.dto.request.AuthRequests.SupportTicketRequest;
import com.edl.dto.response.Responses.*;
import com.edl.entity.User;
import com.edl.service.SupportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    @PostMapping
    public ResponseEntity<SupportTicketResponse> create(
        @AuthenticationPrincipal User user,
        @RequestBody SupportTicketRequest req
    ) {
        return ResponseEntity.status(201).body(supportService.create(user, req));
    }

    @GetMapping("/me")
    public ResponseEntity<PagedResponse<SupportTicketResponse>> getMyTickets(
        @AuthenticationPrincipal User user,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(supportService.getMyTickets(user.getId(), PageRequest.of(page, size)));
    }

    @GetMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<PagedResponse<SupportTicketResponse>> getAll(
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(supportService.getAll(status, PageRequest.of(page, size)));
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<SupportTicketResponse> resolve(@PathVariable UUID id) {
        return ResponseEntity.ok(supportService.resolve(id));
    }
}
