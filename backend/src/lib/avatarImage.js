import path from "path";
import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import sharp from "sharp";

// Memory safety for a small (0.5 GiB) container:
// - libvips keeps no operation cache and uses one thread,
// - only one image is processed at a time, a few more may wait, the rest get "busy",
// - decoded images are capped at MAX_INPUT_PIXELS (blocks decompression bombs),
// - HEIC is decoded in a short-lived worker so its WebAssembly memory is released afterwards.
sharp.cache(false);
sharp.concurrency(1);

export const AVATAR_SIZE = 256;
export const AVATAR_WEBP_QUALITY = 80;
export const MAX_INPUT_PIXELS = 40_000_000; // e.g. 7300x5475; iPhone photos are 12-24 MP
const MAX_CONCURRENT_JOBS = 1;
const MAX_QUEUED_JOBS = 4;
const HEIC_WORKER_TIMEOUT_MS = 30_000;

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const HEIC_WORKER_PATH = path.join(currentDir, "heicDecodeWorker.js");

export class AvatarImageError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const HEIF_BRANDS = new Set(["heic", "heix", "heim", "heis", "hevc", "hevx", "mif1", "msf1"]);

// Detects the real image type from the first bytes (the client's MIME type is not trusted).
export const detectImageType = (buffer) => {
  if (!buffer || buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";

  if (
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png";
  }

  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  // ISO-BMFF: [size][ftyp][major brand][minor version][compatible brands...]
  if (buffer.toString("ascii", 4, 8) === "ftyp") {
    const boxSize = Math.min(buffer.readUInt32BE(0), buffer.length, 64);
    const brands = [buffer.toString("ascii", 8, 12)];
    for (let offset = 16; offset + 4 <= boxSize; offset += 4) {
      brands.push(buffer.toString("ascii", offset, offset + 4));
    }
    // AVIF also uses mif1; it is not an accepted upload type.
    if (brands.includes("avif") || brands.includes("avis")) return null;
    if (brands.some((brand) => HEIF_BRANDS.has(brand))) return "heic";
  }

  return null;
};

// --- tiny job queue (limits memory: one decode at a time) ---
let activeJobs = 0;
const waitingJobs = [];

const runLimited = (job) =>
  new Promise((resolve, reject) => {
    const start = () => {
      activeJobs += 1;
      Promise.resolve()
        .then(job)
        .then(resolve, reject)
        .finally(() => {
          activeJobs -= 1;
          const next = waitingJobs.shift();
          if (next) next();
        });
    };

    if (activeJobs < MAX_CONCURRENT_JOBS) {
      start();
    } else if (waitingJobs.length < MAX_QUEUED_JOBS) {
      waitingJobs.push(start);
    } else {
      reject(
        new AvatarImageError(
          "SERVER_BUSY",
          "The server is busy processing other images. Please try again in a few seconds.",
          503
        )
      );
    }
  });

const decodeHeicInWorker = (buffer) =>
  new Promise((resolve, reject) => {
    const worker = new Worker(HEIC_WORKER_PATH, {
      workerData: { buffer, maxPixels: MAX_INPUT_PIXELS },
      execArgv: [],
      resourceLimits: { maxOldGenerationSizeMb: 64 },
    });
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate().catch(() => undefined);
      fn(value);
    };
    const timer = setTimeout(
      () => finish(reject, new AvatarImageError("PROCESSING_TIMEOUT", "Image processing took too long.", 422)),
      HEIC_WORKER_TIMEOUT_MS
    );
    worker.once("message", (message) => {
      if (message?.error) {
        const status = message.error.code === "TOO_LARGE_DIMENSIONS" ? 413 : 422;
        finish(reject, new AvatarImageError(message.error.code, message.error.message, status));
      } else {
        finish(resolve, message);
      }
    });
    worker.once("error", (error) =>
      finish(reject, new AvatarImageError("UNREADABLE_IMAGE", `Could not read the HEIC image (${error.message}).`, 422))
    );
    worker.once("exit", (code) => {
      if (code !== 0) {
        finish(reject, new AvatarImageError("UNREADABLE_IMAGE", "Could not read the HEIC image.", 422));
      }
    });
  });

const toAvatarWebp = async (input, inputOptions) => {
  const { data, info } = await sharp(input, {
    limitInputPixels: MAX_INPUT_PIXELS,
    failOn: "error",
    ...inputOptions,
  })
    .rotate() // apply EXIF orientation, then the orientation tag is dropped with all metadata
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "centre" }) // centre square crop
    .webp({ quality: AVATAR_WEBP_QUALITY, effort: 4 }) // no withMetadata(): EXIF/GPS/ICC are stripped
    .toBuffer({ resolveWithObject: true });

  return { data, contentType: "image/webp", width: info.width, height: info.height };
};

const mapSharpError = (error) => {
  if (error instanceof AvatarImageError) return error;
  const message = String(error?.message || "");
  if (/pixel limit/i.test(message)) {
    return new AvatarImageError(
      "TOO_LARGE_DIMENSIONS",
      "The image dimensions are too large. Please use a smaller photo.",
      413
    );
  }
  return new AvatarImageError("UNREADABLE_IMAGE", "The image file is damaged or cannot be read.", 422);
};

// Validates and converts an uploaded file into the stored avatar format.
export const processAvatarImage = (buffer) => {
  const type = detectImageType(buffer);
  if (!type) {
    return Promise.reject(
      new AvatarImageError(
        "UNSUPPORTED_TYPE",
        "Only JPEG, PNG, WebP and HEIC images are supported.",
        415
      )
    );
  }

  return runLimited(async () => {
    try {
      if (type === "heic") {
        const raw = await decodeHeicInWorker(buffer);
        return await toAvatarWebp(Buffer.from(raw.data, raw.byteOffset, raw.byteLength), {
          raw: { width: raw.width, height: raw.height, channels: 4 },
        });
      }
      return await toAvatarWebp(buffer, {});
    } catch (error) {
      throw mapSharpError(error);
    }
  });
};
