# Use the official Bun image
FROM oven/bun:latest

# Set working directory
WORKDIR /app

# Copy dependency files first for better caching
COPY bun.lock package.json ./

# Install dependencies using the plain-text lockfile
RUN bun install

# Copy the rest of your project
COPY . .

# Expose your app port
EXPOSE 3000

# Start the app
CMD ["bun", "start"]
