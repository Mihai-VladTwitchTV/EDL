package com.edl.service;

import com.edl.dto.response.Responses.CompanyPageResponse;
import com.edl.entity.CompanyPage;
import com.edl.exception.ApiException;
import com.edl.repository.CompanyPageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyPageService {

    private final CompanyPageRepository pageRepo;

    @Transactional(readOnly = true)
    public List<CompanyPageResponse> getAll() {
        return pageRepo.findAllPublished()
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CompanyPageResponse> getBySection(String section) {
        return pageRepo.findPublishedBySection(section)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CompanyPageResponse getBySlug(String slug) {
        return pageRepo.findBySlug(slug)
            .filter(CompanyPage::isPublished)
            .map(this::toResponse)
            .orElseThrow(() -> new ApiException("Page not found", HttpStatus.NOT_FOUND));
    }

    private CompanyPageResponse toResponse(CompanyPage p) {
        return CompanyPageResponse.builder()
            .id(p.getId())
            .slug(p.getSlug())
            .section(p.getSection())
            .title(p.getTitle())
            .bodyHtml(p.getBodyHtml())
            // Safe unboxing fallback just in case DB has nulls
            .displayOrder(p.getDisplayOrder() != null ? p.getDisplayOrder() : 0)
            .build();
    }
}