import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Excelência 5 Estrelas 2027 | Expresso Nepomuceno",
  description: "Sistema de avaliação e reconhecimento — ambiente inicial de desenvolvimento",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
