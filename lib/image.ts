// Browser-only image compression. Downscales to a max edge and re-encodes as
// JPEG so we don't upload 10 MB phone photos. ONLY import this from Client
// Components — it uses canvas / createImageBitmap.
//
// Some formats (notably HEIC from iPhones) can't be decoded by every browser's
// canvas. When decoding fails we throw ImageDecodeError so the caller can fall
// back to uploading the original file as-is (subject to the size cap).

import {
  IMAGE_JPEG_QUALITY,
  MAX_IMAGE_DIMENSION,
} from "@/lib/upload-limits"

export class ImageDecodeError extends Error {
  constructor() {
    super("Could not read this image")
    this.name = "ImageDecodeError"
  }
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // Preferred path: respects EXIF orientation in modern browsers.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, {
        imageOrientation: "from-image",
      })
    } catch {
      // fall through to <img> decode
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } catch {
    throw new ImageDecodeError()
  } finally {
    URL.revokeObjectURL(url)
  }
}

function dimensions(source: ImageBitmap | HTMLImageElement): {
  width: number
  height: number
} {
  const width =
    source instanceof HTMLImageElement ? source.naturalWidth : source.width
  const height =
    source instanceof HTMLImageElement ? source.naturalHeight : source.height
  return { width, height }
}

/**
 * Returns a compressed JPEG Blob for the given image file.
 * Throws ImageDecodeError if the browser can't decode the image.
 */
export async function compressImage(file: File): Promise<Blob> {
  const source = await decode(file)
  const { width, height } = dimensions(source)

  if (!width || !height) {
    throw new ImageDecodeError()
  }

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height))
  const targetW = Math.round(width * scale)
  const targetH = Math.round(height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new ImageDecodeError()
  ctx.drawImage(source, 0, 0, targetW, targetH)

  if (source instanceof ImageBitmap) source.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", IMAGE_JPEG_QUALITY),
  )
  if (!blob) throw new ImageDecodeError()
  return blob
}
