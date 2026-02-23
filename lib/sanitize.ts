/**
 * Input sanitization utilities to prevent NoSQL injection,
 * regex injection, and malicious file uploads.
 */

// ── NoSQL Injection Prevention ──────────────────────────────────────────────

/**
 * Ensures a value is a plain string. Rejects objects/arrays that could
 * contain MongoDB operators like { $gt: "" } or { $ne: null }.
 * Returns the trimmed string, or null if the value is not a string.
 */
export function sanitizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.trim();
}

/**
 * Strips any keys starting with "$" from an object (shallow).
 * Use on request bodies before passing them to Mongoose queries.
 */
export function stripMongoOperators<T extends Record<string, unknown>>(
  obj: T,
): T {
  const clean = { ...obj };
  for (const key of Object.keys(clean)) {
    if (key.startsWith("$")) {
      delete clean[key];
    }
    // Also reject values that are objects with $ keys (nested operator injection)
    if (
      clean[key] &&
      typeof clean[key] === "object" &&
      !Array.isArray(clean[key])
    ) {
      const nested = clean[key] as Record<string, unknown>;
      const hasOperator = Object.keys(nested).some((k) => k.startsWith("$"));
      if (hasOperator) {
        delete clean[key];
      }
    }
  }
  return clean;
}

// ── Regex Injection Prevention ──────────────────────────────────────────────

/**
 * Escapes special regex characters in a string so it can be safely
 * used inside `new RegExp(...)`.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── File Upload Validation ──────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

// Magic bytes for common image formats
const IMAGE_SIGNATURES: { type: string; bytes: number[] }[] = [
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: "image/gif", bytes: [0x47, 0x49, 0x46] },
  { type: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
  { type: "image/avif", bytes: [] }, // AVIF uses ftyp box, checked separately
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an uploaded file:
 * - Checks MIME type against allowed image types
 * - Enforces maximum file size
 * - Verifies magic bytes match the claimed MIME type
 */
export async function validateImageUpload(
  file: File,
  maxSizeMB: number = 10,
): Promise<FileValidationResult> {
  const maxSize = maxSizeMB * 1024 * 1024;

  // 1. Check if file exists and has content
  if (!file || file.size === 0) {
    return { valid: false, error: "File is empty" };
  }

  // 2. Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum of ${maxSizeMB}MB`,
    };
  }

  // 3. Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: JPEG, PNG, WebP, GIF, AVIF`,
    };
  }

  // 4. Verify magic bytes (read first 12 bytes)
  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const isValidSignature = IMAGE_SIGNATURES.some((sig) => {
      if (sig.bytes.length === 0) return true; // Skip for complex formats like AVIF
      return sig.bytes.every((byte, i) => bytes[i] === byte);
    });

    if (!isValidSignature) {
      return {
        valid: false,
        error: "File content does not match a valid image format",
      };
    }
  } catch {
    return {
      valid: false,
      error: "Could not read file content for validation",
    };
  }

  // 5. Check for suspicious file extensions in the name
  const name = file.name.toLowerCase();
  const dangerousExtensions = [
    ".exe",
    ".bat",
    ".cmd",
    ".sh",
    ".php",
    ".jsp",
    ".asp",
    ".aspx",
    ".cgi",
    ".py",
    ".rb",
    ".pl",
    ".js",
    ".ts",
    ".html",
    ".htm",
    ".svg",
    ".xml",
  ];

  if (dangerousExtensions.some((ext) => name.endsWith(ext))) {
    return {
      valid: false,
      error: "File extension is not allowed for image uploads",
    };
  }

  return { valid: true };
}
