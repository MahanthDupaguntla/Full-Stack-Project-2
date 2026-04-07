package com.artforge.controller;

import com.artforge.model.User;
import com.artforge.model.UserRole;
import com.artforge.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // GET /api/users/me
    @GetMapping("/me")
    public ResponseEntity<User> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getByEmail(userDetails.getUsername()));
    }

    // PUT /api/users/me
    @PutMapping("/me")
    public ResponseEntity<User> updateMe(@RequestBody User updates,
                                         @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.updateProfile(userDetails.getUsername(), updates));
    }

    // GET /api/users — Admin only
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // PUT /api/users/{id}/role — Admin only
    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateRole(@PathVariable String id,
                                           @RequestBody Map<String, String> body) {
        UserRole role = UserRole.valueOf(body.get("role"));
        return ResponseEntity.ok(userService.updateRole(id, role));
    }
}
