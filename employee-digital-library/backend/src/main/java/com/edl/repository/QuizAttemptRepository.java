package com.edl.repository;

import com.edl.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {
    List<QuizAttempt> findByUserIdAndContentIdOrderByAttemptedAtDesc(UUID userId, UUID contentId);
    Optional<QuizAttempt> findTopByUserIdAndContentIdAndPassedTrueOrderByAttemptedAtDesc(UUID userId, UUID contentId);
    int countByUserIdAndContentId(UUID userId, UUID contentId);
}
