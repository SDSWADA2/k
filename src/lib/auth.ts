import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { Role, User } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "bengkel_super_secret_jwt_key_2026_xyz"
);

const COOKIE_NAME = "kasir_session_token";

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return await bcrypt.compare(password, hashed);
}

export async function createSessionToken(user: { id: string; email: string; name: string; role: Role }): Promise<string> {
  return await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<{ id: string; email: string; name: string; role: Role } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as { id: string; email: string; name: string; role: Role };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<{ id: string; email: string; name: string; role: Role } | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export function canAccess(userRole: Role, allowedRoles: Role[]): boolean {
  if (userRole === "OWNER") return true; // Owner can access everything
  return allowedRoles.includes(userRole);
}

export { COOKIE_NAME };
