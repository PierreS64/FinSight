package com.finsight.auth.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.ECDSASigner;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.Curve;
import com.nimbusds.jose.jwk.ECKey;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jose.jwk.gen.ECKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:supabase-security-test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "SUPABASE_JWT_ISSUER_URI=https://example.supabase.co/auth/v1"
})
@AutoConfigureMockMvc
@ActiveProfiles("supabase")
class SupabaseJwtSecurityTest {
    private static final String ISSUER = "https://example.supabase.co/auth/v1";
    private static final String USER_ID = "123e4567-e89b-12d3-a456-426614174000";
    private static final String SESSION_ID = "123e4567-e89b-12d3-a456-426614174001";
    private static final RSAKey KEY = createKey();
    private static final RSAKey FORGED_KEY = createKey();
    private static final ECKey EC_KEY = createEcKey();
    private static final HttpServer JWKS_SERVER = startJwksServer();

    @Autowired
    MockMvc mvc;

    @DynamicPropertySource
    static void jwks(DynamicPropertyRegistry registry) {
        registry.add("SUPABASE_JWT_JWK_SET_URI", () ->
            "http://localhost:" + JWKS_SERVER.getAddress().getPort() + "/jwks");
    }

    @AfterAll
    static void stopServer() {
        JWKS_SERVER.stop(0);
    }

    @Test
    void acceptsSignedSupabaseUserToken() throws Exception {
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token(ISSUER, "authenticated", "authenticated", false, 300)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(USER_ID))
            .andExpect(jsonPath("$.email").value("user@example.com"));
    }

    @Test
    void acceptsEs256SupabaseUserToken() throws Exception {
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + ecToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(USER_ID));
    }

    @Test
    void mockedJwtExposesOnlySafeIdentityFields() throws Exception {
        mvc.perform(get("/api/auth/me").with(jwt().jwt(token -> token
                .subject(USER_ID)
                .claim("email", "user@example.com")
                .claim("secret", "must-not-return"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(USER_ID))
            .andExpect(jsonPath("$.email").value("user@example.com"))
            .andExpect(jsonPath("$.secret").doesNotExist());
    }

    @Test
    void rejectsMissingAndInvalidTokens() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer invalid"))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + forgedToken()))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token(ISSUER, "anon", "authenticated", false, 300)))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token(ISSUER, "authenticated", "service_role", false, 300)))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token(ISSUER, "authenticated", "authenticated", true, 300)))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token("https://other.supabase.co/auth/v1", "authenticated", "authenticated", false, 300)))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token(ISSUER, "authenticated", "authenticated", false, -300)))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void corsAllowsLocalWebAndAndroidEmulatorOrigins() throws Exception {
        for (String origin : List.of("http://localhost:5173", "http://10.0.2.2:8080")) {
            mvc.perform(options("/api/auth/me")
                    .header("Origin", origin)
                    .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", origin));
        }
    }

    private static String token(String issuer, String audience, String role, boolean anonymous, long validForSeconds) throws Exception {
        SignedJWT jwt = new SignedJWT(
            new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(KEY.getKeyID()).build(),
            claims(issuer, audience, role, anonymous, validForSeconds));
        jwt.sign(new RSASSASigner(KEY.toPrivateKey()));
        return jwt.serialize();
    }

    private static String ecToken() throws Exception {
        SignedJWT jwt = new SignedJWT(
            new JWSHeader.Builder(JWSAlgorithm.ES256).keyID(EC_KEY.getKeyID()).build(),
            claims(ISSUER, "authenticated", "authenticated", false, 300));
        jwt.sign(new ECDSASigner(EC_KEY.toECPrivateKey()));
        return jwt.serialize();
    }

    private static String forgedToken() throws Exception {
        SignedJWT jwt = new SignedJWT(
            new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(KEY.getKeyID()).build(),
            claims(ISSUER, "authenticated", "authenticated", false, 300));
        jwt.sign(new RSASSASigner(FORGED_KEY.toPrivateKey()));
        return jwt.serialize();
    }

    private static JWTClaimsSet claims(String issuer, String audience, String role, boolean anonymous, long validForSeconds) {
        return new JWTClaimsSet.Builder()
            .issuer(issuer).audience(audience).subject(USER_ID)
            .issueTime(Date.from(Instant.now().minusSeconds(600)))
            .expirationTime(Date.from(Instant.now().plusSeconds(validForSeconds)))
            .claim("role", role).claim("is_anonymous", anonymous)
            .claim("session_id", SESSION_ID).claim("email", "user@example.com")
            .build();
    }

    private static RSAKey createKey() {
        try {
            return new RSAKeyGenerator(2048).keyID("test-key").generate();
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static ECKey createEcKey() {
        try {
            return new ECKeyGenerator(Curve.P_256).keyID("test-ec-key").generate();
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static HttpServer startJwksServer() {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
            server.createContext("/jwks", exchange -> {
                byte[] body = new JWKSet(List.of(KEY.toPublicJWK(), EC_KEY.toPublicJWK()))
                    .toString().getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, body.length);
                try (var output = exchange.getResponseBody()) {
                    output.write(body);
                }
            });
            server.start();
            return server;
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }
}
