import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertTripSchema, insertPassengerEventSchema, insertLocationSchema, insertDestinationQueueSchema, insertExpenseSchema, insertDriverSchema, insertVehicleSchema, passengerPickupSchema } from "@shared/schema";
import { generateDailyReport, sendDailyReport } from "./email-reporting";
import { z } from "zod";
import { calculateFare, getValidDropOffLocations } from "./route-mapping";

interface WebSocketClient extends WebSocket {
  isAlive: boolean;
  clientId: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Test database connection
  try {
    console.log('Testing database connection...');
    await storage.getTodayAnalytics();
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    // Don't exit, just log the error
  }
  
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

  // Route mapping endpoints
  app.get('/api/routes/locations', async (req, res) => {
    try {
      const { getAllAvailableLocations } = await import('./route-mapping.js');
      const locations = getAllAvailableLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch locations' });
    }
  });

  app.get('/api/routes/destinations/:origin', async (req, res) => {
    try {
      const { getAvailableDestinations } = await import('./route-mapping.js');
      const destinations = getAvailableDestinations(req.params.origin);
      res.json(destinations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch destinations' });
    }
  });

  // Get valid drop-off locations for passenger pickup
  app.get('/api/routes/valid-dropoffs', async (req, res) => {
    try {
      const { pickupLocation, origin, destination } = req.query;
      
      if (!pickupLocation || !origin || !destination) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      const validLocations = getValidDropOffLocations(
        pickupLocation as string, 
        origin as string, 
        destination as string
      );
      
      res.json(validLocations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch valid drop-off locations' });
    }
  });

  // Calculate fare for passenger pickup
  app.get('/api/routes/calculate-fare', async (req, res) => {
    try {
      const { pickupLocation, dropOffLocation, origin, destination } = req.query;
      
      if (!pickupLocation || !dropOffLocation || !origin || !destination) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      const fare = calculateFare(
        pickupLocation as string,
        dropOffLocation as string,
        origin as string,
        destination as string
      );
      
      res.json({ fare });
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate fare' });
    }
  });

  // Trip routes
  app.post('/api/trips', async (req, res) => {
    try {
      const tripData = insertTripSchema.parse(req.body);
      
      // Automatically generate drop-off points based on route
      const { getDropOffPointsForRoute } = await import('./route-mapping.js');
      const dropOffPoints = getDropOffPointsForRoute(tripData.origin, tripData.destination);
      
      // Calculate total passengers from drop-off points
      const totalPassengers = dropOffPoints.reduce((sum, point) => sum + point.passengerCount, 0);
      
      // Create trip with automatic drop-off points and passenger count
      const tripWithDropOffs = {
        ...tripData,
        dropOffPoints,
        initialPassengers: totalPassengers,
        currentPassengers: totalPassengers
      };
      
      const trip = await storage.createTrip(tripWithDropOffs);
      
      // If this driver was in a queue, remove them (they're starting a new trip)
      if (tripData.driverId) {
        const allQueues = await storage.getAllQueues();
        
        // Find any queue entries for this driver by checking trip ownership
        for (const queueEntry of allQueues) {
          const queueTrip = await storage.getTrip(queueEntry.tripId);
          if (queueTrip && queueTrip.driverId === tripData.driverId) {
            await storage.removeFromQueue(queueEntry.id);
            
            // Broadcast queue removal to all clients
            broadcastToClients({
              type: 'queue_removed',
              queueId: queueEntry.id,
              message: `Driver has started a new trip and left the queue`
            });
          }
        }
      }
      
      // Broadcast new trip to all clients
      broadcastToClients({
        type: 'trip_created',
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
      
      // If dropOffPoints are being updated, recalculate passenger counts
      if (updates.dropOffPoints) {
        const totalPassengers = updates.dropOffPoints.reduce((sum: number, point: any) => sum + point.passengerCount, 0);
        updates.initialPassengers = totalPassengers;
        updates.currentPassengers = totalPassengers;
      }
      
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

  // Start trip endpoint
  app.post('/api/trips/:id/start', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const trip = await storage.updateTrip(id, {
        status: 'active',
        startTime: new Date()
      });
      
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      
      // Remove driver from any existing queue entries (they're starting a new trip)
      if (trip.driverId) {
        const allQueues = await storage.getAllQueues();
        
        // Find any queue entries for this driver by checking trip ownership
        for (const queueEntry of allQueues) {
          const queueTrip = await storage.getTrip(queueEntry.tripId);
          if (queueTrip && queueTrip.driverId === trip.driverId) {
            await storage.removeFromQueue(queueEntry.id);
            
            // Broadcast queue removal to all clients
            broadcastToClients({
              type: 'queue_removed',
              queueId: queueEntry.id,
              message: `Driver has started a new trip and left the queue`
            });
          }
        }
      }
      
      // Broadcast trip start to all clients
      broadcastToClients({
        type: 'trip_started',
        trip
      });
      
      res.json(trip);
    } catch (error) {
      res.status(500).json({ error: 'Failed to start trip' });
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
        driverId: trip.driverId ? trip.driverId.toString() : `driver_${Math.random().toString(36).substring(7)}`
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

  // Passenger pickup at drop-off point endpoint
  app.post('/api/trips/:id/pickup-passenger', async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const pickupData = passengerPickupSchema.parse(req.body);
      
      // Verify trip is active
      const trip = await storage.getTrip(tripId);
      if (!trip || trip.status !== 'active') {
        return res.status(400).json({ error: 'Trip is not active' });
      }
      
      // Create passenger pickup event
      const event = await storage.createPassengerEvent({
        tripId,
        eventType: 'pickup_at_dropoff',
        passengerCount: pickupData.passengerCount,
        location: null, // Will be filled based on pickup location
        pickupLocation: pickupData.pickupLocation,
        dropOffLocation: pickupData.dropOffLocation,
        fareAmount: pickupData.fareAmount.toString()
      });
      
      // Add new drop-off point to trip if it doesn't exist
      let updatedDropOffPoints = [...(trip.dropOffPoints || [])];
      const existingPointIndex = updatedDropOffPoints.findIndex(
        point => point.name === pickupData.dropOffLocation
      );
      
      if (existingPointIndex >= 0) {
        // Update existing drop-off point
        updatedDropOffPoints[existingPointIndex] = {
          ...updatedDropOffPoints[existingPointIndex],
          passengerCount: updatedDropOffPoints[existingPointIndex].passengerCount + pickupData.passengerCount,
          totalRevenue: updatedDropOffPoints[existingPointIndex].totalRevenue + pickupData.fareAmount
        };
      } else {
        // Add new drop-off point
        updatedDropOffPoints.push({
          name: pickupData.dropOffLocation,
          coordinates: { lat: 0, lng: 0 }, // Default coordinates
          passengerCount: pickupData.passengerCount,
          farePerPassenger: pickupData.fareAmount / pickupData.passengerCount,
          totalRevenue: pickupData.fareAmount
        });
      }
      
      // Update trip with new passenger count and revenue
      const newTotalRevenue = parseFloat(trip.revenue || "0") + pickupData.fareAmount;
      const newPassengerCount = trip.currentPassengers + pickupData.passengerCount;
      
      const updatedTrip = await storage.updateTrip(tripId, {
        currentPassengers: newPassengerCount,
        revenue: newTotalRevenue.toString(),
        dropOffPoints: updatedDropOffPoints
      });
      
      // Broadcast pickup event to all clients
      broadcastToClients({
        type: 'passenger_pickup',
        tripId,
        event,
        newPassengerCount,
        newRevenue: newTotalRevenue,
        message: `${pickupData.passengerCount} passenger(s) picked up at ${pickupData.pickupLocation}`
      });
      
      res.json({ 
        event, 
        updatedTrip,
        message: `Successfully picked up ${pickupData.passengerCount} passenger(s) at ${pickupData.pickupLocation}`
      });
    } catch (error) {
      console.error('Passenger pickup error:', error);
      res.status(400).json({ 
        error: error instanceof z.ZodError ? error.errors : 'Failed to pickup passenger' 
      });
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

  app.get('/api/analytics/routes', async (req, res) => {
    try {
      const routes = await storage.getPopularRoutes();
      res.json(routes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch route analytics' });
    }
  });

  app.get('/api/analytics/drivers', async (req, res) => {
    try {
      const performance = await storage.getDriverPerformance();
      res.json(performance);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch driver performance' });
    }
  });

  app.get('/api/analytics/hourly', async (req, res) => {
    try {
      const hourlyFlow = await storage.getHourlyPassengerFlow();
      res.json(hourlyFlow);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch hourly flow' });
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
      
      // Enrich queue data with trip, driver, and vehicle details
      const enrichedQueues = await Promise.all(
        allQueues.map(async (queue) => {
          const trip = await storage.getTrip(queue.tripId);
          let driver = null;
          let vehicle = null;
          
          if (trip?.driverId) {
            driver = await storage.getDriver(trip.driverId);
          }
          
          if (trip?.vehicleId) {
            vehicle = await storage.getVehicle(trip.vehicleId);
          }
          
          return {
            ...queue,
            trip,
            driver,
            vehicle
          };
        })
      );
      
      res.json(enrichedQueues);
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
      
      // Enrich queue data with trip, driver, and vehicle details
      const enrichedQueue = await Promise.all(
        queue.map(async (queueItem) => {
          const trip = await storage.getTrip(queueItem.tripId);
          let driver = null;
          let vehicle = null;
          
          if (trip?.driverId) {
            driver = await storage.getDriver(trip.driverId);
          }
          
          if (trip?.vehicleId) {
            vehicle = await storage.getVehicle(trip.vehicleId);
          }
          
          return {
            ...queueItem,
            trip,
            driver,
            vehicle
          };
        })
      );
      
      res.json(enrichedQueue);
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

  // Vehicle routes
  app.get('/api/vehicles', async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
  });

  app.get('/api/vehicles/active', async (req, res) => {
    try {
      const vehicles = await storage.getActiveVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error('Error fetching active vehicles:', error);
      res.status(500).json({ error: 'Failed to fetch active vehicles' });
    }
  });

  app.get('/api/vehicles/:id', async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(parseInt(req.params.id));
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      res.json(vehicle);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      res.status(500).json({ error: 'Failed to fetch vehicle' });
    }
  });

  app.post('/api/vehicles', async (req, res) => {
    try {
      const vehicleData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(vehicleData);
      res.json(vehicle);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      res.status(400).json({ error: error instanceof z.ZodError ? error.errors : 'Invalid vehicle data' });
    }
  });

  app.patch('/api/vehicles/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedVehicle = await storage.updateVehicle(id, req.body);
      
      if (!updatedVehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      res.json(updatedVehicle);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      res.status(500).json({ error: 'Failed to update vehicle' });
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
