import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'warn', 'error']
      : ['warn', 'error'],
});

// Graceful shutdown
const shutdown = async () => {
  await prisma.$disconnect();
};

process.on('beforeExit', shutdown);
