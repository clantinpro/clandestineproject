/**
 * Centralized API configuration.
 * Ganti BASE_URL di sini kalau backend pindah, semua route otomatis ikut.
 *
 * NOTE: Tidak pakai NEXT_PUBLIC_ prefix karena hanya dipakai di server-side
 * API routes. Dengan begini, env var bisa di-inject saat `docker run` (runtime),
 * bukan hanya saat `docker build` (build time).
 */
export const API_BASE_URL = process.env.API_BASE_URL || "http://103.245.181.5:5001";
