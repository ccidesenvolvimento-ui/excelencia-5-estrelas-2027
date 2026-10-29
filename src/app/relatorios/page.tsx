"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
export default function RelatoriosAntigos(){const router=useRouter();useEffect(()=>{router.replace("/ranking")},[router]);return <main className="painel"><h1>Relatórios integrados ao Ranking</h1><p>Selecione os filtros e use o botão Gerar relatório na página do Ranking.</p><Link className="botao" href="/ranking">Abrir Ranking</Link></main>}
