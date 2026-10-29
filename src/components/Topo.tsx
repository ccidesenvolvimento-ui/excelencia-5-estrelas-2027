import Image from "next/image";
import Link from "next/link";
export function Topo() {
  return <header className="topo">
    <Link href="/" className="marca" aria-label="Início — Programa 5 Estrelas 2027">
      <Image src="/marca-programa.png" alt="Programa 5 Estrelas 2027 — Expresso Nepomuceno" width={240} height={78} priority />
    </Link>
    <nav aria-label="Menu principal">
      <Link href="/">Visão geral</Link>
      <Link href="/importacoes">Importações</Link>
    </nav>
    <span className="etiqueta">Ambiente inicial · v0.1</span>
  </header>;
}
