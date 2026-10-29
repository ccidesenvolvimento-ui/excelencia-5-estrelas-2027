"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
export default function UsuariosAntigo(){const router=useRouter();useEffect(()=>{router.replace("/configuracoes#usuarios")},[router]);return <main className="painel"><h1>Usuários e acessos em Configurações</h1><p>Esta área agora faz parte de Configurações.</p><Link className="botao" href="/configuracoes#usuarios">Abrir Configurações</Link></main>}
