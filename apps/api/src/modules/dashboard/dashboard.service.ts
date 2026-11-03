import { getCollection } from "../../db/collection.js";
import type { BookingDocument } from "../bookings/booking.types.js";
import type { StudioDocument } from "../studios/studio.types.js";

export interface DashboardActivity {
  id: string;
  studioId: string;
  studioTitle: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  role: "customer" | "host";
}

export async function getDashboardSummary(userId: string) {
  const studios = getCollection<StudioDocument>("studios");
  const bookings = getCollection<BookingDocument>("bookings");
  const userStudios = await studios
    .find({ ownerId: userId }, { projection: { _id: 1, status: 1 } })
    .toArray();
  const studioIds = userStudios.map(({ _id }) => _id.toString());
  const involvedBookings = {
    $or: [{ customerId: userId }, { studioId: { $in: studioIds } }],
  };
  const [totalBookings, pendingBookings, confirmedBookings, recent] = await Promise.all([
    bookings.countDocuments(involvedBookings),
    bookings.countDocuments({ status: "Pending", studioId: { $in: studioIds } }),
    bookings.countDocuments({ status: "Confirmed", ...involvedBookings }),
    bookings
      .find(involvedBookings)
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray(),
  ]);
  const activities: DashboardActivity[] = recent.map((booking) => ({
    id: booking._id!.toString(),
    studioId: booking.studioId,
    studioTitle: booking.studioTitle,
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    totalAmount: booking.totalAmount,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
    role: booking.customerId === userId ? "customer" : "host",
  }));
  return {
    stats: {
      totalListings: userStudios.length,
      activeListings: userStudios.filter((studio) => studio.status === "published").length,
      totalBookings,
      pendingBookings,
      confirmedBookings,
    },
    recentActivity: activities,
  };
}
