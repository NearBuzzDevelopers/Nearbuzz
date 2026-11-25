package com.studentseva.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Service to dispatch OTP emails to users.
 *
 * Uses Brevo HTTPS API (port 443, compatible with Render free tier where outbound
 * SMTP ports 25/465/587 are blocked) when BREVO_API_KEY and BREVO_SENDER_EMAIL are set,
 * otherwise falls back to JavaMailSender or console logging in dev.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private final JavaMailSender mailSender;
    private final RestClient restClient;

    @Value("${spring.mail.username:noreply@studentseva.com}")
    private String fromEmail;

    @Value("${app.mail.brevo-api-key:}")
    private String brevoApiKey;

    @Value("${app.mail.sender-email:}")
    private String senderEmail;

    @Value("${app.mail.sender-name:NearBuzz}")
    private String senderName;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(5000);
        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .build();
    }

    /**
     * Sends the 6-digit OTP code to the requested email.
     *
     * @param toEmail The destination email address.
     * @param otp     The 6-digit plaintext OTP code.
     */
    public void sendOtpEmail(String toEmail, String otp) {
        if (isBrevoConfigured()) {
            try {
                sendViaBrevo(toEmail, otp);
                log.info("Successfully dispatched OTP email via Brevo to {}", toEmail);
                return;
            } catch (Exception ex) {
                log.warn("Brevo email dispatch failed (falling back to console OTP): {}", ex.getMessage());
            }
        }

        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(toEmail);
                message.setSubject("Your NearBuzz Login Code: " + otp);
                message.setText(buildPlainTextBody(otp));
                mailSender.send(message);
                log.info("Successfully dispatched SMTP email OTP to {}", toEmail);
                return;
            } catch (Exception ex) {
                log.warn("Could not dispatch SMTP email (falling back to console OTP): {}", ex.getMessage());
            }
        }

        log.info("=================================================");
        log.info("🔐 [NearBuzz DEV] OTP for {}: {}", toEmail, otp);
        log.info("=================================================");
    }

    private boolean isBrevoConfigured() {
        return brevoApiKey != null && !brevoApiKey.isBlank()
                && senderEmail != null && !senderEmail.isBlank();
    }

    private void sendViaBrevo(String toEmail, String otp) {
        Map<String, Object> payload = Map.of(
                "sender", Map.of("name", senderName, "email", senderEmail.trim()),
                "to", List.of(Map.of("email", toEmail)),
                "subject", "Your NearBuzz Verification Code: " + otp,
                "textContent", buildPlainTextBody(otp),
                "htmlContent", buildHtmlBody(otp)
        );

        restClient.post()
                .uri(BREVO_API_URL)
                .header("api-key", brevoApiKey.trim())
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .toBodilessEntity();
    }

    private String buildPlainTextBody(String otp) {
        return "Hello,\n\n"
                + "Your one-time verification code for NearBuzz is: " + otp + "\n\n"
                + "This code will expire in 5 minutes.\n"
                + "If you did not request this code, please ignore this email.\n\n"
                + "— The NearBuzz Team";
    }

    private String buildHtmlBody(String otp) {
        return "<div style=\"font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;\">"
                + "<h2 style=\"color:#4f46e5;margin-top:0;\">NearBuzz Verification Code</h2>"
                + "<p style=\"color:#374151;font-size:15px;\">Use the one-time code below to sign in to NearBuzz:</p>"
                + "<div style=\"font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center;background:#eef2ff;color:#312e81;padding:16px;border-radius:8px;margin:20px 0;\">"
                + otp
                + "</div>"
                + "<p style=\"color:#6b7280;font-size:13px;\">This code expires in 5 minutes. If you didn't request it, you can safely ignore this email.</p>"
                + "</div>";
    }
}
