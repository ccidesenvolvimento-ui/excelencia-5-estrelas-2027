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
import { permissaoParaRota } from "@/lib/permissoes-rotas";

const rotasPublicas = new Set([
  "/", "/login", "/recuperar-senha", "/definir-senha", "/auth/confirm",
]);
const recursosPublicos = new Set([
  "/favicon.ico", "/favicon.png", "/apple-touch-icon.png",
  "/robots.txt", "/sitemap.xml", "/manifest.webmanifest",
  "/marca-programa.png", "/estrela-oficial-5-estrelas.png",
]);

function publica(pathname: string) {
  const caminho = pathname.replace(/\/+$/, "") || "/";
  // Endpoints de API sempre passam pela verificação de identidade.
  if (caminho === "/api" || caminho.startsWith("/api/")) return false;
  return rotasPublicas.has(caminho) ||
    caminho.startsWith("/_next/") ||
    recursosPublicos.has(caminho);
}

function naoAutorizado(request: NextRequest) {
  if (request.nextUrl.pathname === "/api" || request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ erro: "Autenticação necessária." }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

function requisicaoDePaginaHtml(request: NextRequest) {
  return request.headers.get("sec-fetch-dest") === "document" ||
    request.headers.get("accept")?.includes("text/html") === true;
}

function paginaAcessoNegado() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Acesso não autorizado | Excelência 5 Estrelas 2027</title>
  <style>
    :root { color-scheme: dark; font-family: "Segoe UI", Arial, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; color: #eff7ff; background: radial-gradient(ellipse at 80% 0%, #133e60 0, transparent 51%), #071526; }
    main { width: min(100%, 590px); padding: clamp(28px, 6vw, 48px); border: 1px solid #78b8df59; border-radius: 22px; background: radial-gradient(ellipse at 100% 0, #20577855, transparent 60%), linear-gradient(140deg, #12273cf5, #0b1626f5); box-shadow: inset 0 1px #d5f0ff24, 0 26px 75px #01061170; }
    .marca { margin: 0 0 34px; color: #b5dff2; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    .codigo { display: inline-flex; align-items: center; gap: 9px; margin-bottom: 18px; color: #f4c77b; font-size: 11px; font-weight: 700; letter-spacing: .12em; }
    .codigo::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: #f4c77b; box-shadow: 0 0 0 4px #f4c77b1f; }
    h1 { margin: 0 0 18px; font-size: clamp(30px, 7vw, 44px); font-weight: 500; line-height: 1.1; letter-spacing: -.04em; }
    p { margin: 0; color: #b2c7d7; font-size: 16px; line-height: 1.7; }
    .acoes { margin-top: 34px; padding-top: 24px; border-top: 1px solid #9cbbd12e; }
    a { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; padding: 0 20px; border: 1px solid #99ddff7a; border-radius: 9px; color: #dcf5ff; background: linear-gradient(110deg, #173f5b, #1d506d); font-size: 14px; font-weight: 600; text-decoration: none; }
    a:hover { border-color: #b7ebff; }
    a:focus-visible { outline: 2px solid #b1e9ff; outline-offset: 4px; }
  </style>
</head>
<body>
  <main aria-labelledby="titulo-acesso-negado">
    <p class="marca">Programa Excelência 5 Estrelas 2027</p>
    <span class="codigo">ACESSO NEGADO · 403</span>
    <h1 id="titulo-acesso-negado">Acesso não autorizado.</h1>
    <p>Sua conta não possui permissão para acessar esta área.</p>
    <div class="acoes"><a href="/login">Retornar à página de login</a></div>
  </main>
</body>
</html>`;
}

function acessoCorporativoNegado(request: NextRequest, mensagemJson: string) {
  const caminho = request.nextUrl.pathname;
  const rotaApi = caminho === "/api" || caminho.startsWith("/api/");

  if (!rotaApi && requisicaoDePaginaHtml(request)) {
    return new NextResponse(paginaAcessoNegado(), {
      status: 403,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return NextResponse.json(
    { erro: mensagemJson },
    { status: 403, headers: { "Cache-Control": "no-store" } }
  );
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

    // Permissões corporativas são consultadas no Supabase.
    // Uma sessão válida, sozinha, não concede acesso às páginas.
    const permissaoExigida = permissaoParaRota(
      request.nextUrl.pathname
    );

    // Rotas corporativas não cadastradas são negadas por padrão.
    // APIs e Portal do Motorista preservam seu tratamento atual.
    const caminho = request.nextUrl.pathname;
    const rotaApi =
      caminho === "/api" || caminho.startsWith("/api/");
    const rotaMotorista =
      caminho === "/motorista" || caminho.startsWith("/motorista/");

    if (!permissaoExigida && !rotaApi && !rotaMotorista) {
      return acessoCorporativoNegado(
        request,
        "Rota corporativa não autorizada."
      );
    }

    if (permissaoExigida) {
      const negarAcesso = () =>
        acessoCorporativoNegado(
          request,
          "Acesso corporativo não autorizado."
        );

      const { data: perfil, error: erroPerfil } =
        await supabase
          .from("perfis")
          .select("usuario_id")
          .eq("usuario_id", data.user.id)
          .eq("ativo", true)
          .maybeSingle();

      if (erroPerfil || !perfil) return negarAcesso();

      const [resultadoFiliais, resultadoPermissoes] =
        await Promise.all([
          supabase
            .from("filiais_usuario")
            .select("filial_id")
            .eq("usuario_id", data.user.id)
            .limit(1),

          supabase
            .from("permissoes_usuario")
            .select("permissao")
            .eq("usuario_id", data.user.id)
            .eq("permissao", permissaoExigida)
            .limit(1),
        ]);

      if (
        resultadoFiliais.error ||
        !resultadoFiliais.data?.length ||
        resultadoPermissoes.error ||
        !resultadoPermissoes.data?.length
      ) {
        return negarAcesso();
      }
    }

    return resposta;
  } catch {
    return naoAutorizado(request);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
