import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertTripSchema, insertPassengerEventSchema, insertLocationSchema } from "@shared/schema";
import { z } from "zod";

interface WebSocketClient extends WebSocket {
  isAlive: boolean;
  clientId: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, WebSocketClient>();

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocketClient, req) => {
    const clientId = Math.random().toString(36).substring(7);
    ws.clientId = clientId;
    ws.isAlive = true;
    clients.set(clientId, ws);

    console.log(`WebSocket client connected: ${clientId}`);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'location_update') {
          // Handle location updates from driver
          const activeTrip = await storage.getActiveTrip();
          if (activeTrip) {
            await storage.updateTrip(activeTrip.id, {
              currentLocation: data.location,
              route: [...(activeTrip.route || []), data.location]
            });
            
            // Broadcast location update to all clients
            broadcastToClients({
              type: 'trip_location_update',
              tripId: activeTrip.id,
              location: data.location
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      clients.delete(clientId);
      console.log(`WebSocket client disconnected: ${clientId}`);
    });
  });

  // Heartbeat to keep connections alive
  const heartbeat = setInterval(() => {
    clients.forEach((ws: WebSocketClient, clientId: string) => {
      if (ws.isAlive === false) {
        ws.terminate();
        clients.delete(clientId);
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  function broadcastToClients(message: any) {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Trip routes
  app.post('/api/trips', async (req, res) => {
    try {
      const tripData = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip(tripData);
      
      // Broadcast new trip to all clients
      broadcastToClients({
        type: 'trip_started',
        trip
      });
      
      res.json(trip);
    } catch (error) {
      res.status(400).json({ error: error instanceof z.ZodError ? error.errors : 'Invalid trip data' });
    }
  });

  app.get('/api/trips/active', async (req, res) => {
    try {
      const activeTrip = await storage.getActiveTrip();
      res.json(activeTrip);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch active trip' });
    }
  });

  app.get('/api/trips/recent', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trips = await storage.getRecentTrips(limit);
      res.json(trips);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recent trips' });
    }
  });

  app.patch('/api/trips/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const trip = await storage.updateTrip(id, updates);
      
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      
      // Broadcast trip update to all clients
      broadcastToClients({
        type: 'trip_updated',
        trip
      });
      
      res.json(trip);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update trip' });
    }
  });

  app.post('/api/trips/:id/end', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const trip = await storage.updateTrip(id, {
        status: 'completed',
        endTime: new Date()
      });
      
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      
      // Update analytics
      const today = new Date();
      const currentAnalytics = await storage.getTodayAnalytics();
      await storage.updateAnalytics(today, {
        totalTrips: (currentAnalytics?.totalTrips || 0) + 1,
        totalPassengers: (currentAnalytics?.totalPassengers || 0) + trip.currentPassengers,
        totalDistance: (parseFloat(currentAnalytics?.totalDistance || "0") + parseFloat(trip.totalDistance || "0")).toString()
      });
      
      // Broadcast trip end to all clients
      broadcastToClients({
        type: 'trip_ended',
        trip
      });
      
      res.json(trip);
    } catch (error) {
      res.status(500).json({ error: 'Failed to end trip' });
    }
  });

  // Passenger event routes
  app.post('/api/passenger-events', async (req, res) => {
    try {
      const eventData = insertPassengerEventSchema.parse(req.body);
      const event = await storage.createPassengerEvent(eventData);
      
      // Update trip passenger count
      const trip = await storage.getTrip(event.tripId);
      if (trip) {
        const newCount = event.eventType === 'board' 
          ? trip.currentPassengers + event.passengerCount
          : Math.max(0, trip.currentPassengers - event.passengerCount);
        
        const updatedTrip = await storage.updateTrip(trip.id, {
          currentPassengers: newCount
        });
        
        // Broadcast passenger update to all clients
        broadcastToClients({
          type: 'passenger_update',
          tripId: trip.id,
          event,
          newPassengerCount: newCount
        });
      }
      
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: error instanceof z.ZodError ? error.errors : 'Invalid event data' });
    }
  });

  app.get('/api/trips/:id/passenger-events', async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const events = await storage.getPassengerEventsByTrip(tripId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch passenger events' });
    }
  });

  // Location routes
  app.get('/api/locations', async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch locations' });
    }
  });

  app.get('/api/locations/popular', async (req, res) => {
    try {
      const locations = await storage.getPopularLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch popular locations' });
    }
  });

  app.post('/api/locations', async (req, res) => {
    try {
      const locationData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(locationData);
      res.json(location);
    } catch (error) {
      res.status(400).json({ error: error instanceof z.ZodError ? error.errors : 'Invalid location data' });
    }
  });

  // Analytics routes
  app.get('/api/analytics/today', async (req, res) => {
    try {
      const analytics = await storage.getTodayAnalytics();
      res.json(analytics || {
        totalTrips: 0,
        totalPassengers: 0,
        totalDistance: "0",
        averagePassengersPerTrip: "0",
        hourlyData: []
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  app.get('/api/analytics/range', async (req, res) => {
    try {
      const startDate = new Date(req.query.start as string);
      const endDate = new Date(req.query.end as string);
      const analytics = await storage.getAnalyticsByDateRange(startDate, endDate);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch analytics range' });
    }
  });

  return httpServer;
}
