# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy project files
COPY . .

# Install dependencies without frozen-lockfile
RUN pnpm install --no-frozen-lockfile

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "run", "start"]
