package com.artforge.controller;

import com.artforge.dto.AuthResponse;
import com.artforge.dto.LoginRequest;
import com.artforge.dto.RegisterRequest;
import com.artforge.service.AuthService;
import com.artforge.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequiredArgsConstructor
// Defence-in-depth: controller-level CORS in case filter chain ordering causes issues
@CrossOrigin(origins = "*", allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST,
                   RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    // ── CORS preflight — explicit OPTIONS handler so Railway never returns 405 ──
    // A browser sends OPTIONS before every cross-origin POST/PUT/DELETE.
    // This catches any edge-case where the global CORS filter isn't hit first.
    @RequestMapping(value = "/api/auth/**", method = RequestMethod.OPTIONS)
    public ResponseEntity<Void> handleAuthPreflight() {
        return ResponseEntity.ok().build();
    }

    // ── Health check (used by frontend to detect backend) ──────────────────────
    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "ArtForge API"));
    }

    // ── Auth endpoints ─────────────────────────────────────────────────────────
    @PostMapping("/api/auth/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/api/auth/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.verifyOtp(body.get("email"), body.get("otp")));
    }

    @PostMapping("/api/auth/resend-otp")
    public ResponseEntity<Map<String, String>> resendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        otpService.generateAndSendOtp(email);
        return ResponseEntity.ok(Map.of("message", "OTP resent to " + email));
    }
}

