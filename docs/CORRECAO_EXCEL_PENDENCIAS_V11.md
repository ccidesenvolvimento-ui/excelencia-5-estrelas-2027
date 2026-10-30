# Correção da exportação Excel — v1.1

## Diagnóstico
O arquivo original de abril/2027 contém **sete colaboradores fictícios** no XML da segunda aba, mas o Microsoft Excel solicita reparo e pode descartar registros. O arquivo foi gerado por serialização XML OOXML manual usando JSZip. Embora os XMLs sejam parseáveis, isso não garante que o Excel aceite toda a estrutura do pacote. Não foi fornecido o log detalhado de reparo do Excel, portanto a inconsistência exata rejeitada por ele não foi identificada com certeza.

## Solução
- A função pública `exportarPendenciasXlsx` e os tipos permaneceram com as mesmas assinaturas.
- Substituímos o gerador manual de XML pelo ExcelJS (`exceljs@4.4.0`).
- O livro mantém duas abas: **Resumo** e **Pendências**, com sete colunas contextuais e todas as informações atuais, matrículas como texto, cabeçalho fixo e autofiltro.
- A função `criarBufferPendenciasXlsx` permite testar o arquivo binário **reabrindo-o com ExcelJS**.
- A geração continua inteiramente no navegador e só com dados fictícios na demonstração.
- A página `src/app/pendencias/page.tsx` e o PDF do Ranking **não precisam ser alterados**.

## Arquivos a enviar
- `src/lib/exportar-pendencias-xlsx.ts` (substituir)
- `package.json` (substituir, inclui ExcelJS)
- `scripts/testar-exportacao-pendencias-xlsx.cjs` (novo)
- `docs/CORRECAO_EXCEL_PENDENCIAS_V11.md` (novo)

**Atenção**: Para testar automaticamente o novo gerador em todo deploy, o arquivo do workflow/script de testes também será atualizado nesta entrega.

## Verificação e publicação

1. Registre uma Issue para o defeito do Excel.
2. Crie uma branch `fix/pendencias-xlsx-estrutura-v11` a partir da `main`.
3. Envie os diretórios `src`, `scripts`, `docs` e o arquivo `package.json` extraídos do ZIP, **sem alterar o restante**.
4. Faça um Pull Request vinculado à Issue.
5. Como a publicação atual roda somente após push/merge na `main`, execute a verificação no Codespaces antes do merge se possível: `npm install && npm run typecheck && npm run test:rules && npm run build`.
6. Só publique depois de revisar as alterações e confirmar os testes. Abra o site e exporte novamente abril/2027: devem aparecer sete colaboradores fictícios na aba Pendências sem mensagem de reparo do Excel.

A exportação pelo ExcelJS é dinâmica e pode aumentar o tamanho do download de código do módulo. A biblioteca só é carregada quando o usuário solicita a exportação.

Testes locais desta entrega: validação de sintaxe, inspeção do arquivo inválido, recuperação dos sete colaboradores e reconstrução de uma planilha separada com `artifact_tool`. **A execução do gerador JavaScript com ExcelJS ainda precisa ser confirmada no CI**, pois a dependência não pôde ser instalada neste ambiente.
