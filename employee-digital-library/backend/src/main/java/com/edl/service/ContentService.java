package com.edl.service;

import com.edl.dto.response.Responses.ContentCardResponse;
import com.edl.dto.response.Responses.PagedResponse;
import com.edl.entity.*;
import com.edl.entity.ContentItem.ContentStatus;
import com.edl.entity.ContentItem.ContentType;
import com.edl.exception.ApiException;
import com.edl.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentItemRepository contentRepo;
    private final UserContentProgressRepository progressRepo;
    private final CategoryRepository categoryRepo;
    private final DepartmentRepository deptRepo;
    private final NotificationService notificationService;

    @Value("${storage.upload-dir:./uploads}")
    private String uploadDir;

    // -------------------------------------------------------
    // FEED
    // -------------------------------------------------------

    @Transactional(readOnly = true)
    public PagedResponse<ContentCardResponse> getFeed(User user, Pageable pageable) {
        Page<ContentItem> page;
        if (user.getDepartment() != null) {
            page = contentRepo.findFeedForDepartment(user.getDepartment().getId(), pageable);
        } else {
            page = contentRepo.findFeedAll(pageable);
        }
        return toPagedResponse(page, user);
    }

    @Transactional(readOnly = true)
    public List<ContentCardResponse> getMandatoryPending(User user) {
        if (user.getDepartment() == null) return List.of();
        return contentRepo.findUnacknowledgedMandatoryForUser(user.getId(), user.getDepartment().getId())
            .stream()
            .map(c -> toCard(c, null))
            .collect(Collectors.toList());
    }

    // -------------------------------------------------------
    // SEARCH
    // -------------------------------------------------------

    @Transactional(readOnly = true)
    public PagedResponse<ContentCardResponse> search(User user, String query, Pageable pageable) {
        String deptId = user.getDepartment() != null ? user.getDepartment().getId().toString() : null;
        Page<ContentItem> page = contentRepo.search(query, deptId, pageable);
        return toPagedResponse(page, user);
    }

    // -------------------------------------------------------
    // CATEGORY BROWSE
    // -------------------------------------------------------

    @Transactional(readOnly = true)
    public PagedResponse<ContentCardResponse> byCategory(User user, UUID categoryId, Pageable pageable) {
        UUID deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
        Page<ContentItem> page;
        if (deptId != null) {
            page = contentRepo.findByCategoryForDepartment(categoryId, deptId, pageable);
        } else {
            page = contentRepo.findByCategoryForDepartment(categoryId, UUID.randomUUID(), pageable);
        }
        return toPagedResponse(page, user);
    }

    // -------------------------------------------------------
    // SINGLE ITEM
    // -------------------------------------------------------

    @Transactional
    public ContentCardResponse getById(User user, UUID id) {
        ContentItem item = contentRepo.findById(id)
            .orElseThrow(() -> new ApiException("Content not found", HttpStatus.NOT_FOUND));
        contentRepo.incrementViewCount(id);
        UserContentProgress progress = getOrCreateProgress(user, item);
        progress.setLastAccessedAt(OffsetDateTime.now());
        progressRepo.save(progress);
        return toCard(item, progress);
    }

    // -------------------------------------------------------
    // PROGRESS / ACKNOWLEDGMENT
    // -------------------------------------------------------

    @Transactional
    public void acknowledge(User user, UUID contentId) {
        ContentItem item = contentRepo.findById(contentId)
            .orElseThrow(() -> new ApiException("Content not found", HttpStatus.NOT_FOUND));
        UserContentProgress p = getOrCreateProgress(user, item);
        if (!p.isAcknowledged()) {
            p.setAcknowledged(true);
            p.setAcknowledgedAt(OffsetDateTime.now());
            progressRepo.save(p);
        }
    }

    @Transactional
    public void markCompleted(User user, UUID contentId) {
        ContentItem item = contentRepo.findById(contentId)
            .orElseThrow(() -> new ApiException("Content not found", HttpStatus.NOT_FOUND));
        UserContentProgress p = getOrCreateProgress(user, item);
        if (!p.isCompleted()) {
            p.setCompleted(true);
            p.setCompletedAt(OffsetDateTime.now());
            p.setProgressPct((short) 100);
            progressRepo.save(p);
        }
    }

    @Transactional
    public void updateProgress(User user, UUID contentId, short pct) {
        ContentItem item = contentRepo.findById(contentId)
            .orElseThrow(() -> new ApiException("Content not found", HttpStatus.NOT_FOUND));
        UserContentProgress p = getOrCreateProgress(user, item);
        p.setProgressPct(pct);
        if (pct >= 95) {
            p.setCompleted(true);
            if (p.getCompletedAt() == null) p.setCompletedAt(OffsetDateTime.now());
        }
        progressRepo.save(p);
    }

    // -------------------------------------------------------
    // CONTENT CREATION / APPROVAL
    // -------------------------------------------------------

    @Transactional
    public ContentCardResponse createContent(
        User author, String title, String description,
        String contentTypeStr, boolean mandatory,
        String categoryId, List<String> departmentIds,
        MultipartFile file
    ) {
        ContentType type = ContentType.valueOf(contentTypeStr.toUpperCase());

        ContentItem item = ContentItem.builder()
            .title(title)
            .description(description)
            .contentType(type)
            .status(ContentStatus.DRAFT)
            .mandatory(mandatory)
            .author(author)
            .build();

        if (categoryId != null) {
            categoryRepo.findById(UUID.fromString(categoryId)).ifPresent(item::setCategory);
        }

        if (departmentIds != null && !departmentIds.isEmpty()) {
            Set<Department> depts = departmentIds.stream()
                .map(did -> deptRepo.findById(UUID.fromString(did)).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
            item.setTargetDepartments(depts);
        }

        if (file != null && !file.isEmpty()) {
            String url = saveFile(file);
            item.setThumbnailUrl(url);
        }

        contentRepo.save(item);
        return toCard(item, null);
    }

    @Transactional
    public void submitForReview(User user, UUID contentId) {
        ContentItem item = contentRepo.findById(contentId)
            .orElseThrow(() -> new ApiException("Content not found", HttpStatus.NOT_FOUND));
        if (!item.getAuthor().getId().equals(user.getId())) {
            throw new ApiException("Not the author", HttpStatus.FORBIDDEN);
        }
        item.setStatus(ContentStatus.PENDING_REVIEW);
        contentRepo.save(item);
    }

    @Transactional
    public void approve(User approver, UUID contentId) {
        ContentItem item = contentRepo.findById(contentId)
            .orElseThrow(() -> new ApiException("Content not found", HttpStatus.NOT_FOUND));
        item.setStatus(ContentStatus.PUBLISHED);
        item.setApprovedBy(approver);
        item.setApprovedAt(OffsetDateTime.now());
        contentRepo.save(item);
        // notify targeted departments
        notificationService.notifyNewContent(item);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ContentCardResponse> getPendingReview(Pageable pageable) {
        Page<ContentItem> page = contentRepo.findByStatusOrderByCreatedAtDesc(ContentStatus.PENDING_REVIEW, pageable);
        return toPagedResponse(page, null);
    }

    // -------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------

    private UserContentProgress getOrCreateProgress(User user, ContentItem item) {
        return progressRepo.findByUserIdAndContentId(user.getId(), item.getId())
            .orElseGet(() -> UserContentProgress.builder()
                .user(user)
                .content(item)
                .build());
    }

    private PagedResponse<ContentCardResponse> toPagedResponse(Page<ContentItem> page, User user) {
        Map<UUID, UserContentProgress> progressMap = new HashMap<>();
        if (user != null && !page.isEmpty()) {
            page.getContent().forEach(item ->
                progressRepo.findByUserIdAndContentId(user.getId(), item.getId())
                    .ifPresent(p -> progressMap.put(item.getId(), p))
            );
        }

        List<ContentCardResponse> cards = page.getContent().stream()
            .map(item -> toCard(item, progressMap.get(item.getId())))
            .collect(Collectors.toList());

        return PagedResponse.<ContentCardResponse>builder()
            .content(cards)
            .page(page.getNumber())
            .size(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .last(page.isLast())
            .build();
    }

    public static ContentCardResponse toCard(ContentItem item, UserContentProgress progress) {
        return ContentCardResponse.builder()
            .id(item.getId())
            .title(item.getTitle())
            .description(item.getDescription())
            .contentType(item.getContentType().name())
            .mandatory(item.isMandatory())
            .categoryName(item.getCategory() != null ? item.getCategory().getName() : null)
            .categoryIconName(item.getCategory() != null ? item.getCategory().getIconName() : null)
            .categoryColorHex(item.getCategory() != null ? item.getCategory().getColorHex() : null)
            .thumbnailUrl(item.getThumbnailUrl())
            .authorName(item.getAuthor() != null ? item.getAuthor().getFullName() : null)
            .viewCount(item.getViewCount())
            .createdAt(item.getCreatedAt())
            .userAcknowledged(progress != null ? progress.isAcknowledged() : null)
            .userCompleted(progress != null ? progress.isCompleted() : null)
            .userProgressPct(progress != null ? progress.getProgressPct() : null)
            .build();
    }

    private String saveFile(MultipartFile file) {
        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path dest = dir.resolve(filename);
            file.transferTo(dest);
            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new ApiException("Failed to save file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
