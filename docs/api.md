# FinSight API contract

The web and Expo clients call the same Spring Boot API. Supabase Auth issues and refreshes user sessions in the clients. The backend never receives a user's password. Protected calls include `Authorization: Bearer <Supabase access token>`.

| Method | Path | Access | Response |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | `{"status":"UP"}` |
| GET | `/api/auth/me` | Supabase user token | `{"id":"<user UUID>","email":"<email or null>"}` |

## Registration through Supabase Auth

There is no Spring Boot registration endpoint. Web and mobile call `supabase.auth.signUp` directly with a trimmed email, password, and `options.data.full_name` (trimmed, 1–100 characters). Both clients require a valid-looking email of at most 254 characters and a password of at least 8 characters before calling Supabase. Supabase Auth applies the project's authoritative email and password rules, owns email identity uniqueness, and stores password hashes. The clients never send a registration password to `/api` or store it in FinSight tables.

The client-facing registration outcome is:

| Supabase sign-up result | Client behavior |
| --- | --- |
| `session` is present | Show the signed-in state; the client may call `GET /api/auth/me` with the access token. |
| `user` is present but `session` is null | Show a generic pending-confirmation message. Do not treat the returned user ID as proof of a newly created account. |
| Duplicate-email error | Show the same generic pending message, without confirming whether the email already exists. |
| Validation, weak-password, or rate-limit error | Show a safe field or retry message without echoing Supabase's raw error text. |
| Service failure or unexpected result | Show a generic registration-unavailable message. |

With **Confirm Email** enabled, users confirm through a shared web URL, then may sign in on web or mobile. The web Supabase client accepts a session from the confirmation URL. Mobile does not use deep linking; a user who confirms in a browser can return to the mobile app and sign in. With Confirm Email disabled, Supabase may return a session immediately. Account existence is never inferred from a pending response. `full_name` is user-editable display metadata, not an authorization claim; `/api/auth/me` continues to return only `id` and `email`.

For each Supabase environment, configure the dashboard's email provider to allow sign-ups and **Confirm Email**, set the Auth **Site URL** to that environment's FinSight web URL, and add the web URL to **Redirect URLs**. Use a working SMTP sender for confirmation mail, especially outside development. Set the Supabase minimum password length to at least 8 and align any stronger character or leaked-password policy with client guidance; Supabase remains the final validator. Verify a new account, duplicate address, email delivery, confirmation link, and sign-in on both clients using a test account. Public client configuration needs only the project URL and publishable key; no service-role key belongs in a client.

## Protected Spring API

In the `supabase` profile, `/api/auth/me` returns HTTP 401 for a missing, malformed, expired, or invalidly signed token. Validation requires a trusted RS256 or ES256 signature from the configured JWKS, the configured issuer, a valid time window, audience `authenticated`, role `authenticated`, a UUID `sub` and `session_id`, and `is_anonymous: false`. A valid user token returns HTTP 200 with only the subject ID and email; the response contains no access token, refresh token, or other JWT claims. The `local` and `test` profiles do not validate Supabase tokens; they are used for H2 development and backend tests and keep protected routes inaccessible.

Local CORS defaults to `http://localhost:5173` and `http://10.0.2.2:8080`; deployments can set `FINSIGHT_ALLOWED_ORIGINS` to a comma-separated origin list. The Android emulator reaches the host backend at `http://10.0.2.2:8080`. Native React Native requests do not rely on browser CORS enforcement.

Malformed JSON and request validation failures return HTTP 400 with a safe `{"code":"invalid_request","message":"..."}` body. Unexpected controller errors return HTTP 500 with `{"code":"internal_error","message":"An unexpected error occurred"}`. Security failures return HTTP 401 from Spring Security without passing through the controller error handler.

The backend connects to Supabase PostgreSQL through JDBC. Clients use the Supabase project URL and publishable key only for Auth. They do not receive database credentials or a service-role key.
