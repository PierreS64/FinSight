# Architecture foundation

FinSight is a single Spring Boot API with separate React web and Expo mobile clients. `FinSightApplication` stays in the root `com.finsight` package so Spring can scan the modules below it.

Current backend packages follow features and responsibilities:

| Package | Current role |
| --- | --- |
| `com.finsight.auth.controller`, `com.finsight.auth.dto` | Auth API and its safe user response |
| `com.finsight.common.controller` | Public health API |
| `com.finsight.common.security` | Shared Spring Security and CORS configuration |
| `com.finsight.common.exception` | Shared API exception responses |
| `com.finsight.integration.supabase` | Supabase-specific user token validation |

Add `user`, `account`, `category`, `transaction`, `budget`, `goal`, and `insight` packages when those features exist. Create `controller`, `service`, `repository`, `entity`, or `dto` subpackages only when a feature needs them. Keep external OCR and AI integrations under `integration` when implemented.

Both clients use the same `/api` contract in [api.md](api.md). Supabase Auth handles email sign-in, sign-up, refresh, and sign-out in each client. Clients send the access token as a Bearer token to Spring Boot. The `supabase` profile validates the JWT signature against the project's JWKS, checks issuer and expiry, and requires an authenticated, non-anonymous Supabase user session. The local and test profiles use H2 and do not require Supabase credentials; protected routes remain inaccessible without authentication.

Financial accounts are manually maintained virtual records. No direct bank connections or banking credentials are in scope.
