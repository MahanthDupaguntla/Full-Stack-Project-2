package com.artforge.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendOtpEmail(String toEmail, String name, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("ArtForge Authentication Code");
            
            String htmlContent = buildOtpEmailHtml(name, otp);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage());
        }
    }

    private String buildOtpEmailHtml(String name, String otp) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n" +
                "  <title>Authentication Code — ArtForge</title>\n" +
                "</head>\n" +
                "<body style=\"margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif\">\n" +
                "  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#0a0a0a;padding:40px 20px\">\n" +
                "    <tr><td align=\"center\">\n" +
                "      <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;width:100%\">\n" +
                "        <tr><td style=\"background:linear-gradient(135deg,#1a1a1a 0%,#0f0f0f 100%);border-radius:20px 20px 0 0;padding:40px 40px 32px;text-align:center;border:1px solid rgba(245,158,11,0.15);border-bottom:none\">\n" +
                "          <div style=\"display:inline-flex;align-items:center;gap:12px;margin-bottom:8px\">\n" +
                "            <div style=\"width:42px;height:42px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:12px;display:flex;align-items:center;justify-content:center\">\n" +
                "              <span style=\"font-size:20px;color:black;\">⚒</span>\n" +
                "            </div>\n" +
                "            <span style=\"color:#f59e0b;font-size:22px;font-weight:800;letter-spacing:-0.5px\">ArtForge</span>\n" +
                "          </div>\n" +
                "          <p style=\"margin:0;color:#52525b;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:600\">\n" +
                "            Authentication Code\n" +
                "          </p>\n" +
                "        </td></tr>\n" +
                "        <tr><td style=\"background:#111111;padding:40px;border:1px solid rgba(245,158,11,0.10);border-top:none;border-bottom:none\">\n" +
                "          <p style=\"margin:0 0 8px;color:#a1a1aa;font-size:15px\">Hello, <strong style=\"color:#e4e4e7\">" + name + "</strong> 👋</p>\n" +
                "          <p style=\"margin:0 0 32px;color:#71717a;font-size:14px;line-height:1.7\">\n" +
                "            Use the code below to securely verify your identity and access the ArtForge gallery:\n" +
                "          </p>\n" +
                "          <div style=\"background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(245,158,11,0.03));border:2px solid rgba(245,158,11,0.25);border-radius:16px;padding:32px;text-align:center;margin-bottom:32px\">\n" +
                "            <p style=\"margin:0 0 12px;color:#71717a;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-weight:700\">Your Verification Code</p>\n" +
                "            <div style=\"display:inline-block;letter-spacing:14px;font-size:48px;font-weight:900;color:#f59e0b;font-family:'Courier New',monospace;text-shadow:0 0 30px rgba(245,158,11,0.4)\">" + otp + "</div>\n" +
                "            <p style=\"margin:16px 0 0;color:#52525b;font-size:12px\">\n" +
                "              ⏱ Expires in <strong style=\"color:#f59e0b\">5 minutes</strong>\n" +
                "            </p>\n" +
                "          </div>\n" +
                "          <div style=\"background:rgba(255,255,255,0.02);border-radius:12px;padding:20px;margin-bottom:24px\">\n" +
                "            <p style=\"margin:0 0 10px;color:#a1a1aa;font-size:13px;font-weight:600\">How to use:</p>\n" +
                "            <ol style=\"margin:0;padding-left:20px;color:#71717a;font-size:13px;line-height:1.8\">\n" +
                "              <li>Return to the ArtForge authentication screen</li>\n" +
                "              <li>Enter the 6-digit code in the verification boxes</li>\n" +
                "              <li>The code will auto-submit once all digits are entered</li>\n" +
                "            </ol>\n" +
                "          </div>\n" +
                "        </td></tr>\n" +
                "        <tr><td style=\"background:#0d0d0d;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;border:1px solid rgba(245,158,11,0.08);border-top:1px solid rgba(255,255,255,0.04)\">\n" +
                "          <p style=\"margin:0 0 8px;color:#3f3f46;font-size:11px\">\n" +
                "            © 2026 ArtForge Platform · All rights reserved\n" +
                "          </p>\n" +
                "          <p style=\"margin:0;color:#27272a;font-size:10px\">\n" +
                "            This is an automated security email. Please do not reply.\n" +
                "          </p>\n" +
                "        </td></tr>\n" +
                "      </table>\n" +
                "    </td></tr>\n" +
                "  </table>\n" +
                "</body>\n" +
                "</html>";
    }
}
