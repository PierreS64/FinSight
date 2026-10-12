# Architecture foundation

FinSight is a single Spring Boot API with separate React web and Expo mobile clients. Add future backend code under `com.finsight` in domain packages such as `accounts`, `transactions`, and `budgets` as those features are implemented. Keep shared technical configuration under `config`.

Both clients use the same `/api` contract in [api.md](api.md). Supabase Auth handles email sign-in, sign-up, refresh, and sign-out in each client. Clients send the access token as a Bearer token to Spring Boot. The `supabase` profile validates the JWT signature against the project's JWKS, checks issuer and expiry, and requires an authenticated, non-anonymous Supabase user session. The local and test profiles use H2 and do not require Supabase credentials; protected routes remain inaccessible without authentication.

Financial accounts are manually maintained virtual records. No direct bank connections or banking credentials are in scope.
