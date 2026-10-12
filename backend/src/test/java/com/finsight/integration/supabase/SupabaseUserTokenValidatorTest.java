package com.finsight.integration.supabase;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

class SupabaseUserTokenValidatorTest {
    private static final String USER_ID = "123e4567-e89b-12d3-a456-426614174000";
    private static final String SESSION_ID = "123e4567-e89b-12d3-a456-426614174001";
    private final SupabaseUserTokenValidator validator = new SupabaseUserTokenValidator();

    @Test
    void acceptsAuthenticatedUserSession() {
        assertThat(validator.validate(token(Map.of())).hasErrors()).isFalse();
    }

    @Test
    void rejectsAnonAndServiceTokensAndMissingIdentity() {
        assertThat(validator.validate(token(Map.of("aud", "anon"))).hasErrors()).isTrue();
        assertThat(validator.validate(token(Map.of("role", "service_role"))).hasErrors()).isTrue();
        assertThat(validator.validate(token(Map.of("is_anonymous", true))).hasErrors()).isTrue();
        assertThat(validator.validate(token(Map.of("sub", "not-a-user-id"))).hasErrors()).isTrue();
        assertThat(validator.validate(token(Map.of("session_id", "not-a-session-id"))).hasErrors()).isTrue();
    }

    private Jwt token(Map<String, Object> overrides) {
        Map<String, Object> claims = new java.util.HashMap<>(Map.of(
            "aud", "authenticated", "role", "authenticated", "is_anonymous", false,
            "sub", USER_ID, "session_id", SESSION_ID));
        claims.putAll(overrides);
        return new Jwt("test-token", Instant.now(), Instant.now().plusSeconds(300),
            Map.of("alg", "RS256"), claims);
    }
}
