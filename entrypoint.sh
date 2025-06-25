#!/bin/sh
# This script is the container's entrypoint. It's responsible for injecting
# runtime environment variables into the static JavaScript files before starting the web server.

set -e # Exit immediately if a command exits with a non-zero status.

# The root directory where Nginx serves files from.
WEB_ROOT="/usr/share/nginx/html"

echo "Starting environment substitution..."

# Loop through all .js files in the web root and its subdirectories.
# The `find` command is more robust than a simple glob, especially if there are no .js files.
find "$WEB_ROOT" -type f -name "*.js" -print0 | while IFS= read -r -d $'\0' file; do
  echo "Processing $file for environment variable substitution..."
  # Use sed to replace the placeholder strings with actual environment variables passed to the container.
  # The `|` is used as a delimiter to avoid issues with URLs containing slashes.
  sed -i "s|DTC_APP_SUPABASE_URL|${VITE_SUPABASE_URL}|g" "$file"
  sed -i "s|DTC_APP_SUPABASE_KEY|${VITE_SUPABASE_ANON_KEY}|g" "$file"
done

echo "Substitution complete. Starting Nginx..."

# `exec "$@"` runs the command passed to the script. In the Dockerfile, this is `nginx -g 'daemon off;'`.
# `exec` replaces the shell process with the new process, which is good practice for entrypoints.
exec "$@" 