package com.edl.service;

import com.edl.dto.request.AuthRequests.CreateCertificationRequest;
import com.edl.dto.response.Responses.*;
import com.edl.entity.Certification;
import com.edl.entity.ContentItem;
import com.edl.entity.User;
import com.edl.entity.UserCertification;
import com.edl.exception.ApiException;
import com.edl.repository.CertificationRepository;
import com.edl.repository.ContentItemRepository;
import com.edl.repository.UserCertificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificationService {

    private final CertificationRepository certRepo;
    private final UserCertificationRepository userCertRepo;
    private final ContentItemRepository contentRepo;

    @Transactional(readOnly = true)
    public List<UserCertificationResponse> getMyCertifications(User user) {
        return userCertRepo.findByUserIdOrderByIssuedAtDesc(user.getId()).stream()
            .map(this::toUserCertResponse)
            .toList();
    }

    @Transactional
    public CertificationResponse create(CreateCertificationRequest req) {
        ContentItem content = null;
        if (req.getContentId() != null) {
            content = contentRepo.findById(UUID.fromString(req.getContentId()))
                .orElseThrow(() -> new ApiException("Content not found", HttpStatus.NOT_FOUND));
        }
        Certification cert = Certification.builder()
            .name(req.getName())
            .description(req.getDescription())
            .content(content)
            .passThreshold(req.getPassThreshold())
            .validDays(req.getValidDays())
            .build();
        certRepo.save(cert);
        return toCertResponse(cert);
    }

    @Transactional(readOnly = true)
    public List<CertificationResponse> listAll() {
        return certRepo.findAll().stream().map(this::toCertResponse).toList();
    }

    private UserCertificationResponse toUserCertResponse(UserCertification uc) {
        boolean expired = uc.getExpiresAt() != null && uc.getExpiresAt().isBefore(OffsetDateTime.now());
        return UserCertificationResponse.builder()
            .id(uc.getId())
            .name(uc.getCertification().getName())
            .description(uc.getCertification().getDescription())
            .issuedAt(uc.getIssuedAt())
            .expiresAt(uc.getExpiresAt())
            .expired(expired)
            .build();
    }

    private CertificationResponse toCertResponse(Certification c) {
        return CertificationResponse.builder()
            .id(c.getId())
            .name(c.getName())
            .description(c.getDescription())
            .passThreshold(c.getPassThreshold())
            .build();
    }
}
