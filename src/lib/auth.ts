import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SECRET_KEY = new TextEncoder().encode("sua-chave-secreta-super-secreta");

export async function createSession(userId: string) {
  const jwt = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d") // Sessão dura 7 dias
    .sign(SECRET_KEY);

  cookies().set("session", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: "/",
  });
}

export async function verifySession() {
  const cookie = cookies().get("session")?.value;
  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(cookie, SECRET_KEY);
    return payload.userId as string;
  } catch (error) {
    return null;
  }
}

export function logout() {
  cookies().delete("session");
  redirect("/login");
}