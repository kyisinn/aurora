import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "aurora_session";

export async function ensureSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;

  if (cookie) {
    const existing = await prisma.session.findUnique({
      where: { id: cookie },
      select: { id: true },
    });
    if (existing) return { sessionId: cookie, isNew: false };
  }

  const session = await prisma.session.create({ data: {} });
  return { sessionId: session.id, isNew: true };
}

export function applySessionCookie(res: NextResponse, sessionId: string) {
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}