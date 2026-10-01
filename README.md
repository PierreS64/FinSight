# FinSight

FinSight is a university capstone foundation for a personal finance intelligence platform. The planned web and Android apps will support manually entered financial data, receipt OCR, statement imports, and recurring transactions. Financial accounts are virtual records; FinSight does not connect to real banks or ask for banking credentials. Business features are not implemented yet.

## Stack and layout

| Area | Technology | Directory |
| --- | --- | --- |
| API | Java 17, Spring Boot 3.5, Maven | `backend/` |
| Web | React, Vite, TypeScript | `frontend/web/` |
| Android | React Native, Expo SDK 53, TypeScript | `frontend/mobile/` |
| Hosted data, auth, files | Supabase PostgreSQL, Auth, Storage | External service; integration pending |
| Containers | Docker Compose | `compose.yaml`, `backend/Dockerfile` |
| CI preparation | Jenkins Pipeline | `Jenkinsfile` |

`docs/` holds architecture notes and the [dependency security review](docs/dependency-security.md). `infrastructure/docker/` documents container scope. Jira and Jenkins integration can be connected when the group is ready; no Jenkins integration is configured by this foundation.

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

Open `http://localhost:8080/api/health`. The local profile uses in-memory H2 and needs no Supabase credentials. Tests use a separate H2 test profile. The API is otherwise protected. Local/test are for foundation checks only; Supabase JWT validation is active in the default profile.

For a configured Supabase environment, set `SUPABASE_DB_URL` to the PostgreSQL JDBC URL, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD`, `SUPABASE_JWT_ISSUER_URI`, and `SUPABASE_JWT_JWK_SET_URI`. Obtain values from your own Supabase project. Use an asymmetric Supabase Auth signing key with a JWKS endpoint; legacy symmetric JWT secrets are not configured here. The default profile validates the schema and does not create tables. Never put a service-role key in either client or commit credentials.

## Web

```powershell
cd frontend/web
Copy-Item .env.example .env
npm ci
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`. `VITE_API_BASE_URL` defaults to `http://localhost:8080`. Run `npm run build` to type-check and bundle the app. Vite public variables are visible to browser users, so they must contain no secrets.

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

`npm run android` starts Expo on port 8082 and opens Expo Go on the running emulator. The `start`, `ios`, and `web` mobile scripts also use port 8082. Jenkins keeps host port 8081; Spring Boot uses 8080. The first launch may install a compatible Expo Go build. If it installs a newer incompatible build, use the SDK 53 build linked above. `EXPO_PUBLIC_API_URL` defaults to `http://10.0.2.2:8080` on Android, which reaches the Windows host from the emulator. `localhost` inside the emulator refers to the emulator itself. For a physical phone, set the variable to your computer's reachable LAN address. Expo public variables are bundled into the app and must contain no secrets. In development, the placeholder screen requests `GET /api/health` and shows `Connected` or `Connection Failed` without displaying the URL or error details.

Mobile TypeScript check: `npx tsc --noEmit` from `frontend/mobile`. Android native builds, if needed later, use `npx expo run:android` on the Windows host with JDK 17 and SDK 35. Docker does not run the emulator.

## Docker Compose

From the repository root:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

The default `local` profile uses H2 inside the backend container. No database container or persistent volume is created. The backend uses host port 8080 and does not touch the existing Jenkins container on 8081. To use hosted Supabase, set `SPRING_PROFILES_ACTIVE` to a non-local profile and populate the Supabase variables in your untracked root `.env`. Stop only this Compose project with `docker compose down` when done.

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | Backend/Compose | `local` for H2; default backend profile for configured Supabase |
| `SUPABASE_DB_URL`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD` | Backend | PostgreSQL JDBC connection |
| `SUPABASE_JWT_ISSUER_URI`, `SUPABASE_JWT_JWK_SET_URI` | Backend | Supabase Auth JWT validation |
| `FINSIGHT_ALLOWED_ORIGINS` | Backend | Comma-separated browser origins; defaults to Vite localhost |
| `VITE_API_BASE_URL` | Web | Defaults to `http://localhost:8080` |
| `EXPO_PUBLIC_API_URL` | Mobile | Defaults to `http://10.0.2.2:8080` on Android |

Copy the relevant `.env.example` to an untracked `.env` in each app directory. The root `.env` is read by Docker Compose. Running the backend directly uses process environment variables; no dotenv loader is installed.

## Future Jenkins integration

`Jenkinsfile` is prepared but is not connected to the existing `FinSight-CI` job. It requires a separate Linux agent labeled `finsight-java17-docker` with JDK 17 and Git. The backend stages use the Maven Wrapper. The future Docker build stage is disabled until an agent has Docker CLI and daemon access and the team enables it. Jenkins controller JDK 21 must not be used for application builds. Configure the GitHub source and agent separately after publication.
