import { 
  trips, 
  passengerEvents, 
  locations, 
  analytics,
  type Trip, 
  type InsertTrip,
  type PassengerEvent,
  type InsertPassengerEvent,
  type Location,
  type InsertLocation,
  type Analytics
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
}

export class MemStorage implements IStorage {
  private trips: Map<number, Trip>;
  private passengerEvents: Map<number, PassengerEvent>;
  private locations: Map<number, Location>;
  private analytics: Map<string, Analytics>;
  private currentId: { trips: number; events: number; locations: number; analytics: number };

  constructor() {
    this.trips = new Map();
    this.passengerEvents = new Map();
    this.locations = new Map();
    this.analytics = new Map();
    this.currentId = { trips: 1, events: 1, locations: 1, analytics: 1 };
    
    // Initialize with some popular locations
    this.initializeLocations();
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
}

export const storage = new MemStorage();
