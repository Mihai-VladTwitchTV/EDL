package com.edl.controller;

import com.edl.dto.request.AuthRequests.CreateCertificationRequest;
import com.edl.dto.response.Responses.*;
import com.edl.entity.User;
import com.edl.service.CertificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certifications")
@RequiredArgsConstructor
public class CertificationController {

    private final CertificationService certificationService;

    @GetMapping("/me")
    public ResponseEntity<List<UserCertificationResponse>> getMyCertifications(
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(certificationService.getMyCertifications(user));
    }

    @GetMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<CertificationResponse>> listAll() {
        return ResponseEntity.ok(certificationService.listAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<CertificationResponse> create(
        @RequestBody CreateCertificationRequest req
    ) {
        return ResponseEntity.status(201).body(certificationService.create(req));
    }
}
