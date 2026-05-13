package com.edl.service;

import com.edl.entity.*;
import com.edl.entity.Notification.NotificationType;
import com.edl.repository.DeviceTokenRepository;
import com.edl.repository.NotificationRepository;
import com.edl.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notifRepo;
    private final UserRepository userRepo;
    private final DeviceTokenRepository deviceTokenRepo;

    @Async
    @Transactional
    public void notifyNewContent(ContentItem content) {
        List<User> targets;
        if (content.getTargetDepartments().isEmpty()) {
            targets = userRepo.findAll();
        } else {
            targets = content.getTargetDepartments().stream()
                .flatMap(dept -> userRepo.findAll().stream()
                    .filter(u -> u.getDepartment() != null && u.getDepartment().getId().equals(dept.getId())))
                .distinct()
                .toList();
        }

        NotificationType type = content.isMandatory()
            ? NotificationType.MANDATORY_CONTENT
            : NotificationType.NEW_CONTENT;

        String title = content.isMandatory()
            ? "⚠️ Mandatory: " + content.getTitle()
            : "New: " + content.getTitle();

        targets.forEach(user -> {
            Notification n = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(content.getDescription())
                .content(content)
                .build();
            notifRepo.save(n);
        });

        log.info("In-app notifications created for content {} -> {} users", content.getId(), targets.size());

        List<UUID> targetIds = targets.stream().map(User::getId).collect(Collectors.toList());
        List<String> tokens = deviceTokenRepo.findByUserIdIn(targetIds)
            .stream()
            .map(DeviceToken::getToken)
            .collect(Collectors.toList());

        if (!tokens.isEmpty()) {
            sendPushNotifications(tokens, title, content.getDescription());
        }
    }

    @Transactional
    public void registerToken(User user, String token) {
        DeviceToken dt = deviceTokenRepo.findByToken(token)
            .orElseGet(() -> DeviceToken.builder()
                .token(token)
                .platform("expo")
                .lastSeen(OffsetDateTime.now())
                .build());
        dt.setUser(user);
        dt.setLastSeen(OffsetDateTime.now());
        deviceTokenRepo.save(dt);
        log.debug("Device token registered for user {}", user.getId());
    }

    private void sendPushNotifications(List<String> tokens, String title, String bodyText) {
        try {
            String tokenArray = tokens.stream()
                .map(t -> "\"" + t.replace("\\", "\\\\").replace("\"", "\\\"") + "\"")
                .collect(Collectors.joining(",", "[", "]"));
            String safeTitle = title != null ? title.replace("\\", "\\\\").replace("\"", "\\\"") : "";
            String safeBody  = bodyText != null ? bodyText.replace("\\", "\\\\").replace("\"", "\\\"") : "";

            String payload = String.format(
                "{\"to\":%s,\"title\":\"%s\",\"body\":\"%s\",\"sound\":\"default\"}",
                tokenArray, safeTitle, safeBody
            );

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://exp.host/--/api/v2/push/send"))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

            client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenAccept(resp -> log.info("Push sent to {} tokens, status={}", tokens.size(), resp.statusCode()))
                .exceptionally(ex -> { log.warn("Push delivery failed: {}", ex.getMessage()); return null; });

        } catch (Exception e) {
            log.warn("Push notification setup failed: {}", e.getMessage());
        }
    }
}
