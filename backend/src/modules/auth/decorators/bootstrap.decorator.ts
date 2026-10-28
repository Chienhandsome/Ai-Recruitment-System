import { SetMetadata } from '@nestjs/common';
import { BOOTSTRAP_ROUTE_KEY } from '../auth.constants';

/**
 * Marks the real bootstrap handler. RolesGuard skips the DB-record, status
 * and role checks ONLY for handlers carrying this metadata, because a
 * Supabase user without a DB record cannot pass them yet. Never identify
 * bootstrap by URL substring: request.url includes the query string.
 */
export const Bootstrap = () => SetMetadata(BOOTSTRAP_ROUTE_KEY, true);
