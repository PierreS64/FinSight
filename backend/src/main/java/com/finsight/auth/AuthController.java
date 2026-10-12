package com.finsight.auth;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @GetMapping("/me")
    public AuthenticatedUser me(@AuthenticationPrincipal Jwt jwt) {
        return new AuthenticatedUser(jwt.getSubject(), jwt.getClaimAsString("email"));
    }

    public record AuthenticatedUser(String id, String email) {}
}
