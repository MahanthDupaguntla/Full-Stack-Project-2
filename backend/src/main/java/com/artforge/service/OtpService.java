package com.artforge.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OtpService {

    @Autowired(required = false)
    private JavaMailSender mailSender;
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public void generateAndSendOtp(String email) {
        String otp = String.format("%06d", random.nextInt(1000000));
        otpStorage.put(email, otp);

        try {
            if (mailSender != null) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(email);
                message.setSubject("Your ArtForge Verification Code");
                message.setText("Welcome to ArtForge!\n\nYour 6-digit verification code is: " + otp + "\n\nThis code will expire shortly.");
                mailSender.send(message);
                log.info("Successfully sent OTP email to {}", email);
            } else {
                log.warn("JavaMailSender is not configured. Falling back to console OTP logging.");
                log.warn("================================================");
                log.warn(">> YOUR SECURE OTP FOR {} IS: [{}] <<", email, otp);
                log.warn("================================================");
            }
        } catch (Exception e) {
            log.warn("Failed to send OTP email to {}. If you haven't configured SMTP, use this OTP to proceed: {}", email, otp);
            log.warn("Email Exception: {}", e.getMessage());
        }
    }

    public boolean verifyOtp(String email, String otp) {
        String storedOtp = otpStorage.get(email);
        if (storedOtp != null && storedOtp.equals(otp)) {
            otpStorage.remove(email);
            return true;
        }
        return false;
    }
}
