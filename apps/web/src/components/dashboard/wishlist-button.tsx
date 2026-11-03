"use client";

import { Heart, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";

export function WishlistButton({ studioId }: { studioId: string }) {
  const router = useRouter();
  const { isAuthenticated, isPending } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    apiClient.get<{ studios: Array<{ id: string }> }>("/wishlist", { signal: controller.signal })
      .then(({ data }) => setSaved(data.studios.some((studio) => studio.id === studioId)))
      .catch(() => {
        if (!controller.signal.aborted) toast.error("Could not check your saved studios.");
      });
    return () => controller.abort();
  }, [isAuthenticated, studioId]);

  const toggle = async () => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/studios/${studioId}`)}`);
      return;
    }
    setLoading(true);
    try {
      if (saved) await apiClient.delete(`/wishlist/${encodeURIComponent(studioId)}`);
      else await apiClient.post(`/wishlist/${encodeURIComponent(studioId)}`);
      setSaved(!saved);
      toast.success(saved ? "Removed from your wishlist." : "Saved to your wishlist.");
    } catch (error) {
      const message =
        typeof error === "object" && error !== null && "response" in error
          ? ((error.response as { data?: { error?: string } } | undefined)?.data?.error)
          : undefined;
      toast.error(message ?? "Could not update your wishlist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      aria-label={saved ? "Remove studio from wishlist" : "Add studio to wishlist"}
      aria-pressed={saved}
      disabled={loading || isPending}
      onClick={() => void toggle()}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 text-xs font-semibold shadow-sm transition hover:border-[hsl(var(--accent))] disabled:opacity-55"
    >
      {loading ? <LoaderCircle size={15} className="animate-spin" /> : <Heart size={15} fill={saved ? "currentColor" : "none"} className={saved ? "text-[hsl(var(--accent))]" : ""} />}
      {saved ? "Saved" : "Save"}
    </button>
  );
}
