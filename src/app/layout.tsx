import type { Metadata } from "next";
import { Navegacao } from "@/components/Navegacao";
import "./globals.css";
export const metadata: Metadata = {title:"Excelência 5 Estrelas 2027 | Demonstração",description:"Demonstração funcional de navegação do Programa Excelência 5 Estrelas 2027. Dados fictícios."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><Navegacao>{children}</Navegacao></body></html>}
