import type {MetadataRoute} from "next";

export default function manifest():MetadataRoute.Manifest {
  const base=process.env.NEXT_PUBLIC_DEPLOY_TARGET==="github-pages"?"/excelencia-5-estrelas-2027":"";
  return {
    id:`${base}/motorista/`,
    name:"Meu 5 Estrelas | Excelência 2027",
    short_name:"Meu 5 Estrelas",
    description:"Consulte seu desempenho demonstrativo no Programa Excelência 5 Estrelas 2027.",
    start_url:`${base}/motorista/`,
    scope:`${base}/motorista/`,
    display:"standalone",
    background_color:"#071526",
    theme_color:"#071526",
    orientation:"portrait-primary",
    lang:"pt-BR",
    icons:[
      {src:`${base}/motorista/pwa-192.png`,sizes:"192x192",type:"image/png",purpose:"any"},
      {src:`${base}/motorista/pwa-512.png`,sizes:"512x512",type:"image/png",purpose:"any"},
      {src:`${base}/motorista/pwa-maskable-512.png`,sizes:"512x512",type:"image/png",purpose:"maskable"},
    ],
  };
}
