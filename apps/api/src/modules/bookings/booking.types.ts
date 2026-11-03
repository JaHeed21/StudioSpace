import type { ObjectId } from "mongodb";

export const BOOKING_STATUSES = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface BookingInput {
  studioId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
}

export interface BookingDocument extends BookingInput {
  _id?: ObjectId;
  studioTitle: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  totalHours: number;
  hourlyRate: number;
  securityDeposit: number;
  rentalCost: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking extends Omit<BookingDocument, "_id" | "createdAt" | "updatedAt"> {
  id: string;
  studioImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
