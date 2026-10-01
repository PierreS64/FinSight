# Docker infrastructure

The root `compose.yaml` currently runs only the FinSight backend. The local profile uses an in-memory H2 database. Supabase PostgreSQL remains external for configured environments. The existing Jenkins container is managed separately and is not part of this Compose project.
