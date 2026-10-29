"use client";
export function exportarCsv(nome:string,linhas:(string|number|null)[][]){
 const csv=linhas.map(l=>l.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(";")).join("\r\n");
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob); const a=document.createElement("a");a.href=url;a.download=nome;a.click();URL.revokeObjectURL(url);
}
