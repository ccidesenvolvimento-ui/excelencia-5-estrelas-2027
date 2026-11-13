// Template Node opt-in: criado como src/app/api/ranking-efetivo/route.ts apenas no runner.
// O Next.js exige runtime e dynamic como declarações locais, não reexports.
export const runtime="nodejs";
export const dynamic="force-dynamic";
export { GET } from "@/server/api-ranking-efetivo";
