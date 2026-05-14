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
    public ResponseEntity<List<CompanyPageResponse>> getPages(
        @RequestParam(required = false) String section
    ) {
        if (section != null) return ResponseEntity.ok(companyPageService.getBySection(section));
        return ResponseEntity.ok(companyPageService.getAll());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<CompanyPageResponse> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(companyPageService.getBySlug(slug));
    }
}
