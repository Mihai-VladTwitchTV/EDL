package com.edl.service;

import com.edl.dto.request.AuthRequests.QuizAttemptRequest;
import com.edl.dto.response.Responses.*;
import com.edl.entity.*;
import com.edl.exception.ApiException;
import com.edl.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final ContentItemRepository contentRepo;
    private final QuizQuestionRepository questionRepo;
    private final QuizAnswerRepository answerRepo;
    private final QuizAttemptRepository attemptRepo;
    private final CertificationRepository certRepo;
    private final UserCertificationRepository userCertRepo;
    private final GamificationService gamificationService;

    @Transactional(readOnly = true)
    public List<QuizQuestionResponse> getQuestions(UUID contentId) {
        ContentItem content = contentRepo.findById(contentId)
            .orElseThrow(() -> new ApiException("Content not found", HttpStatus.NOT_FOUND));
        if (content.getContentType() != ContentItem.ContentType.QUIZ) {
            throw new ApiException("Content is not a quiz", HttpStatus.BAD_REQUEST);
        }
        return buildQuestionResponses(contentId);
    }

    @Transactional
    public QuizResultResponse submitAttempt(User user, UUID contentId, QuizAttemptRequest req) {
        ContentItem content = contentRepo.findById(contentId)
            .orElseThrow(() -> new ApiException("Content not found", HttpStatus.NOT_FOUND));

        List<QuizQuestion> questions = questionRepo.findByContentIdOrderByPositionAsc(contentId);
        if (questions.isEmpty()) {
            throw new ApiException("Quiz has no questions", HttpStatus.BAD_REQUEST);
        }

        List<UUID> questionIds = questions.stream().map(QuizQuestion::getId).toList();
        List<QuizAnswer> allAnswers = answerRepo.findByQuestionIdInOrderByPositionAsc(questionIds);
        Map<UUID, List<QuizAnswer>> answersByQuestion = allAnswers.stream()
            .collect(Collectors.groupingBy(a -> a.getQuestion().getId()));

        Map<UUID, List<UUID>> submitted = req.getAnswers() == null ? Map.of() :
            req.getAnswers().stream().collect(Collectors.toMap(
                QuizAttemptRequest.QuestionAnswer::getQuestionId,
                a -> a.getSelectedAnswerIds() != null ? a.getSelectedAnswerIds() : List.of()
            ));

        long correct = questions.stream().filter(q -> {
            Set<UUID> correctIds = answersByQuestion.getOrDefault(q.getId(), List.of())
                .stream().filter(QuizAnswer::isCorrect).map(QuizAnswer::getId)
                .collect(Collectors.toSet());
            Set<UUID> selected = new HashSet<>(submitted.getOrDefault(q.getId(), List.of()));
            return !correctIds.isEmpty() && correctIds.equals(selected);
        }).count();

        short scorePct = (short) ((correct * 100) / questions.size());
        short threshold = certRepo.findByContentId(contentId)
            .map(Certification::getPassThreshold).orElse((short) 70);
        boolean passed = scorePct >= threshold;

        QuizAttempt attempt = QuizAttempt.builder()
            .user(user).content(content).scorePct(scorePct).passed(passed).build();
        attemptRepo.save(attempt);

        int xpAwarded = passed ? GamificationService.XP_QUIZ_PASSED : GamificationService.XP_QUIZ_ATTEMPTED;
        gamificationService.awardXp(user, passed ? "QUIZ_PASSED" : "QUIZ_ATTEMPTED", xpAwarded, content);

        String certName = null;
        if (passed) {
            Certification cert = certRepo.findByContentId(contentId).orElse(null);
            if (cert != null && !userCertRepo.existsByUserIdAndCertificationId(user.getId(), cert.getId())) {
                userCertRepo.save(UserCertification.builder().user(user).certification(cert).build());
                certName = cert.getName();
            }
        }

        return QuizResultResponse.builder()
            .attemptId(attempt.getId())
            .scorePct(scorePct)
            .passed(passed)
            .xpAwarded(xpAwarded)
            .certificationName(certName)
            .build();
    }

    @Transactional(readOnly = true)
    public List<QuizAttemptHistoryResponse> getAttemptHistory(User user, UUID contentId) {
        return attemptRepo.findByUserIdAndContentIdOrderByAttemptedAtDesc(user.getId(), contentId)
            .stream()
            .map(a -> QuizAttemptHistoryResponse.builder()
                .id(a.getId())
                .scorePct(a.getScorePct())
                .passed(a.isPassed())
                .attemptedAt(a.getAttemptedAt())
                .build())
            .toList();
    }

    private List<QuizQuestionResponse> buildQuestionResponses(UUID contentId) {
        List<QuizQuestion> questions = questionRepo.findByContentIdOrderByPositionAsc(contentId);
        List<UUID> questionIds = questions.stream().map(QuizQuestion::getId).toList();
        List<QuizAnswer> allAnswers = answerRepo.findByQuestionIdInOrderByPositionAsc(questionIds);
        Map<UUID, List<QuizAnswer>> answersByQuestion = allAnswers.stream()
            .collect(Collectors.groupingBy(a -> a.getQuestion().getId()));

        return questions.stream().map(q -> QuizQuestionResponse.builder()
            .id(q.getId())
            .questionText(q.getQuestionText())
            .questionType(q.getQuestionType().name())
            .position(q.getPosition())
            .answers(answersByQuestion.getOrDefault(q.getId(), List.of()).stream()
                .map(a -> QuizAnswerResponse.builder()
                    .id(a.getId()).answerText(a.getAnswerText()).position(a.getPosition()).build())
                .toList())
            .build())
            .toList();
    }
}
