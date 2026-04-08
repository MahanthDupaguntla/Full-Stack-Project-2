package com.artforge.service;

import lombok.extern.slf4j.Slf4j;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OtpService {

    @Autowired
    private JavaMailSender mailSender;
    
    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    private static class OtpData {
        String code;
        long expiryTime;
        OtpData(String code) {
            this.code = code;
            this.expiryTime = System.currentTimeMillis() + (5 * 60 * 1000); // 5 minutes
        }
    }

    public void generateAndSendOtp(String email) {
        String otp = String.format("%06d", random.nextInt(1000000));
        otpStorage.put(email, new OtpData(otp));

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            if (email == null) throw new IllegalArgumentException("Email cannot be null");
            helper.setTo(email);
            helper.setSubject("Your ArtForge Verification Code");
            
            String htmlContent = "<html><body style='font-family: serif; color: #111;'>" +
                "<div style='max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;'>" +
                "<h1 style='color: #f59e0b;'>ArtForge Sanctuary</h1>" +
                "<p style='font-size: 16px; line-height: 1.6;'>Welcome to the collective. To finalize your entrance into the digital art sanctuary, please use the following security code:</p>" +
                "<div style='background: #fdf2f2; border: 1px solid #fecaca; text-align: center; padding: 30px; border-radius: 15px; margin: 30px 0;'>" +
                "<span style='font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #b91c1c;'>" + otp + "</span>" +
                "</div>" +
                "<p style='font-size: 12px; color: #666;'>This code will expire in 5 minutes. If you did not request this, please ignore this email.</p>" +
                "</div></body></html>";
            
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Secure HTML OTP sent to {}", email);
        } catch (Exception e) {
            log.error("Failed to send OTP to {}: {}", email, e.getMessage());
            log.warn("FALLBACK CODE FOR {}: [{}]", email, otp);
        }
    }

    public boolean verifyOtp(String email, String otp) {
        OtpData data = otpStorage.get(email);
        if (data == null) return false;
        
        if (System.currentTimeMillis() > data.expiryTime) {
            otpStorage.remove(email);
            return false;
        }
        
        if (data.code.equals(otp)) {
            otpStorage.remove(email);
            return true;
        }
        return false;
    }
}
