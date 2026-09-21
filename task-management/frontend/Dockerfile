# Build stage
FROM node:20-alpine AS builder

# Build argument for API URL
ARG VITE_API_URL=http://127.0.0.1:8000
ENV VITE_API_URL=$VITE_API_URL

# Accept cross-app links
ARG VITE_USER_APP_URL
ENV VITE_USER_APP_URL=$VITE_USER_APP_URL
ARG VITE_TASK_APP_URL
ENV VITE_TASK_APP_URL=$VITE_TASK_APP_URL
ARG VITE_NOTIFICATIONS_APP_URL
ENV VITE_NOTIFICATIONS_APP_URL=$VITE_NOTIFICATIONS_APP_URL
ARG VITE_REPORTING_APP_URL
ENV VITE_REPORTING_APP_URL=$VITE_REPORTING_APP_URL

WORKDIR /workspace/task-management/frontend

# Copy package files
COPY task-management/frontend/package*.json ./
COPY shared-ui /workspace/shared-ui

# Install dependencies (need ALL deps including dev dependencies for build)
RUN npm ci

# Copy source code
COPY task-management/frontend ./

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /workspace/task-management/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY task-management/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
