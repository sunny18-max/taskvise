# ----------------------------
# Stage 1: Build Frontend
# ----------------------------
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build frontend (Vite output will be in dist/)
RUN npm run build


# ----------------------------
# Stage 2: Run Backend + Serve Frontend
# ----------------------------
FROM node:18

# Set working directory
WORKDIR /app

# Copy only package files again for clean install
COPY package*.json ./

RUN npm install --production

# Copy backend server file
COPY server.js ./

# Copy build output from stage 1
COPY --from=build /app/dist ./dist

# Expose app port (change if different in .env)
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
