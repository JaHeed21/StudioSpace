"use client";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  return <DashboardHome />;
}

function DashboardHome() {
  const { user } = useAuth();
  return <DashboardOverview name={user?.name ?? "Creator"} />;
}
