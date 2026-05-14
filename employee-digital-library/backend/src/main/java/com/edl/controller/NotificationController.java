package com.edl.controller;

import com.edl.dto.response.Responses.NotificationResponse;
import com.edl.dto.response.Responses.PagedResponse;
import com.edl.entity.Notification;
import com.edl.entity.User;
import com.edl.repository.NotificationRepository;
import com.edl.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notifRepo;
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<PagedResponse<NotificationResponse>> getNotifications(
        @AuthenticationPrincipal User user,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "30") int size
    ) {
        Page<Notification> p = notifRepo.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(page, size));
        List<NotificationResponse> items = p.getContent().stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(PagedResponse.<NotificationResponse>builder()
            .content(items)
            .page(p.getNumber()).size(p.getSize())
            .totalElements(p.getTotalElements()).totalPages(p.getTotalPages())
            .last(p.isLast()).build());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal User user) {
        long count = notifRepo.countByUserIdAndReadFalse(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal User user) {
        notifRepo.markAllReadForUser(user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register-token")
    public ResponseEntity<Void> registerToken(
        @AuthenticationPrincipal User user,
        @RequestBody Map<String, String> body
    ) {
        String token = body.get("token");
        if (token != null && !token.isBlank()) {
            notificationService.registerToken(user, token);
        }
        return ResponseEntity.noContent().build();
    }

    private NotificationResponse toDto(Notification n) {
        return NotificationResponse.builder()
            .id(n.getId())
            .type(n.getType().name())
            .title(n.getTitle())
            .body(n.getBody())
            .contentId(n.getContent() != null ? n.getContent().getId() : null)
            .read(n.isRead())
            .createdAt(n.getCreatedAt())
            .build();
    }
}
