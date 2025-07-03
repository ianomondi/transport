import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  status: text("status").notNull().default("active"), // active, completed, cancelled
  currentPassengers: integer("current_passengers").notNull().default(0),
  initialPassengers: integer("initial_passengers").notNull().default(0),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  currentLocation: jsonb("current_location").$type<{ lat: number; lng: number }>(),
  route: jsonb("route").$type<{ lat: number; lng: number }[]>().default([]),
  totalDistance: decimal("total_distance", { precision: 8, scale: 2 }).default("0"),
});

export const passengerEvents = pgTable("passenger_events", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  eventType: text("event_type").notNull(), // "board" or "alight"
  passengerCount: integer("passenger_count").notNull(),
  location: jsonb("location").$type<{ lat: number; lng: number }>(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
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

export const insertTripSchema = createInsertSchema(trips).pick({
  origin: true,
  destination: true,
  initialPassengers: true,
  currentLocation: true,
});

export const insertPassengerEventSchema = createInsertSchema(passengerEvents).pick({
  tripId: true,
  eventType: true,
  passengerCount: true,
  location: true,
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

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertPassengerEvent = z.infer<typeof insertPassengerEventSchema>;
export type PassengerEvent = typeof passengerEvents.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;
export type Analytics = typeof analytics.$inferSelect;
export type DestinationQueue = typeof destinationQueues.$inferSelect;
export type InsertDestinationQueue = z.infer<typeof insertDestinationQueueSchema>;
