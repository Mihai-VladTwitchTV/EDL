package com.edl.controller;

import com.edl.dto.response.Responses.*;
import com.edl.entity.User;
import com.edl.service.GamificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
public class GamificationController {

    private final GamificationService gamificationService;

    @GetMapping("/me")
    public ResponseEntity<GamificationProfileResponse> getMyProfile(
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(gamificationService.getProfile(user));
    }

    @GetMapping("/leaderboard/section/{sectionId}")
    public ResponseEntity<List<LeaderboardEntryResponse>> getSectionLeaderboard(
        @PathVariable UUID sectionId
    ) {
        return ResponseEntity.ok(gamificationService.getSectionLeaderboard(sectionId));
    }
}
