/**
 * Instalação explícita SOMENTE em build Next.js Node com proxy de autenticação.
 * Não colocar este arquivo em src/app durante export estático do GitHub Pages.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export { GET, POST } from "@/server/api-ajustes-notas";
