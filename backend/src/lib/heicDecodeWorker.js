// Runs in a short-lived worker thread: decodes a HEIC image to raw RGBA pixels.
// libheif (WebAssembly) never returns memory to the system, so it lives only as long
// as this worker; the parent terminates the worker after one image.
import { parentPort, workerData } from "worker_threads";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const decodeHeic = require("heic-decode");

const fail = (code, message) => parentPort.postMessage({ error: { code, message } });

try {
  const images = await decodeHeic.all({ buffer: Buffer.from(workerData.buffer) });
  const primary = images?.[0];

  if (!primary) {
    fail("UNREADABLE_IMAGE", "The HEIC file contains no image.");
  } else if (primary.width * primary.height > workerData.maxPixels) {
    // Checked before decoding, so oversized photos never allocate their pixel buffer.
    fail("TOO_LARGE_DIMENSIONS", "The image dimensions are too large. Please use a smaller photo.");
  } else {
    const decoded = await primary.decode(); // orientation (irot/imir) is applied by libheif
    const view = decoded.data;
    parentPort.postMessage(
      {
        width: decoded.width,
        height: decoded.height,
        data: view.buffer,
        byteOffset: view.byteOffset,
        byteLength: view.byteLength,
      },
      [view.buffer]
    );
  }
} catch (error) {
  fail("UNREADABLE_IMAGE", `The HEIC image cannot be read (${error?.message || "decode error"}).`);
}
