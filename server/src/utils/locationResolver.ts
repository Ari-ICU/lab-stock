import { query } from '../config/database.js';
import { isValidUuid } from '../validations/commonValidation.js';

interface LocationLookupRow {
  id: string;
  code: string;
  name: string;
  room: string;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolve a classroom/location UUID from a UUID, room code (e.g. "LOC-102"),
 * room label ("Room 102B"), name ("Hardware Staging & Maintenance Depot"),
 * or combined display label ("Name (Room)").
 * Returns null for empty or "Unassigned" inputs.
 */
export async function resolveLocationId(input?: string | null): Promise<string | null> {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.toLowerCase() === 'unassigned') return null;

  if (isValidUuid(trimmed)) {
    const byId = await query('SELECT id FROM locations WHERE id = $1 LIMIT 1', [trimmed]);
    if (byId.rows[0]) return byId.rows[0].id;
  }

  const res = await query('SELECT id, code, name, room FROM locations');
  const rows: LocationLookupRow[] = res.rows;
  const lower = trimmed.toLowerCase();

  // 1. Exact matches (code, room, name, or "Name (Room)")
  for (const loc of rows) {
    const codeLower = (loc.code || '').trim().toLowerCase();
    const roomLower = (loc.room || '').trim().toLowerCase();
    const nameLower = (loc.name || '').trim().toLowerCase();
    const combinedLower = `${nameLower} (${roomLower})`;
    if (
      (codeLower && lower === codeLower) ||
      (roomLower && lower === roomLower) ||
      (nameLower && lower === nameLower) ||
      (nameLower && roomLower && lower === combinedLower)
    ) {
      return loc.id;
    }
  }

  // 2. Room token word-boundary match, longest room key first so "102B" beats "102"
  const sortedByRoom = [...rows].sort((a, b) => (b.room || '').length - (a.room || '').length);
  for (const loc of sortedByRoom) {
    const roomKey = (loc.room || '').replace(/^(rm|room)\s*/i, '').trim().toLowerCase();
    if (!roomKey) continue;
    const roomRegex = new RegExp(`\\b${escapeRegex(roomKey)}\\b`, 'i');
    if (roomRegex.test(trimmed)) {
      return loc.id;
    }
  }

  // 3. Name substring match, longest name first
  const sortedByName = [...rows].sort((a, b) => (b.name || '').length - (a.name || '').length);
  for (const loc of sortedByName) {
    const nameLower = (loc.name || '').trim().toLowerCase();
    if (nameLower && lower.includes(nameLower)) {
      return loc.id;
    }
  }

  return null;
}

/**
 * Resolve location_id from a create/update payload supporting location_id, locationId, or location label.
 */
export async function resolveLocationIdFromPayload(
  data: Record<string, any>
): Promise<{ provided: boolean; locationId: string | null }> {
  const hasLocationInput =
    data.location_id !== undefined ||
    data.locationId !== undefined ||
    data.location !== undefined;

  if (!hasLocationInput) {
    return { provided: false, locationId: null };
  }

  const rawLocation = data.location_id ?? data.locationId ?? data.location;
  const locationId = await resolveLocationId(rawLocation);
  return { provided: true, locationId };
}
