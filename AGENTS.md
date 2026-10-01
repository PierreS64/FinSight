# FinSight development rules

- Use Java 17 for backend and Android builds, including CI build agents.
- Never commit credentials, access tokens, Supabase service-role keys, or populated `.env` files.
- Keep one modular Spring Boot backend. Organize new code by domain, with clear API, service, and persistence boundaries as needed.
- Financial accounts are virtual user records. Do not connect directly to banks or banking APIs or request bank credentials.
- Add meaningful automated tests for new backend business logic.
- Keep web and mobile clients aligned to the same documented API contract.
- Add dependencies only when a concrete feature needs them.
- Preserve existing Jenkins, Docker, Android SDK, and emulator configurations.
- Use environment variables for deployment settings. Public client variables must never contain secrets.
