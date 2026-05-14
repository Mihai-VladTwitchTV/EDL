package com.edl.controller;

import com.edl.dto.response.Responses.SectionResponse;
import com.edl.entity.Category;
import com.edl.entity.Department;
import com.edl.entity.Section;
import com.edl.repository.CategoryRepository;
import com.edl.repository.DepartmentRepository;
import com.edl.repository.SectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MetaController {

    private final DepartmentRepository deptRepo;
    private final CategoryRepository categoryRepo;
    private final SectionRepository sectionRepo;

    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getDepartments() {
        return ResponseEntity.ok(deptRepo.findAll());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryRepo.findAll());
    }

    @GetMapping("/sections")
    public ResponseEntity<List<SectionResponse>> getSections(
        @RequestParam(required = false) UUID departmentId
    ) {
        List<Section> sections = departmentId != null
            ? sectionRepo.findByDepartmentIdOrderByName(departmentId)
            : sectionRepo.findAll();
        return ResponseEntity.ok(sections.stream()
            .map(s -> SectionResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .description(s.getDescription())
                .departmentId(s.getDepartment().getId())
                .departmentName(s.getDepartment().getName())
                .build())
            .toList());
    }
}
