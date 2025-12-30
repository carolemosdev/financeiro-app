import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode("sua-chave-secreta-super-secreta");

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  // Rotas que não precisam de login
  const publicRoutes = ["/login", "/register", "/onboarding"];

  // Se a rota for pública, deixa passar
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Se não tiver sessão e tentar acessar rota protegida, manda pro login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Verifica se o token é válido
    await jwtVerify(session, SECRET_KEY);
    return NextResponse.next();
  } catch (error) {
    // Se o token for inválido, manda pro login
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Configura em quais rotas o middleware vai rodar (basicamente tudo, menos arquivos estáticos)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};