import { Request } from 'express';
import { TenantRequiredError } from '../application/project/errors/project.errors.js';

const UUID_V4_OR_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function tenantIdFromRequest(req: Request): string {
  const raw = req.header('x-tenant-id');
  if (!raw || !UUID_V4_OR_UUID_PATTERN.test(raw)) throw new TenantRequiredError();
  return raw;
}
