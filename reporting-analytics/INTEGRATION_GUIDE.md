# Reporting & Analytics Service - Integration Guide

## Service Overview
This microservice provides productivity analytics and reporting
for the TaskMaster application.

**Port:** 5000  
**Base URL:** http://localhost:5000  
**API Gateway Route:** /api/reports, /api/analytics, /api/sync

---

## How to Connect This Service

### Step 1 - Environment Variables
Add these to your .env or docker-compose.yml:

REPORTING_SERVICE_URL=http://reporting-analytics:5000

### Step 2 - API Gateway Configuration
Add these proxy routes to api-gateway proxyConfig.js:

'/api/analytics': 'http://reporting-analytics:5000',
'/api/reports': 'http://reporting-analytics:5000',
'/api/sync': 'http://reporting-analytics:5000',

---

## Available API Endpoints

### Analytics
GET /api/analytics/summary?period=week
GET /api/analytics/summary?period=month
GET /api/analytics/weekly
GET /api/analytics/status
GET /api/analytics/users

### Reports
GET /api/reports
GET /api/reports/:id
POST /api/reports/generate
DELETE /api/reports/:id

### Sync
POST /api/sync/tasks

### Health
GET /health

---

## Integration with Task Management Service

### Current Mode (Mock)
TASK_SERVICE_URL=mock

### Production Mode (Real Integration)
TASK_SERVICE_URL=http://api-gateway:3000/api/tasks

When changed to production mode, the service will
automatically fetch real tasks from Task Management Service
and calculate real productivity metrics.

NO CODE CHANGES NEEDED - only ENV variable change!

---

## Integration with User Management Service

### JWT Token Format Expected
{
  "userId": "user123",
  "userName": "John Doe", 
  "role": "user",
  "email": "john@example.com"
}

### How to Send Requests
All requests must include JWT token in header:
Authorization: Bearer <jwt_token>

The service will automatically use the userId from the token
to filter user-specific analytics.

---

## Docker Integration

### docker-compose.yml addition:
  reporting-analytics:
    build: ./reporting-analytics
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
      - TASK_SERVICE_URL=http://task-management:5002
      - USER_SERVICE_URL=http://user-management:5001
    depends_on:
      - mongodb
    networks:
      - taskmaster-network

---

## What This Service Does

1. SYNCS tasks from Task Management Service every 5 minutes
2. CALCULATES productivity metrics (completed/total * 100)
3. SHOWS weekly chart (tasks completed per day Mon-Sun)
4. SHOWS status breakdown (done/inProgress/todo percentages)
5. GENERATES PDF reports with analytics data
6. SUPPORTS period filtering (week/month/custom date range)

---

## Testing the Integration

After connecting, test with:
curl http://localhost:5000/health
curl http://localhost:5000/api/analytics/summary?period=week
curl -X POST http://localhost:5000/api/sync/tasks

---

## Contact
Service developed by: [Your Name]
Branch: feature/reporting-analytics
