package com.artforge.controller;

import com.artforge.model.Exhibition;
import com.artforge.repository.ExhibitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exhibitions")
@RequiredArgsConstructor
public class ExhibitionController {

    private final ExhibitionRepository exhibitionRepository;

    @GetMapping
    public ResponseEntity<List<Exhibition>> getAll() {
        return ResponseEntity.ok(exhibitionRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Exhibition> getById(@PathVariable String id) {
        return ResponseEntity.ok(exhibitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exhibition not found")));
    }

    @PreAuthorize("hasAnyRole('CURATOR', 'ADMIN')")
    @PostMapping
    public ResponseEntity<Exhibition> create(@RequestBody Exhibition exhibition) {
        return ResponseEntity.ok(exhibitionRepository.save(exhibition));
    }

    @PreAuthorize("hasAnyRole('CURATOR', 'ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Exhibition> update(@PathVariable String id,
                                             @RequestBody Exhibition updates) {
        Exhibition ex = exhibitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exhibition not found"));
        ex.setTitle(updates.getTitle());
        ex.setTheme(updates.getTheme());
        ex.setDescription(updates.getDescription());
        ex.setStatus(updates.getStatus());
        ex.setBannerUrl(updates.getBannerUrl());
        return ResponseEntity.ok(exhibitionRepository.save(ex));
    }
}
