# Architecture

## Overview

This is a Recipe-Box application.

## Services

### Frontend
- Framework: React / Next.js
- Deployment: Railway Static Service

### Backend  
- Framework: Node.js / Express
- Deployment: Railway Web Service

### Database
- Type: PostgreSQL
- Deployment: Railway PostgreSQL

## Railway Deployment Architecture

```
GitHub Repository
      |
      v
Railway Project
  ├── Frontend Service (apps/frontend)
  ├── Backend Service (apps/backend)
  ├── Worker Service (apps/worker, if present)
  └── PostgreSQL Database
```
