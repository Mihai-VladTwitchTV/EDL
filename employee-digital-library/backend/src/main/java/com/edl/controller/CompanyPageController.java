package com.edl.controller;

import com.edl.dto.response.Responses.CompanyPageResponse;
import com.edl.service.CompanyPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pages")
@RequiredArgsConstructor
public class CompanyPageController {

    private final CompanyPageService companyPageService;

    @GetMapping
    public ResponseEntity<List<CompanyPageResponse>> getBySection(
        @RequestParam String section
    ) {
        return ResponseEntity.ok(companyPageService.getBySection(section));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<CompanyPageResponse> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(companyPageService.getBySlug(slug));
    }
}
