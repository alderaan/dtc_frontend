# ======================================================================================
# STAGE 1: Build the React Application
# ======================================================================================
# Use an official Node.js image. The 'alpine' version is lightweight.
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# It's better to copy only package.json and lock file first to leverage Docker cache
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Use simple, unique placeholders for runtime substitution.
# Vite will wrap these in quotes in the final JS bundle, e.g. "DTC_APP_SUPABASE_URL".
# The entrypoint script will replace the text *inside* the quotes.
RUN VITE_SUPABASE_URL="DTC_APP_SUPABASE_URL" \
    VITE_SUPABASE_ANON_KEY="DTC_APP_SUPABASE_KEY" \
    npm run build


# ======================================================================================
# STAGE 2: Serve the Application with Nginx
# ======================================================================================
# Use a lightweight Nginx image for the final production image.
FROM nginx:1.23.3-alpine

# Copy the built application from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom nginx config for SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the entrypoint script that will substitute environment variables
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose port 80 for Nginx
EXPOSE 80

# When the container starts, it will first run our script and then start Nginx.
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
