import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  status: text("status").notNull().default("pending"), // pending, active, completed, cancelled
  currentPassengers: integer("current_passengers").notNull().default(0),
  initialPassengers: integer("initial_passengers").notNull().default(0),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  currentLocation: jsonb("current_location").$type<{ lat: number; lng: number }>(),
  route: jsonb("route").$type<{ lat: number; lng: number }[]>().default([]),
  dropOffPoints: jsonb("drop_off_points").$type<{
    name: string;
    coordinates: { lat: number; lng: number };
    passengerCount: number;
    farePerPassenger: number;
    totalRevenue: number;
  }[]>().default([]),
  totalDistance: decimal("total_distance", { precision: 8, scale: 2 }).default("0"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  driverId: integer("driver_id"),
  vehicleId: integer("vehicle_id"),
  turnsCount: integer("turns_count").default(0),
});

export const passengerEvents = pgTable("passenger_events", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  eventType: text("event_type").notNull(), // "board", "alight", "pickup_at_dropoff"
  passengerCount: integer("passenger_count").notNull(),
  location: jsonb("location").$type<{ lat: number; lng: number }>(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  pickupLocation: text("pickup_location"), // Location name where passenger boarded
  dropOffLocation: text("drop_off_location"), // Intended drop-off location
  fareAmount: decimal("fare_amount", { precision: 10, scale: 2 }), // Fare for this passenger segment
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  coordinates: jsonb("coordinates").$type<{ lat: number; lng: number }>().notNull(),
  isPopular: boolean("is_popular").default(false),
  usageCount: integer("usage_count").default(0),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  totalTrips: integer("total_trips").default(0),
  totalPassengers: integer("total_passengers").default(0),
  totalDistance: decimal("total_distance", { precision: 8, scale: 2 }).default("0"),
  averagePassengersPerTrip: decimal("average_passengers_per_trip", { precision: 5, scale: 2 }).default("0"),
  hourlyData: jsonb("hourly_data").$type<{ hour: number; passengers: number }[]>().default([]),
});

export const destinationQueues = pgTable("destination_queues", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  destination: text("destination").notNull(),
  arrivalTime: timestamp("arrival_time").notNull().defaultNow(),
  queuePosition: integer("queue_position").notNull(),
  status: text("status").notNull().default("waiting"), // waiting, boarding, departed
  driverId: text("driver_id"),
  estimatedBoardingTime: timestamp("estimated_boarding_time"),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  date: timestamp("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  assistantName: text("assistant_name"),
  assistantContact: text("assistant_contact"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  numberPlate: text("number_plate").notNull().unique(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  capacity: integer("capacity").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTripSchema = createInsertSchema(trips).pick({
  origin: true,
  destination: true,
  currentLocation: true,
  driverId: true,
  vehicleId: true,
});

export const insertPassengerEventSchema = createInsertSchema(passengerEvents).pick({
  tripId: true,
  eventType: true,
  passengerCount: true,
  location: true,
  pickupLocation: true,
  dropOffLocation: true,
  fareAmount: true,
});

// Schema for passenger pickup at drop-off points
export const passengerPickupSchema = z.object({
  tripId: z.number(),
  passengerCount: z.number().min(1),
  pickupLocation: z.string(), // Current drop-off point where pickup happens
  dropOffLocation: z.string(), // Where passenger wants to be dropped off
  fareAmount: z.number().min(0), // Calculated fare for this segment
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  name: true,
  coordinates: true,
});

export const insertDestinationQueueSchema = createInsertSchema(destinationQueues).pick({
  tripId: true,
  destination: true,
  driverId: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  description: true,
  amount: true,
  category: true,
  date: true,
  notes: true,
});

export const insertDriverSchema = createInsertSchema(drivers).pick({
  name: true,
  contact: true,
  assistantName: true,
  assistantContact: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  numberPlate: true,
  make: true,
  model: true,
  year: true,
  capacity: true,
});

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertPassengerEvent = z.infer<typeof insertPassengerEventSchema>;
export type PassengerEvent = typeof passengerEvents.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;
export type Analytics = typeof analytics.$inferSelect;
export type DestinationQueue = typeof destinationQueues.$inferSelect;
export type InsertDestinationQueue = z.infer<typeof insertDestinationQueueSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
