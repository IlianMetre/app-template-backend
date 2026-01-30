import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../lib/prisma.js';

interface UpdateProfileBody {
  displayName?: string;
  email?: string;
}

export async function getMeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = request.currentUser!;

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      totpEnabled: true,
      createdAt: true,
    },
  });

  if (!fullUser) {
    return reply.notFound('User not found');
  }

  return reply.send({
    ...fullUser,
    createdAt: fullUser.createdAt.toISOString(),
  });
}

export async function updateMeHandler(
  request: FastifyRequest<{ Body: UpdateProfileBody }>,
  reply: FastifyReply,
): Promise<void> {
  const user = request.currentUser!;
  const { displayName, email } = request.body;

  // Check email uniqueness if changing email
  if (email && email.toLowerCase() !== user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return reply.conflict('Email already in use');
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(displayName !== undefined && { displayName }),
      ...(email !== undefined && { email: email.toLowerCase() }),
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      totpEnabled: true,
      createdAt: true,
    },
  });

  return reply.send({
    message: 'Profile updated',
    user: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}
