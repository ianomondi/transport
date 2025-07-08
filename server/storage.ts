import { 
  trips, 
  passengerEvents, 
  locations, 
  analytics,
  destinationQueues,
  type Trip, 
  type InsertTrip,
  type PassengerEvent,
  type InsertPassengerEvent,
  type Location,
  type InsertLocation,
  type Analytics,
  type DestinationQueue,
  type InsertDestinationQueue
} from "@shared/schema";

export interface IStorage {
  // Trip operations
  createTrip(trip: InsertTrip): Promise<Trip>;
  getTrip(id: number): Promise<Trip | undefined>;
  getActiveTrip(): Promise<Trip | undefined>;
  updateTrip(id: number, updates: Partial<Trip>): Promise<Trip | undefined>;
  getTripsByStatus(status: string): Promise<Trip[]>;
  getRecentTrips(limit?: number): Promise<Trip[]>;
  
  // Passenger event operations
  createPassengerEvent(event: InsertPassengerEvent): Promise<PassengerEvent>;
  getPassengerEventsByTrip(tripId: number): Promise<PassengerEvent[]>;
  
  // Location operations
  createLocation(location: InsertLocation): Promise<Location>;
  getLocations(): Promise<Location[]>;
  getPopularLocations(): Promise<Location[]>;
  updateLocationUsage(name: string): Promise<void>;
  
  // Analytics operations
  getTodayAnalytics(): Promise<Analytics | undefined>;
  updateAnalytics(date: Date, data: Partial<Analytics>): Promise<Analytics>;
  getAnalyticsByDateRange(startDate: Date, endDate: Date): Promise<Analytics[]>;
  
  // Queue management operations
  addToQueue(queue: InsertDestinationQueue): Promise<DestinationQueue>;
  getQueueForDestination(destination: string): Promise<DestinationQueue[]>;
  getDriverQueuePosition(tripId: number): Promise<DestinationQueue | undefined>;
  updateQueueStatus(queueId: number, status: string): Promise<DestinationQueue | undefined>;
  removeFromQueue(queueId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private trips: Map<number, Trip>;
  private passengerEvents: Map<number, PassengerEvent>;
  private locations: Map<number, Location>;
  private analytics: Map<string, Analytics>;
  private queues: Map<number, DestinationQueue>;
  private currentId: { trips: number; events: number; locations: number; analytics: number; queues: number };

  constructor() {
    this.trips = new Map();
    this.passengerEvents = new Map();
    this.locations = new Map();
    this.analytics = new Map();
    this.queues = new Map();
    this.currentId = { trips: 1, events: 1, locations: 1, analytics: 1, queues: 1 };
    
    // Initialize with some popular locations
    this.initializeLocations();
    this.initializeSampleTrips();
  }

  private initializeSampleTrips() {
    // Create some sample completed trips for demonstration
    const sampleTrips = [
      {
        origin: "Central Station",
        destination: "Airport Terminal",
        status: "completed",
        currentPassengers: 0,
        initialPassengers: 8,
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        endTime: new Date(Date.now() - 3000000), // 50 minutes ago
        totalDistance: "12.5",
        revenue: "45.80",
        driverName: "John Smith",
        turnsCount: 15,
      },
      {
        origin: "Downtown",
        destination: "Mall District", 
        status: "completed",
        currentPassengers: 0,
        initialPassengers: 5,
        startTime: new Date(Date.now() - 7200000), // 2 hours ago
        endTime: new Date(Date.now() - 6600000), // 1 hour 50 minutes ago
        totalDistance: "8.2",
        revenue: "28.50",
        driverName: "Sarah Johnson",
        turnsCount: 12,
      },
      {
        origin: "University Campus",
        destination: "Central Station",
        status: "completed", 
        currentPassengers: 0,
        initialPassengers: 12,
        startTime: new Date(Date.now() - 10800000), // 3 hours ago
        endTime: new Date(Date.now() - 9900000), // 2 hours 45 minutes ago
        totalDistance: "15.7",
        revenue: "68.20",
        driverName: "Mike Wilson",
        turnsCount: 22,
      }
    ];

    sampleTrips.forEach(tripData => {
      const id = this.currentId.trips++;
      const trip: Trip = {
        id,
        ...tripData,
        currentLocation: null,
        route: [],
      };
      this.trips.set(id, trip);
    });
  }

  private initializeLocations() {
    const popularLocations = [
      { name: "Central Station", coordinates: { lat: 37.7749, lng: -122.4194 } },
      { name: "Airport Terminal", coordinates: { lat: 37.7849, lng: -122.4094 } },
      { name: "Downtown", coordinates: { lat: 37.7649, lng: -122.4294 } },
      { name: "Mall District", coordinates: { lat: 37.7549, lng: -122.4394 } },
      { name: "University Campus", coordinates: { lat: 37.7449, lng: -122.4494 } },
    ];

    popularLocations.forEach(loc => {
      const location: Location = {
        id: this.currentId.locations++,
        name: loc.name,
        coordinates: loc.coordinates,
        isPopular: true,
        usageCount: Math.floor(Math.random() * 100) + 50,
      };
      this.locations.set(location.id, location);
    });
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const id = this.currentId.trips++;
    const trip: Trip = {
      id,
      origin: insertTrip.origin,
      destination: insertTrip.destination,
      status: "active",
      currentPassengers: insertTrip.initialPassengers || 0,
      initialPassengers: insertTrip.initialPassengers || 0,
      startTime: new Date(),
      endTime: null,
      currentLocation: insertTrip.currentLocation || null,
      route: [],
      totalDistance: "0",
      revenue: "0",
      driverName: "Driver",
      turnsCount: 0,
    };
    this.trips.set(id, trip);
    
    // Update location usage
    await this.updateLocationUsage(trip.origin);
    await this.updateLocationUsage(trip.destination);
    
    return trip;
  }

  async getTrip(id: number): Promise<Trip | undefined> {
    return this.trips.get(id);
  }

  async getActiveTrip(): Promise<Trip | undefined> {
    return Array.from(this.trips.values()).find(trip => trip.status === "active");
  }

  async updateTrip(id: number, updates: Partial<Trip>): Promise<Trip | undefined> {
    const trip = this.trips.get(id);
    if (!trip) return undefined;
    
    const updatedTrip = { ...trip, ...updates };
    this.trips.set(id, updatedTrip);
    return updatedTrip;
  }

  async getTripsByStatus(status: string): Promise<Trip[]> {
    return Array.from(this.trips.values()).filter(trip => trip.status === status);
  }

  async getRecentTrips(limit: number = 10): Promise<Trip[]> {
    return Array.from(this.trips.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit);
  }

  async createPassengerEvent(insertEvent: InsertPassengerEvent): Promise<PassengerEvent> {
    const id = this.currentId.events++;
    const event: PassengerEvent = {
      id,
      tripId: insertEvent.tripId,
      eventType: insertEvent.eventType,
      passengerCount: insertEvent.passengerCount,
      location: insertEvent.location || null,
      timestamp: new Date(),
    };
    this.passengerEvents.set(id, event);
    return event;
  }

  async getPassengerEventsByTrip(tripId: number): Promise<PassengerEvent[]> {
    return Array.from(this.passengerEvents.values())
      .filter(event => event.tripId === tripId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.currentId.locations++;
    const location: Location = {
      id,
      name: insertLocation.name,
      coordinates: insertLocation.coordinates,
      isPopular: false,
      usageCount: 1,
    };
    this.locations.set(id, location);
    return location;
  }

  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  async getPopularLocations(): Promise<Location[]> {
    return Array.from(this.locations.values())
      .filter(loc => loc.isPopular)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  }

  async updateLocationUsage(name: string): Promise<void> {
    const location = Array.from(this.locations.values()).find(loc => loc.name === name);
    if (location) {
      location.usageCount = (location.usageCount || 0) + 1;
      this.locations.set(location.id, location);
    }
  }

  async getTodayAnalytics(): Promise<Analytics | undefined> {
    const today = new Date().toISOString().split('T')[0];
    return this.analytics.get(today);
  }

  async updateAnalytics(date: Date, data: Partial<Analytics>): Promise<Analytics> {
    const dateKey = date.toISOString().split('T')[0];
    const existing = this.analytics.get(dateKey);
    
    const analytics: Analytics = {
      id: existing?.id || this.currentId.analytics++,
      date,
      totalTrips: data.totalTrips || existing?.totalTrips || 0,
      totalPassengers: data.totalPassengers || existing?.totalPassengers || 0,
      totalDistance: data.totalDistance || existing?.totalDistance || "0",
      averagePassengersPerTrip: data.averagePassengersPerTrip || existing?.averagePassengersPerTrip || "0",
      hourlyData: data.hourlyData || existing?.hourlyData || [],
    };
    
    this.analytics.set(dateKey, analytics);
    return analytics;
  }

  async getAnalyticsByDateRange(startDate: Date, endDate: Date): Promise<Analytics[]> {
    return Array.from(this.analytics.values())
      .filter(analytics => {
        const analyticsDate = new Date(analytics.date);
        return analyticsDate >= startDate && analyticsDate <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async addToQueue(insertQueue: InsertDestinationQueue): Promise<DestinationQueue> {
    const id = this.currentId.queues++;
    
    // Calculate queue position based on existing queue for this destination
    const existingQueue = Array.from(this.queues.values())
      .filter(q => q.destination === insertQueue.destination && q.status === 'waiting')
      .sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime());
    
    const queuePosition = existingQueue.length + 1;
    
    // Calculate estimated boarding time (5 minutes per vehicle ahead)
    const estimatedBoardingTime = new Date();
    estimatedBoardingTime.setMinutes(estimatedBoardingTime.getMinutes() + (queuePosition - 1) * 5);
    
    const queue: DestinationQueue = {
      id,
      tripId: insertQueue.tripId,
      destination: insertQueue.destination,
      arrivalTime: new Date(),
      queuePosition,
      status: 'waiting',
      driverId: insertQueue.driverId || null,
      estimatedBoardingTime,
    };
    
    this.queues.set(id, queue);
    return queue;
  }

  async getQueueForDestination(destination: string): Promise<DestinationQueue[]> {
    return Array.from(this.queues.values())
      .filter(q => q.destination === destination)
      .sort((a, b) => a.queuePosition - b.queuePosition);
  }

  async getDriverQueuePosition(tripId: number): Promise<DestinationQueue | undefined> {
    return Array.from(this.queues.values())
      .find(q => q.tripId === tripId);
  }

  async getAllQueues(): Promise<DestinationQueue[]> {
    return Array.from(this.queues.values())
      .sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime());
  }

  async updateQueueStatus(queueId: number, status: string): Promise<DestinationQueue | undefined> {
    const queue = this.queues.get(queueId);
    if (!queue) return undefined;

    const updatedQueue = { ...queue, status };
    this.queues.set(queueId, updatedQueue);

    // If vehicle departs, update positions for remaining vehicles
    if (status === 'departed') {
      const remainingQueues = Array.from(this.queues.values())
        .filter(q => q.destination === queue.destination && q.status === 'waiting' && q.queuePosition > queue.queuePosition);
      
      for (const remainingQueue of remainingQueues) {
        const newPosition = remainingQueue.queuePosition - 1;
        const newEstimatedTime = new Date();
        newEstimatedTime.setMinutes(newEstimatedTime.getMinutes() + (newPosition - 1) * 5);
        
        const updatedRemaining = {
          ...remainingQueue,
          queuePosition: newPosition,
          estimatedBoardingTime: newEstimatedTime
        };
        this.queues.set(remainingQueue.id, updatedRemaining);
      }
    }

    return updatedQueue;
  }

  async removeFromQueue(queueId: number): Promise<void> {
    const queue = this.queues.get(queueId);
    if (queue) {
      await this.updateQueueStatus(queueId, 'departed');
      this.queues.delete(queueId);
    }
  }
}

export const storage = new MemStorage();
