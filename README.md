# FinSight

FinSight is a university capstone foundation for a personal finance intelligence platform. Supabase email authentication and JWT validation are implemented; financial business features are planned. Financial accounts are virtual records; FinSight does not connect to real banks or ask for banking credentials.

## Stack and layout

| Area | Technology | Directory |
| --- | --- | --- |
| API | Java 17, Spring Boot 3.5, Maven | `backend/` |
| Web | React, Vite, TypeScript | `frontend/web/` |
| Android | React Native, Expo SDK 53, TypeScript | `frontend/mobile/` |
| Hosted data, auth, files | Supabase PostgreSQL, Auth, Storage | PostgreSQL profile and email Auth integrated; Storage pending |
| Containers | Docker Compose | `compose.yaml`, `backend/Dockerfile` |
| CI preparation | Jenkins Pipeline | `Jenkinsfile` |

`docs/` holds [backend package conventions](docs/architecture.md), the API contract, and the [dependency security review](docs/dependency-security.md). `infrastructure/docker/` documents container scope.

## Prerequisites

- JDK 17 with `JAVA_HOME` set to the JDK 17 directory.
- Git, Node.js and npm, Docker Desktop for container use.
- For Android: Android Studio, SDK Platform 35, Platform Tools (`adb`), an Android 15 emulator, and `ANDROID_HOME` pointing to the SDK directory. Keep the emulator on the Windows host.
- Maven is downloaded automatically by `backend/mvnw.cmd`; a global Maven installation is not required.

The project uses Expo SDK 53 because its native Android build uses SDK 35. SDK 53 requires a matching Expo Go build on the emulator. If Expo reports a version mismatch, install the SDK 53 Android Expo Go build from [Expo Go downloads](https://expo.dev/go). For later native Android builds, verify `JAVA_HOME` still points to JDK 17.

## Backend on Windows

```powershell
cd backend
./mvnw.cmd test
./mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
```

Open `http://localhost:8080/api/health`. The local profile uses in-memory H2 and needs no Supabase credentials. Tests use a separate H2 test profile. The API is otherwise protected. In the `supabase` profile, Spring Security validates Supabase user JWTs as an OAuth2 resource server and exposes safe identity fields at `GET /api/auth/me`. The shared API and error contract is in [docs/api.md](docs/api.md).

For a configured Supabase environment, activate the `supabase` profile and set `DB_URL` to the **Session Pooler** PostgreSQL JDBC URL, plus `DB_USERNAME`, `DB_PASSWORD`, `SUPABASE_JWT_ISSUER_URI`, and `SUPABASE_JWT_JWK_SET_URI`. Obtain values from your own Supabase project; the JDBC URL should use `jdbc:postgresql://` and SSL as required by its connection details. Use an asymmetric Supabase Auth signing key with a JWKS endpoint; legacy symmetric JWT secrets are not configured here. The issuer is `https://<project-ref>.supabase.co/auth/v1` and the JWKS URL appends `/.well-known/jwks.json`. The `local` profile is the default when no profile is selected. The `supabase` profile uses the PostgreSQL driver and `ddl-auto=validate`, so startup checks the schema without creating tables. Never put a service-role key in either client or commit credentials.

With those variables set in the process environment, run `./mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=supabase` from `backend`, then request `http://localhost:8080/actuator/health`. An `UP` response confirms the running application's datasource health check. Running the backend directly does not load the root `.env` file.

## Web

```powershell
cd frontend/web
Copy-Item .env.example .env
npm ci
npm run dev
```

Set `VITE_SUPABASE_URL` to the project URL and `VITE_SUPABASE_PUBLISHABLE_KEY` to its publishable key in the untracked web `.env`. Open the Vite URL, usually `http://localhost:5173`. Registration collects full name, email, and password, calls Supabase Auth directly, and handles email confirmation or an immediate session. The app then checks the bearer token against `/api/auth/me`. The shared registration contract and required Supabase dashboard settings are in [docs/api.md](docs/api.md). `VITE_API_BASE_URL` defaults to `http://localhost:8080`. Run `npm run build` to type-check and bundle the app. Vite public variables are visible to browser users, so they must contain no secrets.

## Android emulator and mobile app

Start the existing `FinSight_API_35` AVD from Android Studio Device Manager or on Windows:

```powershell
emulator -avd FinSight_API_35
adb devices
cd frontend/mobile
Copy-Item .env.example .env
npm ci
npm run android
```

Set `EXPO_PUBLIC_SUPABASE_URL` to the project URL and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to its publishable key in the untracked mobile `.env`. `npm run android` starts Expo on port 8082 and opens Expo Go on the running emulator. The `start`, `ios`, and `web` mobile scripts also use port 8082. Jenkins keeps host port 8081; Spring Boot uses 8080. The first launch may install a compatible Expo Go build. If it installs a newer incompatible build, use the SDK 53 build linked above. `EXPO_PUBLIC_API_URL` defaults to `http://10.0.2.2:8080` on Android, which reaches the Windows host from the emulator. `localhost` inside the emulator refers to the emulator itself. For a physical phone, set the variable to your computer's reachable LAN address. Expo public variables are bundled into the app and must contain no secrets. Mobile uses the same full-name registration flow and safe messages as web, persists the session, and checks the bearer token against `/api/auth/me`. Confirmation links open the shared web URL; mobile users can then return to the app and sign in.

Mobile TypeScript check: `npx tsc --noEmit` from `frontend/mobile`. Android native builds, if needed later, use `npx expo run:android` on the Windows host with JDK 17 and SDK 35. Docker does not run the emulator.

## Docker Compose

From the repository root:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

The default `local` profile uses H2 inside the backend container. No database container or persistent volume is created. The backend uses host port 8080 and does not touch the existing Jenkins container on 8081. To use hosted Supabase, set `SPRING_PROFILES_ACTIVE=supabase` and populate the database and JWT variables in your untracked root `.env`. Stop only this Compose project with `docker compose down` when done.

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | Backend/Compose | `local` for H2 or `supabase` for PostgreSQL; no selection defaults to `local` |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Backend | Supabase PostgreSQL JDBC connection |
| `SUPABASE_JWT_ISSUER_URI`, `SUPABASE_JWT_JWK_SET_URI` | Backend | Supabase Auth JWT validation |
| `FINSIGHT_ALLOWED_ORIGINS` | Backend | Comma-separated browser origins; defaults to Vite localhost and Android emulator backend origin |
| `VITE_API_BASE_URL` | Web | Defaults to `http://localhost:8080` |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Web | Public Supabase Auth project URL and publishable key |
| `EXPO_PUBLIC_API_URL` | Mobile | Defaults to `http://10.0.2.2:8080` on Android |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Mobile | Public Supabase Auth project URL and publishable key |

Copy the relevant `.env.example` to an untracked `.env` in each app directory. The root `.env` is read by Docker Compose. Running the backend directly uses process environment variables; no dotenv loader is installed.

## Jenkins

The pipeline uses the Windows agent labeled `finsight-java17-docker` and the Jenkins `jdk17` tool for FinSight builds. It checks out the private repository, builds and tests the backend, builds the web client, and builds a Docker image. Jenkins and its agent may run on Java 21, but application builds use Java 17. Jenkins listens on host port 8081 and does not share the Spring Boot port.
