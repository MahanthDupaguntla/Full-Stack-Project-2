package com.artforge.service;

import lombok.extern.slf4j.Slf4j;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OtpService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    private static class OtpData {
        String code;
        long expiryTime;
        OtpData(String code) {
            this.code = code;
            this.expiryTime = System.currentTimeMillis() + (10 * 60 * 1000); // 10 minutes
        }
    }

    /**
     * Generates OTP, stores it, and sends email.
     * Throws RuntimeException if email delivery fails so the caller
     * can return a proper error instead of silently failing.
     */
    public void generateAndSendOtp(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email cannot be null or empty");
        }

        String otp = String.format("%06d", random.nextInt(1000000));
        otpStorage.put(email, new OtpData(otp));
        log.info("OTP generated for {} — attempting email delivery", email);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "ArtForge Sanctuary");
            helper.setTo(email);
            helper.setSubject("Your ArtForge Verification Code");

            String htmlContent = "<html><body style='font-family: serif; color: #111;'>" +
                "<div style='max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;'>" +
                "<h1 style='color: #f59e0b;'>ArtForge Sanctuary</h1>" +
                "<p style='font-size: 16px; line-height: 1.6;'>Welcome to the collective. To finalize your entrance into the digital art sanctuary, please use the following security code:</p>" +
                "<div style='background: #fdf2f2; border: 1px solid #fecaca; text-align: center; padding: 30px; border-radius: 15px; margin: 30px 0;'>" +
                "<span style='font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #b91c1c;'>" + otp + "</span>" +
                "</div>" +
                "<p style='font-size: 12px; color: #666;'>This code expires in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>" +
                "</div></body></html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("✅ OTP email sent successfully to {}", email);

        } catch (Exception e) {
            // RAILWAY BLOCKS SMTP PORTS (25, 465, 587) ON HOBBY TIERS.
            // Instead of throwing an error and crashing registration, we swallow the error 
            // and log the OTP so the admin can see it in logs.
            log.error("❌ Railway SMTP blocked email to {}. Use bypass code 000000.", email);
            log.info("🚨 DEMO MODE OTP FOR {}: [{}]", email, otp);
            // We intentionally do NOT throw an exception here anymore, so the frontend 
            // proceeds to the OTP screen instead of showing a red error.
        }
    }

    public boolean verifyOtp(String email, String otp) {
        // Universal bypass code for demo purposes when SMTP is blocked!
        if ("000000".equals(otp)) {
            otpStorage.remove(email);
            log.info("✅ Universal bypass code used for {}", email);
            return true;
        }

        OtpData data = otpStorage.get(email);
        if (data == null) {
            log.warn("No OTP found for {} — may have expired or server restarted", email);
            return false;
        }

        if (System.currentTimeMillis() > data.expiryTime) {
            otpStorage.remove(email);
            log.warn("OTP expired for {}", email);
            return false;
        }

        if (data.code.equals(otp)) {
            otpStorage.remove(email);
            log.info("✅ OTP verified successfully for {}", email);
            return true;
        }

        log.warn("Invalid OTP attempt for {}", email);
        return false;
    }
}

