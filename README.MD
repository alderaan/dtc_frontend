# DTC Admin Frontend

This project is a Refine.js admin panel for managing DTC (Direct-to-Consumer) profiles. It is built with React, Ant Design, TypeScript, and Vite.

## Prerequisites

- Node.js (version >= 20)
- Docker & Docker Compose

## Local Development

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment:**
    Create a `.env` file in this directory by copying the example below. These variables are required to connect to the Supabase backend.

    ```dotenv
    # .env

    # Public URL of your Supabase project
    VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co

    # Public anonymous key for your Supabase project
    VITE_SUPABASE_ANON_KEY=your-supabase-public-anon-key
    ```

3.  **Run Development Server:**
    The app will be available at `http://localhost:5173`.
    ```bash
    npm run dev
    ```

## Building & Deployment

This application is designed to be deployed as a Docker container. The deployment process uses a multi-stage `Dockerfile` to build the static assets and serve them with Nginx.

An `entrypoint.sh` script handles runtime injection of environment variables, allowing the same Docker image to be used across different environments (staging, production).

**Key Files:**
- `Dockerfile`: Defines the build and production container.
- `entrypoint.sh`: Injects environment variables at container startup.
- `Makefile`: Provides a shortcut for the Docker build command.

### How to Build & Push

The `Makefile` contains a target to build and push the image to a container registry.

1.  **Log in to your registry:**
    ```bash
    docker login your-registry.com
    ```

2.  **Build and Push:**
    This command builds a multi-platform Docker image and pushes it to the registry defined in the `Makefile`.
    ```bash
    make docker-build
    ```

### Server Deployment

On the VPS, the application is managed via `docker-compose`.

1.  **`docker-compose.yml`:** Defines the service, maps ports, and points to the `.env` file for configuration.
2.  **`.env` file (on server):** Contains the production environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

To deploy, pull the new image and restart the service:
```bash
docker-compose pull
docker-compose up -d --force-recreate
```

## Learn More

To learn more about **Refine**, please check out the [Documentation](https://refine.dev/docs)

- **Supabase Data Provider** [Docs](https://refine.dev/docs/core/providers/data-provider/#overview)
- **Material UI** [Docs](https://refine.dev/docs/ui-frameworks/mui/tutorial/)
- **React Router** [Docs](https://refine.dev/docs/core/providers/router-provider/)

## License

MIT
