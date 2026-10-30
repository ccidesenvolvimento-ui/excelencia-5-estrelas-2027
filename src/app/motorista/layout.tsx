import type {Metadata} from "next";
import type {ReactNode} from "react";

const basePath=process.env.NEXT_PUBLIC_DEPLOY_TARGET==="github-pages"?"/excelencia-5-estrelas-2027":"";

export const metadata:Metadata={
  title:"Meu desempenho | Programa 5 Estrelas 2027",
  description:"Portal demonstrativo de consulta individual de pontuação e classificação no Programa 5 Estrelas.",
  manifest:`${basePath}/motorista/manifest.webmanifest`,
  appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"Meu 5 Estrelas"},
  icons:{icon:[{url:`${basePath}/motorista/pwa-192.png`,sizes:"192x192",type:"image/png"},{url:`${basePath}/motorista/pwa-512.png`,sizes:"512x512",type:"image/png"}],apple:[{url:`${basePath}/apple-touch-icon.png`,sizes:"180x180",type:"image/png"}]},
  robots:{index:false,follow:false},
};

export default function LayoutMotorista({children}:{children:ReactNode}){return children;}
