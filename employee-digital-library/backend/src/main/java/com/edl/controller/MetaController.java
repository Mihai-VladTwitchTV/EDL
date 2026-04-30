package com.edl.controller;

import com.edl.entity.Department;
import com.edl.repository.DepartmentRepository;
import com.edl.repository.CategoryRepository;
import com.edl.entity.Category;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MetaController {

    private final DepartmentRepository deptRepo;
    private final CategoryRepository categoryRepo;

    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getDepartments() {
        return ResponseEntity.ok(deptRepo.findAll());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryRepo.findAll());
    }
}
