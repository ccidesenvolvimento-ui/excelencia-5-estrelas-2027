"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
export default function PainelAntigo(){const router=useRouter();useEffect(()=>{router.replace("/")},[router]);return <main className="painel"><h1>Painel integrado à Visão Geral</h1><p>Esta página foi consolidada na Visão Geral do sistema.</p><Link className="botao" href="/">Abrir Visão Geral</Link></main>}
