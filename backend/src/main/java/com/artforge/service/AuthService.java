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

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

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
                .isVerified(true) // Automatically verify the user
                .build();

        userRepository.save(user);
        
        // Instantly generate token and log them in
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return buildResponse(token, user);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        user.setVerified(true);
        userRepository.save(user);

        // Instantly generate token and log them in
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
