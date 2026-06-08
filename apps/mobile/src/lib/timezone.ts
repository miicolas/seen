// The IANA timezone the device is set to (e.g. "Europe/Paris"). Analytics windows
// are computed server-side from this so "this week" matches the user's calendar,
// not the server's. Falls back to UTC if the runtime can't resolve a zone.
export function getDeviceTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && tz.length > 0 ? tz : "UTC";
  } catch {
    return "UTC";
  }
}
