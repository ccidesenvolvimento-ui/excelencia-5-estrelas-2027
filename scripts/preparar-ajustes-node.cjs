#!/usr/bin/env node
/** Instala templates existentes SOMENTE no workspace efêmero do build Docker Node.
 * Nunca executar em export GitHub Pages; default é não fazer alterações.
 * Não cria banco, conta de usuário nem habilita flags no servidor.
 */
const fs=require("node:fs");
const path=require("node:path");

function preparar({root,habilitado,deployTarget}) {
  if (habilitado!=="true") return {instalado:false,motivo:"opt-in desativado"};
  if (deployTarget==="github-pages") throw new Error("Ajustes Node incompatíveis com export GitHub Pages");
  const sources=[
    ["src/server/templates/ajustes-notas-live-page.tsx","src/app/ajustes-notas/page.tsx"],
    ["src/server/templates/ajustes-notas-route.ts","src/app/api/ajustes-notas/route.ts"],
  ];
  for(const [source] of sources) {
    if(!fs.existsSync(path.join(root,source))) throw new Error("Template necessário ausente: "+source);
  }
  // O build Docker copia este código dentro da imagem; nunca sobrescreve a demo no Git.
  const [pagina,rota]=sources;
  const destinoApi=path.join(root,rota[1]);
  if(fs.existsSync(destinoApi)) throw new Error("Rota API já presente: recusando substituição");
  fs.mkdirSync(path.dirname(destinoApi),{recursive:true});
  fs.copyFileSync(path.join(root,pagina[0]),path.join(root,pagina[1]));
  fs.copyFileSync(path.join(root,rota[0]),destinoApi);
  return {instalado:true,motivo:"Rotas Node instaladas no build isolado"};
}
if(require.main===module){
  const resultado=preparar({
    root:process.cwd(),
    habilitado:process.env.EXCELENCIA_NODE_AJUSTES_ENABLED,
    deployTarget:process.env.NEXT_PUBLIC_DEPLOY_TARGET,
  });
  console.log(resultado.motivo);
}
module.exports={preparar};
