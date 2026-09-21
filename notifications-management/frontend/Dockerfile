# Build stage
FROM node:20-alpine AS builder

ARG VITE_API_URL=http://127.0.0.1:8000/api/notifications
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

WORKDIR /workspace/notifications-management/frontend

COPY notifications-management/frontend/package*.json ./
COPY shared-ui /workspace/shared-ui

RUN npm ci && npm install --no-save @rollup/rollup-linux-x64-musl

COPY notifications-management/frontend ./

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /workspace/notifications-management/frontend/dist /usr/share/nginx/html
COPY notifications-management/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]