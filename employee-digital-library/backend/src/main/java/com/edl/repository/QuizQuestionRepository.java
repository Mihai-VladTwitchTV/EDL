package com.edl.repository;

import com.edl.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, UUID> {
    List<QuizQuestion> findByContentIdOrderByPositionAsc(UUID contentId);
    int countByContentId(UUID contentId);
}
