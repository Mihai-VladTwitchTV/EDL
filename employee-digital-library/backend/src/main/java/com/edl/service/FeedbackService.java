package com.edl.service;

import com.edl.dto.request.AuthRequests.FeedbackRequest;
import com.edl.dto.response.Responses.*;
import com.edl.entity.Feedback;
import com.edl.entity.User;
import com.edl.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepo;

    @Transactional
    public void submit(User user, FeedbackRequest req) {
        feedbackRepo.save(Feedback.builder()
            .user(user)
            .category(req.getCategory())
            .message(req.getMessage())
            .anonymous(req.isAnonymous())
            .build());
    }

    @Transactional(readOnly = true)
    public PagedResponse<FeedbackResponse> listAll(Pageable pageable) {
        Page<Feedback> page = feedbackRepo.findAllByOrderByCreatedAtDesc(pageable);
        List<FeedbackResponse> items = page.getContent().stream()
            .map(fb -> FeedbackResponse.builder()
                .id(fb.getId())
                .category(fb.getCategory())
                .message(fb.getMessage())
                .anonymous(fb.isAnonymous())
                .createdAt(fb.getCreatedAt())
                .authorName(fb.isAnonymous() ? null : fb.getUser().getFullName())
                .build())
            .toList();
        return PagedResponse.<FeedbackResponse>builder()
            .content(items).page(page.getNumber()).size(page.getSize())
            .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
            .last(page.isLast()).build();
    }
}
