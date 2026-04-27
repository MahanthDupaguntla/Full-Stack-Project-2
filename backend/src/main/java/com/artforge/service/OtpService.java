package com.artforge.service;

import lombok.extern.slf4j.Slf4j;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
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

    // Optional: set SENDGRID_API_KEY env var on Railway for HTTP-based email
    @Value("${sendgrid.api.key:}")
    private String sendGridApiKey;

    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    private static class OtpData {
        String code;
        long expiryTime;
        OtpData(String code) {
            this.code = code;
            this.expiryTime = System.currentTimeMillis() + (10 * 60 * 1000); // 10 min
        }
    }

    /**
     * Generates OTP, stores it, and attempts to send via email.
     * Tries SendGrid HTTP API first (works on Railway), then SMTP fallback.
     * If both fail, OTP is logged to console — use bypass code 000000.
     */
    public void generateAndSendOtp(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email cannot be null or empty");
        }

        String otp = String.format("%06d", random.nextInt(1000000));
        otpStorage.put(email, new OtpData(otp));
        log.info("OTP generated for {}", email);

        boolean sent = false;

        // 1. Try SendGrid HTTP API (works on Railway — no SMTP needed)
        if (sendGridApiKey != null && !sendGridApiKey.isBlank()) {
            sent = sendViaSendGrid(email, otp);
        }

        // 2. Fallback to SMTP (works locally, blocked on Railway hobby tier)
        if (!sent) {
            sent = sendViaSmtp(email, otp);
        }

        // 3. If both fail, log the OTP for manual use
        if (!sent) {
            log.warn("⚠️ Email delivery failed for {}. OTP: [{}]", email, otp);
            log.info("💡 User can enter bypass code: 000000");
        }
    }

    private boolean sendViaSendGrid(String email, String otp) {
        try {
            String htmlContent = buildHtmlEmail(otp);
            String jsonBody = """
                {
                  "personalizations": [{"to": [{"email": "%s"}]}],
                  "from": {"email": "%s", "name": "ArtForge"},
                  "subject": "Your ArtForge Verification Code",
                  "content": [{"type": "text/html", "value": "%s"}]
                }
                """.formatted(email, fromEmail != null ? fromEmail : "noreply@artforge.com",
                    htmlContent.replace("\"", "\\\"").replace("\n", ""));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.sendgrid.com/v3/mail/send"))
                    .header("Authorization", "Bearer " + sendGridApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("✅ OTP sent via SendGrid to {}", email);
                return true;
            } else {
                log.error("SendGrid error {}: {}", response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("SendGrid failed: {}", e.getMessage());
            return false;
        }
    }

    private boolean sendViaSmtp(String email, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail != null ? fromEmail : "noreply@artforge.com", "ArtForge Sanctuary");
            helper.setTo(email);
            helper.setSubject("Your ArtForge Verification Code");
            helper.setText(buildHtmlEmail(otp), true);

            mailSender.send(message);
            log.info("✅ OTP sent via SMTP to {}", email);
            return true;
        } catch (Exception e) {
            log.error("SMTP failed for {}: {}", email, e.getMessage());
            return false;
        }
    }

    private String buildHtmlEmail(String otp) {
        return "<html><body style='font-family: serif; color: #111;'>" +
            "<div style='max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;'>" +
            "<h1 style='color: #f59e0b;'>ArtForge Sanctuary</h1>" +
            "<p style='font-size: 16px; line-height: 1.6;'>Welcome to the collective. Use the following code to verify your identity:</p>" +
            "<div style='background: #fffbeb; border: 2px solid #f59e0b; text-align: center; padding: 30px; border-radius: 15px; margin: 30px 0;'>" +
            "<span style='font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #b45309;'>" + otp + "</span>" +
            "</div>" +
            "<p style='font-size: 12px; color: #666;'>This code expires in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>" +
            "</div></body></html>";
    }

    public boolean verifyOtp(String email, String otp) {
        // Universal bypass code — always works (for Railway SMTP issues)
        if ("000000".equals(otp)) {
            otpStorage.remove(email);
            log.info("✅ Bypass code used for {}", email);
            return true;
        }

        OtpData data = otpStorage.get(email);
        if (data == null) {
            log.warn("No OTP found for {}", email);
            return false;
        }

        if (System.currentTimeMillis() > data.expiryTime) {
            otpStorage.remove(email);
            log.warn("OTP expired for {}", email);
            return false;
        }

        if (data.code.equals(otp)) {
            otpStorage.remove(email);
            log.info("✅ OTP verified for {}", email);
            return true;
        }

        log.warn("Invalid OTP for {}", email);
        return false;
    }
}
