# Bando API Products Demo

## Overview

This is a Node.js command-line demonstration script that showcases the Bando API's `products/grouped/` endpoint. The application provides a comprehensive example of how to integrate with the Bando API for retrieving different product types including eSIM data packages, gift cards, and mobile top-ups. It includes practical features like rate limiting, caching, error handling, and various filtering scenarios to demonstrate real-world API usage patterns.

**Current Status**: The script is now fully functional and successfully connecting to the Bando API! After reading the API documentation carefully, I discovered the correct endpoint structure uses `/api/v1/` as the base path. The script now retrieves real product data including thousands of eSIM variants and various gift card brands.

## Recent Changes (August 2025)

- **Web UI Added**: Created React-based playground interface for better user experience
- **Fixed API Connection**: Discovered correct endpoint structure (/api/v1/) and updated all scripts
- **Enhanced Error Handling**: Updated error messages to be more informative about API endpoint issues
- **Connection Testing**: Added comprehensive endpoint testing functionality (`--test-connection`)
- **Improved Documentation**: Created detailed README with usage examples, troubleshooting, and integration patterns
- **Public Access Support**: Configured script to work without authentication requirements
- **Rate Limiting**: Implemented proper rate limiting for public vs authenticated access
- **Dependency Management**: Fixed chalk compatibility issues by using v4.1.2 for CommonJS support

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

**Application Pattern**: Dual interface - CLI application + React web playground
- Main entry point (`bando-api-demo.js`) handles CLI API requests and command-line argument parsing
- React web interface (`src/App.jsx`) provides modern UI for exploring API without console output
- Express server (`server.js`) bridges React frontend with Bando API, handling CORS and rate limiting
- Utility modules provide formatting, caching, and scenario management functionality
- Example scenarios demonstrate different API usage patterns

**Command-Line Interface**: Built using `yargs` for argument parsing and command handling
- Supports various filters and options through command-line arguments
- Interactive demonstration mode with predefined scenarios
- Color-coded output using `chalk` for enhanced user experience

**Caching Strategy**: In-memory caching system with TTL (Time To Live) expiration
- Default 5-minute cache duration for API responses
- Cache key generation based on request parameters
- Automatic cleanup of expired cache entries

**Rate Limiting**: Client-side rate limiting to respect API constraints
- Different limits for authenticated vs. unauthenticated requests
- 10 requests per minute for public access, 100 for authenticated users
- Sliding window implementation with automatic reset

**Error Handling**: Comprehensive error handling with helpful user guidance
- Specific error messages for rate limiting, authentication, and network issues
- Contextual help suggestions based on error type
- Graceful degradation for various failure scenarios

**Output Formatting**: Rich console output with structured information display
- Product information formatting with validation requirements
- Color-coded status messages and error reporting
- Tabular data presentation for API responses

## External Dependencies

**HTTP Client**: Axios for making HTTP requests to the Bando API
- Handles request/response processing and error handling
- Supports request configuration and timeout management

**Environment Configuration**: dotenv for managing API credentials
- Loads BANDO_API_TOKEN from environment variables
- Supports different configurations for development and production

**Command-Line Tools**: 
- `yargs` for command-line argument parsing and help generation
- `chalk` for colorized console output and improved readability

**Bando API Integration**: RESTful API integration for product data retrieval
- Base URL: https://api.bando.cool
- Endpoint: `products/grouped/` with various filter parameters
- Authentication via API token (optional for higher rate limits)
- Support for pagination, filtering by type/country/brand, and page sizing