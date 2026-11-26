package com.studentseva.auth;

import com.studentseva.users.User;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private static final String TEST_SECRET =
            "unit_test_secret_key_for_nearbuzz_jwt_verification_must_be_long_enough_2026";

    private User buildUser(String email, User.Role role) {
        User user = new User();
        user.setEmail(email);
        user.setName("Test User");
        user.setRole(role);
        user.setStatus(User.Status.ACTIVE);
        return user;
    }

    @Test
    void generatesAndValidatesClaimsForMatchingUser() {
        JwtService jwtService = new JwtService(TEST_SECRET, 86_400_000L, "nearbuzz_token");
        UUID uid = UUID.randomUUID();
        User user = buildUser("student@college.edu", User.Role.STUDENT);
        user.setId(uid);

        String token = jwtService.generateToken(user.getEmail(), "STUDENT", uid);

        assertEquals("student@college.edu", jwtService.extractEmail(token));
        assertEquals("STUDENT", jwtService.extractRole(token));
        assertEquals(uid, jwtService.extractUserId(token));
        assertEquals("nearbuzz_token", jwtService.getCookieName());
        assertTrue(jwtService.isTokenValid(token, user));
    }

    @Test
    void rejectsTokenForDifferentUser() {
        JwtService jwtService = new JwtService(TEST_SECRET, 86_400_000L, "nearbuzz_token");
        User otherUser = buildUser("other@college.edu", User.Role.STUDENT);

        String token = jwtService.generateToken("student@college.edu", "STUDENT", UUID.randomUUID());

        assertFalse(jwtService.isTokenValid(token, otherUser));
    }

    @Test
    void rejectsTamperedTokenSignature() {
        JwtService jwtService = new JwtService(TEST_SECRET, 86_400_000L, "nearbuzz_token");
        User user = buildUser("student@college.edu", User.Role.STUDENT);

        String token = jwtService.generateToken(user.getEmail(), "STUDENT", UUID.randomUUID());
        // Flip a middle character of the signature (the final char can have unused base64url padding bits)
        int sigIdx = token.length() - 6;
        char targetChar = token.charAt(sigIdx);
        String tampered = token.substring(0, sigIdx) + (targetChar == 'a' ? 'b' : 'a') + token.substring(sigIdx + 1);

        assertFalse(jwtService.isTokenValid(tampered, user));
    }

    @Test
    void rejectsExpiredToken() {
        JwtService expiredJwtService = new JwtService(TEST_SECRET, -5_000L, "nearbuzz_token");
        User user = buildUser("student@college.edu", User.Role.STUDENT);

        String expiredToken = expiredJwtService.generateToken(user.getEmail(), "STUDENT", UUID.randomUUID());

        assertFalse(expiredJwtService.isTokenValid(expiredToken, user));
    }
}
