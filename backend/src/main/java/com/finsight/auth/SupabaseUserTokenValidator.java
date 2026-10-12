package com.finsight.auth;

import java.util.UUID;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

/** Accept only signed Supabase Auth sessions belonging to a real user. */
public final class SupabaseUserTokenValidator implements OAuth2TokenValidator<Jwt> {
    private static final OAuth2TokenValidatorResult INVALID = OAuth2TokenValidatorResult.failure(
        new OAuth2Error("invalid_token", "A Supabase authenticated user session is required", null));

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        if (jwt.getAudience() == null || !jwt.getAudience().contains("authenticated")
            || !"authenticated".equals(jwt.getClaimAsString("role"))
            || !Boolean.FALSE.equals(jwt.getClaim("is_anonymous"))
            || !isUuid(jwt.getSubject())
            || !isUuid(jwt.getClaimAsString("session_id"))) {
            return INVALID;
        }
        return OAuth2TokenValidatorResult.success();
    }

    private boolean isUuid(String value) {
        if (value == null) return false;
        try {
            return UUID.fromString(value).toString().equals(value);
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }
}
