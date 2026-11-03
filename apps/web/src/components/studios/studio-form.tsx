"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, LoaderCircle, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { StudioButton } from "@/components/ui/studio-button";
import { apiClient } from "@/lib/api-client";
import { AMENITIES, STUDIO_CATEGORIES, type Studio } from "@/lib/studios";

const schema = z.object({
  title: z.string().trim().min(3, "Add a clear title.").max(120),
  category: z.enum(STUDIO_CATEGORIES, { error: "Choose a category." }),
  hourlyRate: z.number().min(1, "Rate must be at least $1.").max(100_000),
  securityDeposit: z.number().min(0).max(1_000_000),
  maxCapacity: z.number().int().min(1, "Capacity must be at least 1.").max(10_000),
  location: z.string().trim().min(2, "Add a location.").max(200),
  imageUrl: z.string().url("Upload an image or enter a valid image URL."),
  amenities: z.array(z.string()).max(30),
  description: z.string().trim().min(20, "Add at least 20 characters.").max(10_000),
});

type FormValues = z.infer<typeof schema>;

const fieldClass =
  "mt-2 h-12 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-sm outline-none transition placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent)/.12)]";
const labelClass = "block text-sm font-semibold";

function toValues(studio: Studio): FormValues {
  return {
    title: studio.title,
    category: studio.category as (typeof STUDIO_CATEGORIES)[number],
    hourlyRate: studio.hourlyRate,
    securityDeposit: studio.securityDeposit,
    maxCapacity: studio.maxCapacity,
    location: studio.location,
    imageUrl: studio.imageUrl,
    amenities: studio.amenities,
    description: studio.description,
  };
}

export function StudioForm({ studioId }: { studioId?: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loadingStudio, setLoadingStudio] = useState(Boolean(studioId));
  const [loadError, setLoadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      category: undefined,
      hourlyRate: 75,
      securityDeposit: 0,
      maxCapacity: 4,
      location: "",
      imageUrl: "",
      amenities: [],
      description: "",
    },
  });
  const imageUrl = useWatch({ control, name: "imageUrl" });
  const selectedAmenities = useWatch({ control, name: "amenities" });

  useEffect(() => {
    if (!studioId) return;
    let active = true;
    apiClient
      .get<{ studio: Studio }>(`/studios/${encodeURIComponent(studioId)}`)
      .then(({ data }) => {
        if (active) reset(toValues(data.studio));
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoadingStudio(false);
      });
    return () => {
      active = false;
    };
  }, [reset, studioId]);

  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Images must be 10 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const { data } = await apiClient.post<{ imageUrl: string }>("/studios/upload-image", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setValue("imageUrl", data.imageUrl, { shouldValidate: true, shouldDirty: true });
      toast.success("Image uploaded.");
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        typeof error.response.data === "object" &&
        error.response.data !== null &&
        "error" in error.response.data &&
        typeof error.response.data.error === "string"
          ? error.response.data.error
          : "Image upload failed. Try again or use an image URL.";
      toast.error(message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (studioId) {
        await apiClient.patch(`/studios/${encodeURIComponent(studioId)}`, values);
        toast.success("Studio listing updated.");
      } else {
        await apiClient.post("/studios", values);
        toast.success("Your studio is live.");
      }
      router.push("/my-listings");
      router.refresh();
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "response" in error
          ? (error.response as { status?: number } | undefined)?.status
          : undefined;
      if (status === 403) toast.error("You can only edit your own studio listings.");
      else if (status === 404) toast.error("This studio listing no longer exists.");
      else toast.error("Could not save your studio. Check the form and try again.");
    }
  });

  if (loadingStudio) return <LoadingState label="Loading your studio details" />;
  if (loadError) {
    return (
      <ErrorState
        title="Studio details unavailable"
        message="The studio may not exist, or you may not have permission to edit it."
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <section className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-8">
        <div className="mb-7">
          <h2 className="font-heading text-xl font-semibold tracking-tight">Give your space a name</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Help creators picture the kind of work they can do here.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <label className={labelClass}>
            Studio title
            <input {...register("title")} placeholder="The North Light Studio" className={fieldClass} />
            {errors.title && <span className="mt-1 block text-xs text-destructive">{errors.title.message}</span>}
          </label>
          <label className={labelClass}>
            Category
            <select {...register("category")} className={fieldClass}>
              <option value="">Choose a category</option>
              {STUDIO_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
            {errors.category && <span className="mt-1 block text-xs text-destructive">{errors.category.message}</span>}
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Location
            <input {...register("location")} placeholder="Neighborhood, city" className={fieldClass} />
            {errors.location && <span className="mt-1 block text-xs text-destructive">{errors.location.message}</span>}
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Description
            <textarea
              {...register("description")}
              rows={5}
              placeholder="Tell creators what makes this space special, what kind of projects it suits, and what they can expect on arrival."
              className="mt-2 w-full resize-y rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent)/.12)]"
            />
            <span className="mt-1 block text-xs font-normal text-[hsl(var(--muted-foreground))]">
              At least 20 characters.
            </span>
            {errors.description && <span className="mt-1 block text-xs text-destructive">{errors.description.message}</span>}
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-8">
        <div className="mb-7">
          <h2 className="font-heading text-xl font-semibold tracking-tight">A picture sets the scene</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Upload a clear photo of the space, or paste a hosted image URL.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1.15fr)_minmax(230px,.85fr)]">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => void uploadImage(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-5 text-center transition hover:border-[hsl(var(--accent))] disabled:opacity-60"
            >
              {uploading ? <LoaderCircle size={25} className="animate-spin text-[hsl(var(--accent))]" /> : <UploadCloud size={25} className="text-[hsl(var(--accent))]" />}
              <span className="mt-3 text-sm font-semibold">{uploading ? "Uploading image…" : "Choose an image"}</span>
              <span className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">JPEG, PNG, WebP or GIF · up to 10 MB</span>
            </button>
            <label className="mt-4 block text-sm font-semibold">
              Or image URL
              <input {...register("imageUrl")} placeholder="https://…" className={fieldClass} />
              {errors.imageUrl && <span className="mt-1 block text-xs text-destructive">{errors.imageUrl.message}</span>}
            </label>
          </div>
          <div className="relative min-h-48 overflow-hidden rounded-2xl bg-[hsl(var(--muted))]">
            {imageUrl ? (
              <Image src={imageUrl} alt="Studio listing preview" fill unoptimized sizes="(max-width: 640px) 100vw, 360px" className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[hsl(var(--muted-foreground))]">
                <ImagePlus size={24} />
                <span className="text-xs">Your photo preview</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-8">
        <div className="mb-7">
          <h2 className="font-heading text-xl font-semibold tracking-tight">The useful details</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Clear pricing and capacity make it easier for everyone to plan.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <label className={labelClass}>
            Hourly rate <span className="font-normal text-[hsl(var(--muted-foreground))]">($)</span>
            <input type="number" min="1" step="1" {...register("hourlyRate", { valueAsNumber: true })} className={fieldClass} />
            {errors.hourlyRate && <span className="mt-1 block text-xs text-destructive">{errors.hourlyRate.message}</span>}
          </label>
          <label className={labelClass}>
            Security deposit <span className="font-normal text-[hsl(var(--muted-foreground))]">($)</span>
            <input type="number" min="0" step="1" {...register("securityDeposit", { valueAsNumber: true })} className={fieldClass} />
            {errors.securityDeposit && <span className="mt-1 block text-xs text-destructive">{errors.securityDeposit.message}</span>}
          </label>
          <label className={labelClass}>
            Max capacity <span className="font-normal text-[hsl(var(--muted-foreground))]">(people)</span>
            <input type="number" min="1" step="1" {...register("maxCapacity", { valueAsNumber: true })} className={fieldClass} />
            {errors.maxCapacity && <span className="mt-1 block text-xs text-destructive">{errors.maxCapacity.message}</span>}
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-8">
        <div className="mb-6">
          <h2 className="font-heading text-xl font-semibold tracking-tight">What does your space include?</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Choose everything that creators can use during their booking.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AMENITIES.map((amenity) => (
            <label key={amenity} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[hsl(var(--border))] px-3.5 text-sm transition hover:bg-[hsl(var(--surface))]">
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...selectedAmenities, amenity]
                    : selectedAmenities.filter((item) => item !== amenity);
                  setValue("amenities", next, { shouldDirty: true, shouldValidate: true });
                }}
                className="size-4 accent-[hsl(var(--accent))]"
              />
              {amenity}
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <StudioButton type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </StudioButton>
        <StudioButton type="submit" disabled={isSubmitting || uploading} className="min-w-44">
          {isSubmitting && <LoaderCircle size={17} className="animate-spin" />}
          {studioId ? "Save changes" : "Publish studio"}
        </StudioButton>
      </div>
    </form>
  );
}
