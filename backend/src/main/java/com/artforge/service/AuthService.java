package com.artforge.service;

import com.artforge.dto.AuthResponse;
import com.artforge.dto.LoginRequest;
import com.artforge.dto.RegisterRequest;
import com.artforge.model.User;
import com.artforge.model.UserRole;
import com.artforge.repository.UserRepository;
import com.artforge.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@SuppressWarnings("null")
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;

    // Set OTP_ENABLED=true on Railway to enable email OTP verification
    // Default: false — users are verified instantly (best for Railway hobby tier)
    @Value("${otp.enabled:false}")
    private boolean otpEnabled;

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(req.getRole() != null ? req.getRole() : UserRole.VISITOR)
                .avatar("https://api.dicebear.com/7.x/avataaars/svg?seed=" + req.getName())
                .isVerified(!otpEnabled) // If OTP disabled, auto-verify
                .build();

        userRepository.save(user);

        if (otpEnabled) {
            // Send OTP — user must verify before getting a token
            otpService.generateAndSendOtp(req.getEmail());
            log.info("OTP sent for new registration: {}", req.getEmail());
            return buildPendingResponse(user);
        }

        // No OTP — instant login
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return buildResponse(token, user);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (otpEnabled) {
            // Send OTP for login verification
            otpService.generateAndSendOtp(req.getEmail());
            log.info("OTP sent for login: {}", req.getEmail());
            return buildPendingResponse(user);
        }

        // No OTP — instant login
        user.setVerified(true);
        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return buildResponse(token, user);
    }

    public AuthResponse verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!otpService.verifyOtp(email, otp)) {
            throw new RuntimeException("Invalid or expired OTP. Use code 000000 if SMTP is unavailable.");
        }

        user.setVerified(true);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return buildResponse(token, user);
    }

    public void resendOtp(String email) {
        if (!userRepository.existsByEmail(email)) {
            throw new RuntimeException("User not found");
        }
        otpService.generateAndSendOtp(email);
    }

    private AuthResponse buildResponse(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .avatar(user.getAvatar())
                .walletBalance(user.getWalletBalance())
                .subscription(user.getSubscription())
                .totalEarned(user.getTotalEarned())
                .build();
    }

    private AuthResponse buildPendingResponse(User user) {
        return AuthResponse.builder()
                .token("PENDING_VERIFICATION")
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .avatar(user.getAvatar())
                .walletBalance(user.getWalletBalance())
                .subscription(user.getSubscription())
                .totalEarned(user.getTotalEarned())
                .build();
    }
}
