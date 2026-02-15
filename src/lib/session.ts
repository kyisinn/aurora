import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function ensureUser() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error("Unauthorized");
  }

  // Find or create user in our database
  let user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { clerkUserId },
      select: { id: true },
    });
  }

  return { userId: user.id, clerkUserId };
}