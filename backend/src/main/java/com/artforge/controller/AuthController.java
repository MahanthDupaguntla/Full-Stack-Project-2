package com.artforge.controller;

import com.artforge.dto.AuthResponse;
import com.artforge.dto.LoginRequest;
import com.artforge.dto.RegisterRequest;
import com.artforge.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "ArtForge API"));
    }

    @PostMapping("/api/auth/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/api/auth/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody com.artforge.dto.VerifyOtpRequest req) {
        return ResponseEntity.ok(authService.verifyOtp(req.getEmail(), req.getOtp()));
    }
}
