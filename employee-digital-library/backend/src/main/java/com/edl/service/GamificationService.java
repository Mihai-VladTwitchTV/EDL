package com.edl.service;

import com.edl.dto.response.Responses.*;
import com.edl.entity.ContentItem;
import com.edl.entity.User;
import com.edl.entity.XpEvent;
import com.edl.repository.UserRepository;
import com.edl.repository.XpEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class GamificationService {

    private final UserRepository userRepo;
    private final XpEventRepository xpEventRepo;

    public static final int XP_CONTENT_VIEWED       = 5;
    public static final int XP_CONTENT_COMPLETED    = 25;
    public static final int XP_QUIZ_PASSED          = 50;
    public static final int XP_QUIZ_ATTEMPTED       = 10;
    public static final int XP_MANDATORY_ACK        = 15;
    public static final int XP_LOGIN_STREAK         = 20;
    private static final int XP_PER_LEVEL           = 200;

    @Transactional
    public void awardXp(User user, String eventType, int xp, ContentItem content) {
        user.setXpPoints(user.getXpPoints() + xp);
        user.setLevel((user.getXpPoints() / XP_PER_LEVEL) + 1);
        xpEventRepo.save(XpEvent.builder()
            .user(user)
            .eventType(eventType)
            .xpAwarded(xp)
            .content(content)
            .build());
        userRepo.save(user);
    }

    @Transactional
    public void updateStreak(User user) {
        LocalDate today = LocalDate.now();
        LocalDate last = user.getStreakLastActive();
        if (last == null || last.isBefore(today.minusDays(1))) {
            user.setStreakDays(1);
        } else if (last.equals(today.minusDays(1))) {
            user.setStreakDays(user.getStreakDays() + 1);
            if (user.getStreakDays() % 7 == 0) {
                awardXp(user, "LOGIN_STREAK", XP_LOGIN_STREAK, null);
            }
        }
        if (!today.equals(last)) {
            user.setStreakLastActive(today);
            userRepo.save(user);
        }
    }

    @Transactional(readOnly = true)
    public GamificationProfileResponse getProfile(User user) {
        List<XpEvent> events = xpEventRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<XpEventResponse> recent = events.stream().limit(10)
            .map(e -> XpEventResponse.builder()
                .eventType(e.getEventType())
                .xpAwarded(e.getXpAwarded())
                .createdAt(e.getCreatedAt())
                .build())
            .toList();
        return GamificationProfileResponse.builder()
            .xpPoints(user.getXpPoints())
            .level(user.getLevel())
            .xpToNextLevel(xpToNextLevel(user.getXpPoints()))
            .streakDays(user.getStreakDays())
            .recentEvents(recent)
            .build();
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryResponse> getSectionLeaderboard(UUID sectionId) {
        List<User> users = userRepo.findBySectionIdOrderByXpPointsDesc(sectionId);
        AtomicInteger rank = new AtomicInteger(1);
        return users.stream()
            .map(u -> LeaderboardEntryResponse.builder()
                .userId(u.getId())
                .fullName(u.getFullName())
                .avatarUrl(u.getAvatarUrl())
                .xpPoints(u.getXpPoints())
                .level(u.getLevel())
                .rank(rank.getAndIncrement())
                .build())
            .toList();
    }

    private int xpToNextLevel(int xp) {
        int nextLevelXp = ((xp / XP_PER_LEVEL) + 1) * XP_PER_LEVEL;
        return nextLevelXp - xp;
    }
}
