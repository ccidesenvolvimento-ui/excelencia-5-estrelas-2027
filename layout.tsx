import type { Metadata } from "next";
import { Navegacao } from "@/components/Navegacao";
import "./globals.css";
import "./modulos.css";

export const metadata: Metadata = {
  title:"Excelência 5 Estrelas 2027 | Demonstração",
  description:"Demonstração funcional de navegação do Programa Excelência 5 Estrelas 2027. Dados fictícios.",
  icons:{
    icon:[
      {url:"/favicon.ico",sizes:"any"},
      {url:"/favicon.png",type:"image/png",sizes:"512x512"}
    ],
    apple:[{url:"/apple-touch-icon.png",sizes:"180x180",type:"image/png"}],
    shortcut:["/favicon.ico"]
  }
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="pt-BR"><body><Navegacao>{children}</Navegacao></body></html>;
}
