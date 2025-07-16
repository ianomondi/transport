import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertTripSchema, insertPassengerEventSchema, insertLocationSchema, insertDestinationQueueSchema, insertExpenseSchema, insertDriverSchema } from "@shared/schema";
import { generateDailyReport, sendDailyReport } from "./email-reporting";
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
            
            // Check if driver has reached destination and auto-end trip
            // For demo purposes, we'll check if trip has been running for more than 30 seconds
            const tripDuration = Date.now() - new Date(activeTrip.startTime).getTime();
            if (tripDuration > 30000) { // 30 seconds for demo
              // Auto-end trip and add to queue
              const completedTrip = await storage.updateTrip(activeTrip.id, {
                status: 'completed',
                endTime: new Date()
              });
              
              if (completedTrip) {
                const queueEntry = await storage.addToQueue({
                  tripId: completedTrip.id,
                  destination: completedTrip.destination,
                  driverId: `driver_${clientId}`
                });
                
                broadcastToClients({
                  type: 'trip_auto_completed',
                  trip: completedTrip,
                  queuePosition: queueEntry,
                  message: 'Trip automatically ended - destination reached'
                });
              }
            } else {
              // Broadcast normal location update
              broadcastToClients({
                type: 'trip_location_update',
                tripId: activeTrip.id,
                location: data.location
              });
            }
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

  app.get('/api/trips/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid trip ID' });
      }
      
      const trip = await storage.getTrip(id);
      
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      
      res.json(trip);
    } catch (error) {
      console.error('Error fetching trip:', error);
      res.status(500).json({ error: 'Failed to fetch trip' });
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
      
      // Automatically add to destination queue when trip ends
      // Queue position is determined by arrival time at destination
      const queueEntry = await storage.addToQueue({
        tripId: trip.id,
        destination: trip.destination,
        driverId: `driver_${Math.random().toString(36).substring(7)}`
      });

      // Broadcast trip end and queue position to all clients
      broadcastToClients({
        type: 'trip_ended',
        trip,
        queuePosition: queueEntry,
        message: `You are now #${queueEntry.queuePosition} in queue at ${trip.destination}`
      });
      
      res.json({ trip, queuePosition: queueEntry });
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

  // Queue management routes
  app.get('/api/queue', async (req, res) => {
    try {
      const allQueues = await storage.getAllQueues();
      res.json(allQueues);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch all queues' });
    }
  });

  app.get('/api/queue/all', async (req, res) => {
    try {
      const allQueues = await storage.getAllQueues();
      res.json(allQueues);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch all queues' });
    }
  });

  app.get('/api/queue/:destination', async (req, res) => {
    try {
      const destination = decodeURIComponent(req.params.destination);
      const queue = await storage.getQueueForDestination(destination);
      res.json(queue);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch queue' });
    }
  });

  app.get('/api/queue/position/:tripId', async (req, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const queuePosition = await storage.getDriverQueuePosition(tripId);
      res.json(queuePosition);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch queue position' });
    }
  });

  app.patch('/api/queue/:queueId/status', async (req, res) => {
    try {
      const queueId = parseInt(req.params.queueId);
      const { status } = req.body;
      const updatedQueue = await storage.updateQueueStatus(queueId, status);
      
      if (!updatedQueue) {
        return res.status(404).json({ error: 'Queue entry not found' });
      }

      // Broadcast queue update to all clients
      broadcastToClients({
        type: 'queue_updated',
        queue: updatedQueue
      });
      
      res.json(updatedQueue);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update queue status' });
    }
  });

  app.delete('/api/queue/:queueId', async (req, res) => {
    try {
      const queueId = parseInt(req.params.queueId);
      await storage.removeFromQueue(queueId);
      
      // Broadcast queue removal to all clients
      broadcastToClients({
        type: 'queue_removed',
        queueId
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove from queue' });
    }
  });

  // Expense routes
  app.get('/api/expenses', async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  });

  app.get('/api/expenses/today', async (req, res) => {
    try {
      const expenses = await storage.getTodayExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch today expenses' });
    }
  });

  app.post('/api/expenses', async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(expenseData);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: error instanceof z.ZodError ? error.errors : 'Invalid expense data' });
    }
  });

  // Driver routes
  app.get('/api/drivers', async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      res.status(500).json({ error: 'Failed to fetch drivers' });
    }
  });

  app.get('/api/drivers/active', async (req, res) => {
    try {
      const drivers = await storage.getActiveDrivers();
      res.json(drivers);
    } catch (error) {
      console.error('Error fetching active drivers:', error);
      res.status(500).json({ error: 'Failed to fetch active drivers' });
    }
  });

  app.get('/api/drivers/:id', async (req, res) => {
    try {
      const driver = await storage.getDriver(parseInt(req.params.id));
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      res.json(driver);
    } catch (error) {
      console.error('Error fetching driver:', error);
      res.status(500).json({ error: 'Failed to fetch driver' });
    }
  });

  app.post('/api/drivers', async (req, res) => {
    try {
      const driver = await storage.createDriver(req.body);
      res.json(driver);
    } catch (error) {
      console.error('Error creating driver:', error);
      res.status(500).json({ error: 'Failed to create driver' });
    }
  });

  app.patch('/api/drivers/:id', async (req, res) => {
    try {
      const driver = await storage.updateDriver(parseInt(req.params.id), req.body);
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      res.json(driver);
    } catch (error) {
      console.error('Error updating driver:', error);
      res.status(500).json({ error: 'Failed to update driver' });
    }
  });

  // Email reporting routes
  app.get('/api/reports/daily', async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const report = await generateDailyReport(date);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate daily report' });
    }
  });

  app.post('/api/reports/email', async (req, res) => {
    try {
      const { email, date } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
      }
      
      const reportDate = date ? new Date(date) : new Date();
      const success = await sendDailyReport(email, undefined, reportDate);
      
      if (success) {
        res.json({ message: 'Daily report sent successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send daily report' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to send daily report' });
    }
  });

  return httpServer;
}
