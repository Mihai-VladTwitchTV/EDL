package com.edl.controller;

import com.edl.dto.response.Responses.CompanyPageResponse;
import com.edl.service.CompanyPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pages")
@RequiredArgsConstructor
public class CompanyPageController {

    private final CompanyPageService companyPageService;

    @GetMapping
    public ResponseEntity<?> getPages(@RequestParam(required = false) String section) {
        try {
            if (section != null) {
                return ResponseEntity.ok(companyPageService.getBySection(section));
            }
            return ResponseEntity.ok(companyPageService.getAll());
        } catch (Exception e) {
            e.printStackTrace(); // Print to backend console
            // Send the exact error message to the frontend
            return ResponseEntity.internalServerError().body("Backend Crash: " + e.getMessage());
        }
    }

    @GetMapping("/{slug}")
    public ResponseEntity<?> getBySlug(@PathVariable String slug) {
        try {
            return ResponseEntity.ok(companyPageService.getBySlug(slug));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Backend Crash: " + e.getMessage());
        }
    }
}