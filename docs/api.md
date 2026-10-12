# FinSight API contract

The web and Expo clients call the same Spring Boot API. Supabase Auth issues and refreshes user sessions in the clients. The backend never receives a user's password. Protected calls include `Authorization: Bearer <Supabase access token>`.

| Method | Path | Access | Response |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | `{"status":"UP"}` |
| GET | `/api/auth/me` | Supabase user token | `{"id":"<user UUID>","email":"<email or null>"}` |

In the `supabase` profile, `/api/auth/me` returns HTTP 401 for a missing, malformed, expired, or invalidly signed token. Validation requires a trusted RS256 or ES256 signature from the configured JWKS, the configured issuer, a valid time window, audience `authenticated`, role `authenticated`, a UUID `sub` and `session_id`, and `is_anonymous: false`. A valid user token returns HTTP 200 with only the subject ID and email; the response contains no access token, refresh token, or other JWT claims. The `local` and `test` profiles do not validate Supabase tokens; they are used for H2 development and backend tests and keep protected routes inaccessible.

Local CORS defaults to `http://localhost:5173` and `http://10.0.2.2:8080`; deployments can set `FINSIGHT_ALLOWED_ORIGINS` to a comma-separated origin list. The Android emulator reaches the host backend at `http://10.0.2.2:8080`. Native React Native requests do not rely on browser CORS enforcement.

Malformed JSON and request validation failures return HTTP 400 with a safe `{"code":"invalid_request","message":"..."}` body. Unexpected controller errors return HTTP 500 with `{"code":"internal_error","message":"An unexpected error occurred"}`. Security failures return HTTP 401 from Spring Security without passing through the controller error handler.

The backend connects to Supabase PostgreSQL through JDBC. Clients use the Supabase project URL and publishable key only for Auth. They do not receive database credentials or a service-role key.
