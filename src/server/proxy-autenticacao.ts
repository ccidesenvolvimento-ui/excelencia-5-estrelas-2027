/**
 * Modelo do proxy de autenticação — usado SOMENTE no build Node do Next.js 16.
 *
 * Copiar para src/proxy.ts antes de 'next build' em modo Node.
 * NÃO instalar em builds com output: export (GitHub Pages).
 *
 * Cloudflare Access permanece obrigatório e Supabase Auth não substitui
 * autorização por filial (RLS), a ser implementada em outra etapa.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const rotasPublicas = new Set(["/", "/login", "/motorista"]);
const recursosPublicos = new Set([
  "/favicon.ico", "/favicon.png", "/apple-touch-icon.png",
  "/robots.txt", "/sitemap.xml", "/manifest.webmanifest",
]);

function publica(pathname: string) {
  const caminho = pathname.replace(/\/+$/, "") || "/";
  return rotasPublicas.has(caminho) ||
    caminho.startsWith("/motorista/") ||
    caminho.startsWith("/_next/") ||
    recursosPublicos.has(caminho) ||
    /\.(?:png|jpe?g|webp|gif|ico|svg|woff2?|ttf|css|js|map|txt)$/i.test(caminho);
}

function naoAutorizado(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ erro: "Autenticação necessária." }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

function configuracaoValida() {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave?.startsWith("sb_publishable_")) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    return { url: parsed.toString(), chave };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  // A versão demonstrativa continua funcionando até a ativação autorizada.
  if (process.env.EXCELENCIA_AUTH_GUARD_ENABLED !== "true") {
    return NextResponse.next({ request });
  }
  if (publica(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

  const config = configuracaoValida();
  // Fail closed: flag ligada sem configuração NÃO deixa abrir área restrita.
  if (!config) return naoAutorizado(request);

  let resposta = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.chave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaDefinir) {
        // Propaga tokens renovados tanto no request atual quanto no browser.
        cookiesParaDefinir.forEach(({ name, value }) => request.cookies.set(name, value));
        resposta = NextResponse.next({ request });
        cookiesParaDefinir.forEach(({ name, value, options }) => {
          resposta.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    // getUser consulta Auth remotamente; não confia em sessão local não verificada.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return naoAutorizado(request);
    return resposta;
  } catch {
    return naoAutorizado(request);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
