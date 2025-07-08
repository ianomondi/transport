import { trips, passengerEvents, locations, analytics, destinationQueues, type Trip, type InsertTrip, type PassengerEvent, type InsertPassengerEvent, type Location, type InsertLocation, type Analytics, type DestinationQueue, type InsertDestinationQueue } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const [trip] = await db
      .insert(trips)
      .values({
        ...insertTrip,
        revenue: "0",
        driverName: "Driver",
        turnsCount: 0,
      })
      .returning();
    return trip;
  }

  async getTrip(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip || undefined;
  }

  async getActiveTrip(): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.status, "active"));
    return trip || undefined;
  }

  async updateTrip(id: number, updates: Partial<Trip>): Promise<Trip | undefined> {
    const [trip] = await db
      .update(trips)
      .set(updates)
      .where(eq(trips.id, id))
      .returning();
    return trip || undefined;
  }

  async getTripsByStatus(status: string): Promise<Trip[]> {
    return await db.select().from(trips).where(eq(trips.status, status));
  }

  async getRecentTrips(limit: number = 10): Promise<Trip[]> {
    return await db.select().from(trips).orderBy(desc(trips.startTime)).limit(limit);
  }

  async createPassengerEvent(insertEvent: InsertPassengerEvent): Promise<PassengerEvent> {
    const [event] = await db
      .insert(passengerEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async getPassengerEventsByTrip(tripId: number): Promise<PassengerEvent[]> {
    return await db.select().from(passengerEvents).where(eq(passengerEvents.tripId, tripId));
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const [location] = await db
      .insert(locations)
      .values(insertLocation)
      .returning();
    return location;
  }

  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  async getPopularLocations(): Promise<Location[]> {
    return await db.select().from(locations).where(eq(locations.isPopular, true));
  }

  async updateLocationUsage(name: string): Promise<void> {
    // Find location by name and increment usage
    const [location] = await db.select().from(locations).where(eq(locations.name, name));
    if (location) {
      await db
        .update(locations)
        .set({ usageCount: (location.usageCount || 0) + 1 })
        .where(eq(locations.id, location.id));
    }
  }

  async getTodayAnalytics(): Promise<Analytics | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [analyticsData] = await db.select().from(analytics).where(eq(analytics.date, today));
    return analyticsData || undefined;
  }

  async updateAnalytics(date: Date, data: Partial<Analytics>): Promise<Analytics> {
    const existing = await this.getTodayAnalytics();
    if (existing) {
      const [updated] = await db
        .update(analytics)
        .set(data)
        .where(eq(analytics.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(analytics)
        .values({ ...data, date })
        .returning();
      return created;
    }
  }

  async getAnalyticsByDateRange(startDate: Date, endDate: Date): Promise<Analytics[]> {
    return await db.select().from(analytics);
  }

  async addToQueue(insertQueue: InsertDestinationQueue): Promise<DestinationQueue> {
    // Calculate queue position
    const existingQueues = await db.select().from(destinationQueues).where(eq(destinationQueues.destination, insertQueue.destination));
    const queuePosition = existingQueues.length + 1;

    const [queue] = await db
      .insert(destinationQueues)
      .values({
        ...insertQueue,
        queuePosition,
      })
      .returning();
    return queue;
  }

  async getQueueForDestination(destination: string): Promise<DestinationQueue[]> {
    return await db.select().from(destinationQueues).where(eq(destinationQueues.destination, destination));
  }

  async getDriverQueuePosition(tripId: number): Promise<DestinationQueue | undefined> {
    const [queue] = await db.select().from(destinationQueues).where(eq(destinationQueues.tripId, tripId));
    return queue || undefined;
  }

  async updateQueueStatus(queueId: number, status: string): Promise<DestinationQueue | undefined> {
    const [queue] = await db
      .update(destinationQueues)
      .set({ status })
      .where(eq(destinationQueues.id, queueId))
      .returning();
    return queue || undefined;
  }

  async removeFromQueue(queueId: number): Promise<void> {
    await db.delete(destinationQueues).where(eq(destinationQueues.id, queueId));
  }
}

export const storage = new DatabaseStorage();