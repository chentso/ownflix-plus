import { NextRequest } from "next/server";

const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
  "0.0.0.0",
]);

const LOCAL_IPS = new Set([
  "127.0.0.1",
  "::1",
  "::ffff:127.0.0.1",
  "localhost",
]);

/**
 * Verifies that the incoming HTTP request originates from localhost.
 * Checks both the Host / URL hostname and any forwarded IP headers.
 */
export function isLocalhostRequest(req: NextRequest): boolean {
  const hostHeader = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  const urlHostname = (req.nextUrl?.hostname || "").toLowerCase();

  const hostIsLocal =
    LOCAL_HOSTS.has(hostHeader) || LOCAL_HOSTS.has(urlHostname);

  if (!hostIsLocal) {
    return false;
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim().toLowerCase();
    if (firstIp && !LOCAL_IPS.has(firstIp)) {
      return false;
    }
  }

  const realIp = req.headers.get("x-real-ip")?.trim().toLowerCase();
  if (realIp && !LOCAL_IPS.has(realIp)) {
    return false;
  }

  return true;
}

export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}
