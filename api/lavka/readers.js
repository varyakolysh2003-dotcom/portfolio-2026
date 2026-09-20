import { createReadersApi } from '../../scripts/readers-api.mjs';
import { redisReaderStore } from '../../scripts/readers-redis.mjs';

// Vercel discovers this route separately from the static dist/ output.
// Never use a local file here: function filesystems are not a shared database.
export default createReadersApi(undefined, { store: redisReaderStore });
