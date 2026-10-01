# Architecture foundation

FinSight is a single Spring Boot API with separate React web and Expo mobile clients. Add future backend code under `com.finsight` in domain packages such as `accounts`, `transactions`, and `budgets` as those features are implemented. Keep shared technical configuration under `config`.

Both clients will use the same `/api` contract. The only API route at initialization is public `GET /api/health`. Other routes require authentication. Production JWT validation is configured for Supabase Auth with an issuer URI and JWKS URI supplied by the environment. The local and test profiles use H2 and do not require Supabase credentials; protected routes remain inaccessible without authentication.

Financial accounts are manually maintained virtual records. No direct bank connections or banking credentials are in scope.
