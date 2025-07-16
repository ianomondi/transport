// Vehicle management for the transit system
export interface Vehicle {
  id: string;
  number: string;
  type: string;
  capacity: number;
  isActive: boolean;
}

// Sample vehicle data
export const AVAILABLE_VEHICLES: Vehicle[] = [
  { id: "1", number: "KCB 123K", type: "Bus", capacity: 50, isActive: true },
  { id: "2", number: "RAA 456L", type: "Bus", capacity: 45, isActive: true },
  { id: "3", number: "RBA 789M", type: "Bus", capacity: 55, isActive: true },
  { id: "4", number: "KCA 111N", type: "Bus", capacity: 60, isActive: true },
  { id: "5", number: "RAB 222P", type: "Bus", capacity: 48, isActive: true },
  { id: "6", number: "RBB 333Q", type: "Bus", capacity: 52, isActive: true },
  { id: "7", number: "KCB 444R", type: "Mini Bus", capacity: 30, isActive: true },
  { id: "8", number: "RAA 555S", type: "Mini Bus", capacity: 25, isActive: true },
  { id: "9", number: "RBA 666T", type: "Mini Bus", capacity: 35, isActive: true },
  { id: "10", number: "KCA 777U", type: "Mini Bus", capacity: 28, isActive: true },
];

export function getAvailableVehicles(): Vehicle[] {
  return AVAILABLE_VEHICLES.filter(vehicle => vehicle.isActive);
}

export function getVehicleByNumber(vehicleNumber: string): Vehicle | undefined {
  return AVAILABLE_VEHICLES.find(vehicle => vehicle.number === vehicleNumber);
}