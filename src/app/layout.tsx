import type { Metadata } from "next";
import { Navegacao } from "@/components/Navegacao";
import "./globals.css";
import "./modulos.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title:"Excelência 5 Estrelas 2027 | Demonstração",
  description:"Demonstração funcional de navegação do Programa Excelência 5 Estrelas 2027. Dados fictícios.",
  icons:{
    icon:[
      {url:`${basePath}/favicon.ico`,sizes:"any"},
      {url:`${basePath}/favicon.png`,type:"image/png",sizes:"512x512"}
    ],
    apple:[{url:`${basePath}/apple-touch-icon.png`,sizes:"180x180",type:"image/png"}],
    shortcut:[`${basePath}/favicon.ico`]
  }
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="pt-BR"><body><Navegacao>{children}</Navegacao></body></html>;
}
