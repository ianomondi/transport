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
- July 16, 2025. Enhanced trip management system with detailed driver and assistant information, revenue tracking, comprehensive trip listing, and automatic queue management when trips are completed
- July 16, 2025. Successfully migrated from Replit Agent to Replit environment with full database setup and automatic route mapping system. Implemented predefined route mappings between major locations (Capital Center ↔ Central Station, Airport ↔ City Center, Downtown ↔ Suburb East) that automatically generate drop-off points with preset fares. Removed manual drop-off point creation from trip form - now uses location dropdowns with cascading destination selection.
- July 18, 2025. Completed project migration from Replit Agent to standard Replit environment with PostgreSQL database provisioning, removed passenger on/off buttons from active trip display, eliminated initial passengers field from trip creation form, and added functional driver selection dropdown with pre-populated sample drivers.
- July 18, 2025. Completed successful migration from Replit Agent to Replit environment with PostgreSQL database setup and all dependencies installed. Removed passenger on/off functions from active trip card as requested - now displays only trip information and current passenger count.
- July 18, 2025. Successfully migrated add trip functionality from redirect to modal. Updated FloatingActionButton to show "Add Trip" instead of "Start Trip", modified NewTripModal to use "Add Trip" language throughout, and configured dashboard to open trip modal directly instead of redirecting to trips page. Added 5 sample drivers to database (John Martinez, David Chen, Ahmed Hassan, Carlos Rodriguez, Michael O'Connor) with contact information and assistants to populate driver dropdown in trip creation modal. Enhanced trip creation workflow to redirect users to home page after successful trip creation.
- July 18, 2025. Updated trip creation workflow to use modal dialog: FloatingActionButton now shows "Add Trip" and opens NewTripModal directly on dashboard instead of redirecting to trips page. Modal shows "Add New Trip" title with "Add Trip" button instead of "Start Trip".
- July 18, 2025. Enhanced trip management controls: Added "End Trip" button to ActiveTripCard that appears only when trip status is active. When there's an active trip, users cannot start new trips (FloatingActionButton "Add Trip" is disabled). After ending a trip, drop-off point passenger management buttons are disabled and show completion message.
- July 18, 2025. Moved "End Trip" button from ActiveTripCard to trip details page as requested. The button only appears in trip details when the trip status is active, allowing users to end trips from the detailed view rather than the dashboard card.
- July 18, 2025. Updated trip button visibility logic: "Start Trip" button only shows for non-active/non-completed trips, "End Trip" button only appears after trip is started (active status), and both buttons are hidden once trip is completed.
- July 18, 2025. Integrated complete vehicle management system: Added vehicles table with number plate, make, model, year, and capacity fields. Created vehicle API endpoints and populated database with 5 sample vehicles. Updated trip creation modal to include vehicle selection dropdown alongside driver selection. Added comprehensive vehicle information display in trip details page showing number plate, make/model, year, and passenger capacity.
- July 18, 2025. Fixed daily reporting functionality: Daily reports now correctly show all completed trips for the selected day instead of just one record. Added getTripsByDateRange method to storage interface and updated generateDailyReport function to use proper date-based trip filtering. Reports now display comprehensive trip summaries with accurate totals for revenue, passengers, and trip counts.
- July 18, 2025. Modified trip creation workflow to support manual trip start instead of automatic start. Trips are now created in "pending" status and require manual start via "Start Trip" button. Added new trip status "pending" with blue badge color, created /api/trips/:id/start endpoint, and updated trip details page to use proper start trip functionality. This allows better control over when trips actually begin.
- July 18, 2025. Enhanced queue management system: Fixed trip ending functionality to properly use POST /api/trips/:id/end endpoint. Updated queue display to show vehicle number plate, make/model, and driver contact details. Added automatic queue removal when vehicles start new trips to prevent drivers from being stuck in queue while actively working. Queue now shows comprehensive vehicle and driver information for better fleet management.
- July 18, 2025. Successfully completed migration from Replit Agent to standard Replit environment. Set up PostgreSQL database with all required tables, installed necessary dependencies, configured database connections and migrations. Added sample data: 5 drivers (John Martinez, David Chen, Ahmed Hassan, Carlos Rodriguez, Michael O'Connor) and 5 vehicles (Toyota Hiace, Ford Transit, Mercedes Sprinter, Nissan NV200, Volkswagen Crafter) to populate dropdown selections in trip creation form.
- July 18, 2025. Implemented comprehensive analytics dashboard with real-time data calculation from completed trips. Added key performance indicators, interactive hourly passenger flow charts using Recharts, popular routes analysis with progress bars, top performing drivers leaderboard, smart insights with peak hours and efficiency scores, and performance metrics with visual indicators. Analytics automatically refresh every 30-60 seconds and calculate revenue, distance, and passenger metrics from actual trip data. Redesigned KPI layout to display trips and passengers in top row, miles and revenue in bottom row as requested.
- July 18, 2025. Successfully migrated from Replit Agent to standard Replit environment. Completed PostgreSQL database setup, added sample drivers and vehicles to populate trip creation dropdowns. Implemented passenger pickup functionality at drop-off points with automatic fare calculation and revenue tracking. Added PassengerPickupModal component that allows drivers to pick up passengers at any drop-off point, automatically calculates fares based on route segments, and updates trip revenue. Enhanced database schema to support pickup events with fare tracking and location details.
- July 18, 2025. Implemented advanced passenger pickup functionality at drop-off points with automatic fare calculation. Enhanced passenger events schema to support pickup events at drop-off points with fare tracking. Added API endpoints for passenger pickup, fare calculation, and valid drop-off location retrieval. Created PassengerPickupModal component allowing drivers to pick up new passengers at any drop-off point, with automatic fare calculation based on route mappings and distance. Updated DropOffPointManager with "Pick Up" buttons for each stop during active trips. System automatically calculates fares based on pickup location, destination, and predefined route pricing, then updates trip revenue and passenger counts in real-time via WebSocket broadcasts.
- July 18, 2025. Converted passenger pickup from popup modal to dedicated page navigation. Created new PassengerBoarding page (/passenger-boarding/:tripId/:pickupLocation) that provides enhanced interface for passenger boarding with multiple destination groups, individual passenger counts per destination, real-time fare calculation, and comprehensive summary. "Pick Up Passengers" buttons now redirect to this dedicated page instead of opening modal. Added route to App.tsx and updated DropOffPointManager navigation to use URL encoding for location parameters.

## User Preferences

Preferred communication style: Simple, everyday language.