import { BedDouble, Bus, Car, CarTaxiFront, Coffee, Landmark, Map, Music, Navigation, Plane, Ship, Sparkles, Ticket, Train, Utensils, type LucideIcon } from "lucide-react";

export const TRANSPORT_ICON: Record<string, LucideIcon> = {
  flight: Plane, train: Train, bus: Bus, car: Car, transfer: CarTaxiFront, ferry: Ship, other: Navigation,
};
export const ACTIVITY_ICON: Record<string, LucideIcon> = {
  attraction: Sparkles, tour: Map, museum: Landmark, show: Music, restaurant: Utensils, other: Ticket,
};
export const EVENT_ICON: Record<string, LucideIcon> = {
  transport: Navigation, lodging: BedDouble, activity: Ticket, meal: Utensils, free: Coffee,
};
