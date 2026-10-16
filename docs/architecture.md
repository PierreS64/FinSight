# Architecture foundation

FinSight is a single Spring Boot API with separate React web and Expo mobile clients. `FinSightApplication` stays in the root `com.finsight` package so Spring can scan the modules below it.

Current backend packages follow features and responsibilities:

| Package | Current role |
| --- | --- |
| `com.finsight.auth.controller`, `com.finsight.auth.dto` | Auth API and its safe user response |
| `com.finsight.health` | Public health API |
| `com.finsight.common.security` | Shared Spring Security and CORS configuration |
| `com.finsight.common.exception` | Shared API exception responses |
| `com.finsight.integration.supabase` | Supabase-specific user token validation |

Add `user`, `account`, `category`, `transaction`, `budget`, `goal`, and `insight` packages when those features exist. Create `controller`, `service`, `repository`, `entity`, or `dto` subpackages only when a feature needs them. Keep external OCR and AI integrations under `integration` when implemented.

Both clients use the same `/api` contract in [api.md](api.md). Supabase Auth handles email sign-in, sign-up, refresh, and sign-out in each client. Clients send the access token as a Bearer token to Spring Boot. The `supabase` profile validates the JWT signature against the project's JWKS, checks issuer and expiry, and requires an authenticated, non-anonymous Supabase user session. The local and test profiles use H2 and do not require Supabase credentials; protected routes remain inaccessible without authentication.

Registration collects full name, email, and password in each client. The clients call Supabase Auth directly and send the full name as user metadata. Supabase owns email identities, password policy, confirmation mail, and password storage. Spring Boot has no registration endpoint and never receives the registration password. A pending sign-up response is not proof that an account was created because Supabase may obscure duplicate addresses. After confirmation, the existing JWT-protected API supplies the trusted user ID and email. User-editable `full_name` metadata is for display only and must not control authorization or financial record ownership.

Financial accounts are manually maintained virtual records. No direct bank connections or banking credentials are in scope.
