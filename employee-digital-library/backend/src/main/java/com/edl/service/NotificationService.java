package com.edl.service;

import com.edl.entity.*;
import com.edl.entity.Notification.NotificationType;
import com.edl.repository.NotificationRepository;
import com.edl.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notifRepo;
    private final UserRepository userRepo;

    @Async
    @Transactional
    public void notifyNewContent(ContentItem content) {
        // Find users in targeted departments
        List<User> targets;
        if (content.getTargetDepartments().isEmpty()) {
            targets = userRepo.findAll(); // global content
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

        targets.forEach(user -> {
            Notification n = Notification.builder()
                .user(user)
                .type(type)
                .title(content.isMandatory() ? "⚠️ Mandatory: " + content.getTitle() : "New: " + content.getTitle())
                .body(content.getDescription())
                .content(content)
                .build();
            notifRepo.save(n);
        });

        log.info("Notifications created for content {} -> {} users", content.getId(), targets.size());
    }
}
