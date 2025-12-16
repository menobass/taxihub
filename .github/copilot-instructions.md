# TaxiHub - Hive Blockchain Community Management Portal

This is a Node.js/Express application for managing Hive blockchain communities, specifically designed for taxi hub administration.

## Project Overview

- **Purpose**: Admin portal for managing taxi driver communities on Hive blockchain
- **Stack**: Node.js, Express, dhive, JWT authentication
- **Architecture**: Backend API + Frontend admin dashboard
- **Authentication**: Hive Keychain integration

## Development Guidelines

- Use dhive library for all Hive blockchain operations
- Store sensitive keys in environment variables
- Implement proper error handling for blockchain operations
- Cache community data to reduce RPC calls
- Follow RESTful API patterns for all endpoints

## Key Files

- `src/services/hive.service.js` - Core Hive blockchain operations
- `src/controllers/community.controller.js` - Community management endpoints
- `src/middleware/auth.middleware.js` - JWT and Hive authentication
- `HIVE_OPERATIONS.md` - Reference guide for all Hive operations
