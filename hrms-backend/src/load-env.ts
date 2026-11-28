import * as dotenv from 'dotenv';
import { resolve } from 'path';

/**
 * Loads the service-local .env with override BEFORE any other module reads
 * process.env. Import this as the FIRST import in entry points.
 * Reason: sandbox hosts export a conflicting global DATABASE_URL; production
 * deployments may too — the service must always use its own configuration.
 */
dotenv.config({ override: true, path: resolve(process.cwd(), '.env') });
