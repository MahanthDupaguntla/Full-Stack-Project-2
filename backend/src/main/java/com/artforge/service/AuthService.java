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

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;

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
                .build();

        userRepository.save(user);
        otpService.generateAndSendOtp(user.getEmail());
        
        // Return without a token (or dummy token) to signify OTP is needed
        return buildResponse("PENDING_VERIFICATION", user);
    }

    public AuthResponse verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!otpService.verifyOtp(email, otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        user.setVerified(true);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return buildResponse(token, user);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (!user.isVerified()) {
            otpService.generateAndSendOtp(user.getEmail());
            return buildResponse("PENDING_VERIFICATION", user);
        }

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
