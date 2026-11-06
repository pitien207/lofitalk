// Client-side preparation of a profile picture before upload: centre square crop and
// downscale (saves bandwidth; the server still validates and re-encodes everything).

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // must match the server limit
export const MAX_SOURCE_BYTES = 30 * 1024 * 1024; // larger originals are rejected before decoding
const CLIENT_SIZE = 512; // server stores 256x256; 512 keeps it sharp after re-encoding

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif)$/i;

export const AVATAR_FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

export class AvatarPrepareError extends Error {
  constructor(code, vars = {}) {
    super(code);
    this.code = code;
    this.vars = vars;
  }
}

const loadWithImageElement = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    img.src = url;
  });

// Decodes the file with EXIF orientation applied; null when the browser cannot read it.
const decodeImage = async (file) => {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close?.() };
    } catch {
      // fall through to <img>, which some browsers (e.g. Safari with HEIC) handle better
    }
  }
  try {
    return await loadWithImageElement(file);
  } catch {
    return null;
  }
};

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality));

// Returns { blob, fileName, previewUrl } ready for upload.
// previewUrl is null when the browser cannot decode the file (the original is sent instead).
export const prepareAvatarUpload = async (file) => {
  const looksSupported =
    ACCEPTED_MIME_TYPES.includes((file.type || "").toLowerCase()) ||
    ACCEPTED_EXTENSIONS.test(file.name || "");
  if (!looksSupported) {
    throw new AvatarPrepareError("unsupportedType");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new AvatarPrepareError("sourceTooLarge", { max: MAX_SOURCE_BYTES / 1024 / 1024 });
  }

  const decoded = await decodeImage(file);
  if (!decoded) {
    // e.g. HEIC in Chrome/Firefox: the server converts it, but the 5 MB limit applies.
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new AvatarPrepareError("tooLargeUndecodable");
    }
    return { blob: file, fileName: file.name || "avatar.heic", previewUrl: null };
  }

  try {
    const side = Math.min(decoded.width, decoded.height);
    const outputSize = Math.min(CLIENT_SIZE, side);
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext("2d");
    context.imageSmoothingQuality = "high";
    context.drawImage(
      decoded.source,
      (decoded.width - side) / 2,
      (decoded.height - side) / 2,
      side,
      side,
      0,
      0,
      outputSize,
      outputSize
    );

    let blob = await canvasToBlob(canvas, "image/webp", 0.9);
    if (!blob || blob.type !== "image/webp") {
      blob = await canvasToBlob(canvas, "image/jpeg", 0.9); // browsers without WebP encoding
    }
    if (!blob) {
      throw new Error("encode failed");
    }

    return {
      blob,
      fileName: blob.type === "image/webp" ? "avatar.webp" : "avatar.jpg",
      previewUrl: URL.createObjectURL(blob),
    };
  } catch {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new AvatarPrepareError("tooLargeUndecodable");
    }
    return { blob: file, fileName: file.name || "avatar", previewUrl: null };
  } finally {
    decoded.release();
  }
};
