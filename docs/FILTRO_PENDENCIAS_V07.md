# Central de Pendências — filtro por tipo (v0.7)

## Objetivo

Adicionar **Tipo de pendência** à Central, sem substituir os filtros atuais de competência, segmento, filial e nome/matrícula. Todos os filtros são combinados por `E` (interseção). O filtro `Todas as pendências` não restringe os resultados.

## Tipos disponíveis

- Sem nenhum dado
- Sem Segurança, Sem Produtividade, Sem Jornada, Sem Treinamentos
- Sem Dirigibilidade (qualquer fonte)
- Sem IDT, Sem Gobrax, Sem Maxtrack
- Dirigibilidade sem fonte definida
- Sem Eficiência Operacional, Sem Conservação/Operação (categoria operadores)

**Nota ausente ≠ nota zero.** Nota 0 gera inelegibilidade e não configura pendência. Uma pessoa com múltiplos dados ausentes aparece uma única vez, mas é encontrada por qualquer um dos tipos correspondentes.

A interface atual usa `ranking('mensal', mes)` e `r.notas` para descobrir estrelas ausentes. Para Bebidas, a fonte de dirigibilidade é IDT, conforme regra do programa. Nos demais segmentos, **não se pode adivinhar se a fonte é Gobrax ou Maxtrack**. O protótipo utiliza um mapeamento fictício de duas matrículas para testar os filtros (em `src/lib/tipos-pendencia.ts`). Fontes não classificadas são sinalizadas como `Dirigibilidade sem fonte definida`.

Uma ausência em todas as cinco estrelas aparece visualmente como **Sem nenhum dado** e pode ser encontrada também nos filtros específicos que correspondem às estrelas ausentes. Isso evita ocultar trabalhadores que precisam de regularização geral.

## Exportação

O botão Exportar CSV usa exatamente os filtros ativos e inclui as colunas `Tipo(s) de pendência` e `Informações ausentes`.

## Limite do protótipo

As classificações, pessoas e avaliações ainda são fictícias. Os exemplos de abril de 2027 foram ampliados apenas para permitir testes visuais das opções. A versão corporativa exigirá cadastro validado da fonte esperada de dirigibilidade por motorista/competência, importações efetivas, estados de confirmação da Segurança e autorização por filial no servidor.

## Testes

No ambiente com Node.js e TypeScript instalados:

```bash
node scripts/testar-pendencias-v07.cjs
```

Teste manual: em abril/2027, selecionar Segmento `Bebidas`, Filial `Contagem`, Tipo `Sem IDT`. O resultado esperado é apenas **Henrique Rocha**, que é fictício. Trocar o tipo para `Sem Segurança` deverá dar zero nesse segmento e filial. Limpar filtros restaura abril, todas as categorias, todas as filiais e todos os tipos.
