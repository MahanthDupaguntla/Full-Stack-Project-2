package com.artforge.service;

import com.artforge.dto.AuthResponse;
import com.artforge.dto.LoginRequest;
import com.artforge.dto.RegisterRequest;
import com.artforge.model.User;
import com.artforge.model.UserRole;
import com.artforge.repository.UserRepository;
import com.artforge.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    private String generateOtp() {
        return String.format("%06d", new Random().nextInt(999999));
    }

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
                .isVerified(false)
                .build();

        String otp = generateOtp();

        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));

        userRepository.save(user);
        
        emailService.sendOtpEmail(user.getEmail(), user.getName(), otp);

        return AuthResponse.builder().message("OTP sent").build();
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String otp = generateOtp();
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        emailService.sendOtpEmail(user.getEmail(), user.getName(), otp);

        return AuthResponse.builder().message("OTP sent").build();
    }

    public AuthResponse verifyOtp(String email, String otpCode) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getOtpCode() == null || !user.getOtpCode().equals(otpCode)) {
            throw new RuntimeException("Invalid OTP code");
        }

        if (user.getOtpExpiry() != null && user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please log in again.");
        }

        // Clear OTP
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        user.setVerified(true);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return buildResponse(token, user);
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
}
