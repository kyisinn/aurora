import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Pass the URL string directly to the adapter instead of creating a separate pool
const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Initialize the client with the adapter
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;