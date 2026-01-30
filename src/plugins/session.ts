import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import ConnectPgSimple from 'connect-pg-simple';
import { config } from '../config/index.js';

export default fp(
  async (fastify) => {
    await fastify.register(cookie);

    // connect-pg-simple expects an express-session-like constructor.
    // The cast is a known TypeScript workaround for Fastify session compatibility.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PgStore = ConnectPgSimple(session as any);

    await fastify.register(session, {
      secret: config.SESSION_SECRET,
      cookieName: config.SESSION_NAME,
      cookie: {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: config.SESSION_MAX_AGE,
        path: '/',
      },
      saveUninitialized: false,
      store: new PgStore({
        conString: config.DATABASE_URL,
        createTableIfMissing: true,
        tableName: 'http_sessions',
        pruneSessionInterval: 900, // Clean expired sessions every 15 min
      }),
    });
  },
  { name: 'session-plugin' },
);
