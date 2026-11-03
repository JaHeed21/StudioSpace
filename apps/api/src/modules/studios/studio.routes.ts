import { Router, type Request } from "express";
import { fileTypeFromBuffer } from "file-type";
import multer from "multer";
import { z } from "zod";
import { env } from "../../config/env.js";
import { HttpError } from "../../middleware/error-handler.js";
import { requireAuth } from "../auth/auth-session.js";
import type { createAuth } from "../auth/auth.js";
import {
  createStudio,
  deleteStudio,
  getFeaturedStudios,
  getOwnerStudios,
  getStudioById,
  listStudios,
  updateStudio,
} from "./studio.service.js";
import {
  studioIdSchema,
  studioInputSchema,
  studioPatchSchema,
  studioQuerySchema,
} from "./studio.validation.js";

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter(_request, file, callback) {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      callback(new HttpError(400, "Upload a JPEG, PNG, WebP, or GIF image."));
      return;
    }
    callback(null, true);
  },
});

type AuthInstance = ReturnType<typeof createAuth>;

function ownerFrom(request: Request) {
  const user = request.authSession?.user;
  if (!user) throw new HttpError(401, "Authentication required");
  return { id: user.id, name: user.name, email: user.email };
}

function parseId(value: string): string {
  const result = studioIdSchema.safeParse(value);
  if (!result.success) throw new HttpError(404, "Studio not found");
  return result.data;
}

function validationError(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return new HttpError(
    400,
    error.issues
      .map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`)
      .join("; "),
  );
}

function isImgBBResponse(
  value: unknown,
): value is { success: true; data: { url: string } } {
  return z
    .object({
      success: z.literal(true),
      data: z.object({ url: z.string().url().startsWith("https://") }),
    })
    .safeParse(value).success;
}

export function createStudioRouter(auth: AuthInstance) {
  const router = Router();
  const authenticated = requireAuth(auth);

  router.get("/featured", async (_request, response, next) => {
    try {
      response.json({ studios: await getFeaturedStudios() });
    } catch (error) {
      next(error);
    }
  });

  router.get("/my-listings", authenticated, async (request, response, next) => {
    try {
      const owner = ownerFrom(request);
      response.json({ studios: await getOwnerStudios(owner.id) });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/upload-image",
    authenticated,
    imageUpload.single("image"),
    async (request, response, next) => {
      try {
        if (!request.file) throw new HttpError(400, "Choose an image to upload.");
        const detectedType = await fileTypeFromBuffer(request.file.buffer);
        if (
          !detectedType ||
          !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(detectedType.mime)
        ) {
          throw new HttpError(400, "The uploaded file is not a supported image.");
        }
        if (!env.imgbbApiKey) {
          throw new HttpError(
            503,
            "Image uploads are not configured. Set IMGBB_API_KEY on the API server.",
          );
        }

        const body = new FormData();
        body.set("key", env.imgbbApiKey);
        body.set(
          "image",
          new Blob([new Uint8Array(request.file.buffer)], { type: detectedType.mime }),
          request.file.originalname,
        );

        let upload: Response;
        try {
          upload = await fetch("https://api.imgbb.com/1/upload", {
            method: "POST",
            body,
            signal: AbortSignal.timeout(20_000),
          });
        } catch {
          throw new HttpError(502, "The image host could not be reached. Please try again.");
        }

        let result: unknown;
        try {
          result = await upload.json();
        } catch {
          throw new HttpError(502, "The image host returned an invalid response.");
        }
        if (!upload.ok || !isImgBBResponse(result)) {
          throw new HttpError(502, "The image host could not accept this upload. Please try again.");
        }
        response.status(201).json({ imageUrl: result.data.url });
      } catch (error) {
        next(error);
      }
    },
  );

  router.get("/", async (request, response, next) => {
    try {
      const parsed = studioQuerySchema.safeParse(request.query);
      if (!parsed.success) throw validationError(parsed.error);
      response.json(await listStudios(parsed.data));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", authenticated, async (request, response, next) => {
    try {
      const parsed = studioInputSchema.safeParse(request.body);
      if (!parsed.success) throw validationError(parsed.error);
      response.status(201).json({
        studio: await createStudio(parsed.data, ownerFrom(request)),
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (request, response, next) => {
    try {
      response.json({ studio: await getStudioById(parseId(request.params.id ?? "")) });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id", authenticated, async (request, response, next) => {
    try {
      const parsed = studioPatchSchema.safeParse(request.body);
      if (!parsed.success) throw validationError(parsed.error);
      response.json({
        studio: await updateStudio(
          parseId(request.params.id ?? ""),
          ownerFrom(request).id,
          parsed.data,
        ),
      });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", authenticated, async (request, response, next) => {
    try {
      await deleteStudio(parseId(request.params.id ?? ""), ownerFrom(request).id);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
