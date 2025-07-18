import { trips, passengerEvents, locations, analytics, destinationQueues, expenses, drivers, vehicles, type Trip, type InsertTrip, type PassengerEvent, type InsertPassengerEvent, type Location, type InsertLocation, type Analytics, type DestinationQueue, type InsertDestinationQueue, type Expense, type InsertExpense, type Driver, type InsertDriver, type Vehicle, type InsertVehicle } from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // Trip operations
  createTrip(trip: InsertTrip): Promise<Trip>;
  getTrip(id: number): Promise<Trip | undefined>;
  getActiveTrip(): Promise<Trip | undefined>;
  updateTrip(id: number, updates: Partial<Trip>): Promise<Trip | undefined>;
  getTripsByStatus(status: string): Promise<Trip[]>;
  getRecentTrips(limit?: number): Promise<Trip[]>;
  getTripsByDateRange(startDate: Date, endDate: Date): Promise<Trip[]>;
  
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
  calculateRealTimeAnalytics(): Promise<Analytics>;
  getHourlyPassengerFlow(): Promise<{ hour: number; passengers: number }[]>;
  getPopularRoutes(): Promise<{ route: string; count: number; avgPassengers: number }[]>;
  getDriverPerformance(): Promise<{ driverId: number; driverName: string; trips: number; passengers: number; revenue: number }[]>;
  
  // Queue management operations
  addToQueue(queue: InsertDestinationQueue): Promise<DestinationQueue>;
  getQueueForDestination(destination: string): Promise<DestinationQueue[]>;
  getDriverQueuePosition(tripId: number): Promise<DestinationQueue | undefined>;
  updateQueueStatus(queueId: number, status: string): Promise<DestinationQueue | undefined>;
  removeFromQueue(queueId: number): Promise<void>;
  getAllQueues(): Promise<DestinationQueue[]>;

  // Expense operations
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpenses(): Promise<Expense[]>;
  getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]>;
  getTodayExpenses(): Promise<Expense[]>;

  // Driver operations
  createDriver(driver: InsertDriver): Promise<Driver>;
  getDrivers(): Promise<Driver[]>;
  getActiveDrivers(): Promise<Driver[]>;
  getDriver(id: number): Promise<Driver | undefined>;
  updateDriver(id: number, updates: Partial<Driver>): Promise<Driver | undefined>;

  // Vehicle operations
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  getVehicles(): Promise<Vehicle[]>;
  getActiveVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  updateVehicle(id: number, updates: Partial<Vehicle>): Promise<Vehicle | undefined>;
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const [trip] = await db
      .insert(trips)
      .values({
        ...insertTrip,
        revenue: "0",
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

  async getTripsByDateRange(startDate: Date, endDate: Date): Promise<Trip[]> {
    return await db.select().from(trips).where(
      sql`DATE(${trips.startTime}) >= ${startDate.toISOString().split('T')[0]} AND DATE(${trips.startTime}) <= ${endDate.toISOString().split('T')[0]}`
    ).orderBy(desc(trips.startTime));
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
    // Get real-time calculated analytics instead of stored ones
    return await this.calculateRealTimeAnalytics();
  }

  async calculateRealTimeAnalytics(): Promise<Analytics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's completed trips
    const completedTrips = await db
      .select()
      .from(trips)
      .where(
        sql`${trips.startTime} >= ${today} AND ${trips.startTime} < ${tomorrow} AND ${trips.status} = 'completed'`
      );

    // Calculate totals
    const totalTrips = completedTrips.length;
    const totalPassengers = completedTrips.reduce((sum, trip) => sum + (trip.currentPassengers || 0), 0);
    const totalDistance = completedTrips.reduce((sum, trip) => sum + parseFloat(trip.totalDistance || "0"), 0);
    const averagePassengersPerTrip = totalTrips > 0 ? totalPassengers / totalTrips : 0;

    // Get hourly data
    const hourlyData = await this.getHourlyPassengerFlow();

    return {
      id: 0,
      date: today,
      totalTrips,
      totalPassengers,
      totalDistance: totalDistance.toFixed(2),
      averagePassengersPerTrip: averagePassengersPerTrip.toFixed(2),
      hourlyData
    };
  }

  async getHourlyPassengerFlow(): Promise<{ hour: number; passengers: number }[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get trips started today
    const todayTrips = await db
      .select()
      .from(trips)
      .where(
        sql`${trips.startTime} >= ${today} AND ${trips.startTime} < ${tomorrow}`
      );

    // Group by hour
    const hourlyFlow: { hour: number; passengers: number }[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(today);
      hourStart.setHours(hour);
      const hourEnd = new Date(today);
      hourEnd.setHours(hour + 1);

      const hourTrips = todayTrips.filter(trip => {
        if (!trip.startTime) return false;
        const tripTime = new Date(trip.startTime);
        return tripTime >= hourStart && tripTime < hourEnd;
      });

      const passengers = hourTrips.reduce((sum, trip) => sum + (trip.currentPassengers || 0), 0);
      hourlyFlow.push({ hour, passengers });
    }

    return hourlyFlow;
  }

  async getPopularRoutes(): Promise<{ route: string; count: number; avgPassengers: number }[]> {
    const completedTrips = await db
      .select()
      .from(trips)
      .where(eq(trips.status, 'completed'));

    // Group by route
    const routeMap = new Map<string, { count: number; totalPassengers: number }>();
    
    completedTrips.forEach(trip => {
      const route = `${trip.origin} → ${trip.destination}`;
      const current = routeMap.get(route) || { count: 0, totalPassengers: 0 };
      current.count++;
      current.totalPassengers += trip.currentPassengers || 0;
      routeMap.set(route, current);
    });

    return Array.from(routeMap.entries())
      .map(([route, data]) => ({
        route,
        count: data.count,
        avgPassengers: data.count > 0 ? data.totalPassengers / data.count : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  async getDriverPerformance(): Promise<{ driverId: number; driverName: string; trips: number; passengers: number; revenue: number }[]> {
    const completedTrips = await db
      .select()
      .from(trips)
      .where(eq(trips.status, 'completed'));

    const allDrivers = await this.getDrivers();
    
    // Group by driver
    const driverMap = new Map<number, { trips: number; passengers: number; revenue: number }>();
    
    completedTrips.forEach(trip => {
      if (!trip.driverId) return;
      const current = driverMap.get(trip.driverId) || { trips: 0, passengers: 0, revenue: 0 };
      current.trips++;
      current.passengers += trip.currentPassengers || 0;
      current.revenue += parseFloat(trip.revenue || "0");
      driverMap.set(trip.driverId, current);
    });

    return allDrivers
      .map(driver => {
        const performance = driverMap.get(driver.id) || { trips: 0, passengers: 0, revenue: 0 };
        return {
          driverId: driver.id,
          driverName: driver.name,
          ...performance
        };
      })
      .filter(perf => perf.trips > 0)
      .sort((a, b) => b.trips - a.trips);
  }

  async updateAnalytics(date: Date, data: Partial<Analytics>): Promise<Analytics> {
    const existing = await db.select().from(analytics).where(eq(analytics.date, date));
    if (existing.length > 0) {
      const [updated] = await db
        .update(analytics)
        .set(data)
        .where(eq(analytics.id, existing[0].id))
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

  async getAllQueues(): Promise<DestinationQueue[]> {
    return await db
      .select()
      .from(destinationQueues)
      .orderBy(asc(destinationQueues.arrivalTime));
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(
        sql`${expenses.date} >= ${startDate} AND ${expenses.date} <= ${endDate}`
      )
      .orderBy(desc(expenses.date));
  }

  async getTodayExpenses(): Promise<Expense[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await db.select().from(expenses).where(eq(expenses.date, today));
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const result = await db.insert(drivers).values(insertDriver).returning();
    return result[0];
  }

  async getDrivers(): Promise<Driver[]> {
    const result = await db.select().from(drivers)
      .orderBy(asc(drivers.name));
    return result;
  }

  async getActiveDrivers(): Promise<Driver[]> {
    const result = await db.select().from(drivers)
      .where(eq(drivers.isActive, true))
      .orderBy(asc(drivers.name));
    return result;
  }

  async getDriver(id: number): Promise<Driver | undefined> {
    const result = await db.select().from(drivers)
      .where(eq(drivers.id, id))
      .limit(1);
    return result[0];
  }

  async updateDriver(id: number, updates: Partial<Driver>): Promise<Driver | undefined> {
    const result = await db.update(drivers)
      .set(updates)
      .where(eq(drivers.id, id))
      .returning();
    return result[0];
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const result = await db.insert(vehicles).values(insertVehicle).returning();
    return result[0];
  }

  async getVehicles(): Promise<Vehicle[]> {
    const result = await db.select().from(vehicles)
      .orderBy(asc(vehicles.numberPlate));
    return result;
  }

  async getActiveVehicles(): Promise<Vehicle[]> {
    const result = await db.select().from(vehicles)
      .where(eq(vehicles.isActive, true))
      .orderBy(asc(vehicles.numberPlate));
    return result;
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const result = await db.select().from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);
    return result[0];
  }

  async updateVehicle(id: number, updates: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const result = await db.update(vehicles)
      .set(updates)
      .where(eq(vehicles.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();