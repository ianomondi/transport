# Transit Tracker - Mobile Driver Dashboard

## Overview

Transit Tracker is a modern web application designed for transit drivers to manage and monitor their routes, passengers, and performance metrics. The application features a mobile-first design with real-time tracking capabilities, WebSocket communications, and comprehensive analytics.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design tokens
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Real-time Communication**: WebSocket Server (ws library)
- **API Pattern**: RESTful API with real-time WebSocket updates

### Mobile-First Design
- Responsive design optimized for mobile devices
- Touch-friendly interface with material design patterns
- Bottom navigation for easy thumb navigation
- Mobile-specific UI components and interactions

## Key Components

### Core Features
1. **Active Trip Management**: Start, monitor, and end transit trips
2. **Real-time Passenger Tracking**: Board/alight passenger events
3. **GPS Location Services**: Real-time location tracking and route mapping
4. **Destination Queue Management**: Automatic queuing system based on arrival time
5. **Live Analytics**: Performance metrics and statistics
6. **Trip History**: Comprehensive trip logging and review

### Database Schema
- **trips**: Core trip data with status, passenger counts, and route information
- **passengerEvents**: Passenger boarding/alighting events with location data
- **locations**: Named locations with popularity tracking
- **analytics**: Daily performance metrics and hourly data
- **destinationQueues**: Vehicle queue management with arrival times and positions

### WebSocket Features
- Real-time location updates from driver devices
- Live passenger count synchronization
- Trip status broadcasting to connected clients
- Automatic trip completion based on location/time
- Queue position updates and notifications
- Automatic reconnection with exponential backoff

## Data Flow

### Trip Management Flow
1. Driver creates new trip with origin/destination
2. System tracks GPS location and passenger events
3. Real-time updates broadcast via WebSocket
4. Trip completion triggers analytics calculation
5. Historical data stored for reporting

### Real-time Updates
1. Client connects to WebSocket server
2. Location updates sent from driver device
3. Server broadcasts updates to all connected clients
4. Database updated with location and passenger data
5. Analytics refreshed in real-time

## External Dependencies

### Core Libraries
- **Database**: Drizzle ORM with PostgreSQL dialect
- **UI Components**: Radix UI primitives with shadcn/ui
- **Styling**: Tailwind CSS with PostCSS
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns for date manipulation

### Development Tools
- **TypeScript**: Full type safety across client and server
- **ESBuild**: Fast server-side bundling
- **TSX**: TypeScript execution for development
- **Vite**: Development server with HMR

### Storage Strategy
- **Primary Storage**: PostgreSQL database via Neon Database with Drizzle ORM
- **Database Connection**: @neondatabase/serverless with connection pooling
- **Schema Management**: Drizzle Kit for migrations and schema synchronization
- **Data Models**: Comprehensive trip tracking with revenue, driver, and performance metrics

## Deployment Strategy

### Build Process
1. **Client Build**: Vite builds React app to `dist/public`
2. **Server Build**: ESBuild bundles server code to `dist/index.js`
3. **Database Migration**: Drizzle Kit handles schema migrations
4. **Asset Optimization**: Vite optimizes static assets

### Environment Configuration
- **Development**: tsx with hot reloading
- **Production**: Compiled Node.js with static asset serving
- **Database**: PostgreSQL connection via DATABASE_URL environment variable

### Replit Integration
- **Development Mode**: Automatic banner injection for external preview
- **Error Handling**: Runtime error modal for development
- **File Watching**: Replit-specific vite plugins for enhanced development

## Changelog

- July 03, 2025. Initial setup
- July 03, 2025. Added automatic destination queue management system with first-come-first-served positioning, real-time status updates, and estimated boarding times
- July 08, 2025. Successfully migrated from Replit Agent to Replit environment with enhanced trip details functionality including revenue tracking, driver information, distance covered, and trip duration
- July 08, 2025. Successfully migrated from in-memory storage to PostgreSQL database using Drizzle ORM with full data persistence and enhanced trip details viewing

## User Preferences

Preferred communication style: Simple, everyday language.