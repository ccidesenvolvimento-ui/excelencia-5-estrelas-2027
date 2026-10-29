# Regras de negócio — versão inicial 0.1

> Documento de referência para desenvolvimento, não substitui homologação corporativa.

## Categorias

Exatamente 8: Florestal; Sucro; Mineração; Bebidas; Rodoviário – Cavalo Mecânico; Motoristas de Truck/Toco; E-commerce; Operadores de Máquinas e Tratores.

- Operadores de empilhadeira são **não participantes** e não geram pendências.
- Categoria deve ser identificada por regras homologadas a partir da RH0034. Casos ambíguos vão para classificação manual durante a importação.
- O gestor pode aprovar **criar regra automática**, com prévia dos colaboradores afetados, histórico de aprovação e possibilidade de desativar a regra.
- Preservar histórico de categoria por competência.

## Cadastro e importações

- Somente a **RH0034**, importada no início do mês, cria ou atualiza colaboradores. A matrícula deve ser identificada com empresa/coligada para lidar com repetições entre empresas.
- As cinco fontes de avaliação **não criam colaboradores**. Matrícula desconhecida: bloquear **todo o lote**, explicar o erro e exigir regularização via RH0034.
- O usuário só confirma o lote quando todas as linhas estiverem válidas.
- Nunca tratar nota vazia como zero. Valor 0 é legítimo e eliminatório.
- Manter dados de origem, usuário, competência e evidências da validação.
- A coluna FILIAL substituiu OPERAÇÃO no modelo das notas.
- Dirigibilidade terá coluna `TIPO DE DADO`: `Gobrax`, `Max Track` ou `IDT`. Bebidas usa IDT; demais operações, sua fonte homologada.

## Segurança

- Dois relatórios de penalizações independentes por competência: **Advertências** e **Acidentes** (cada linha tem nome, matrícula e descrição).
- Se o colaborador consta em um ou ambos: nota de Segurança = 0.
- Se não consta em nenhum: 100, **somente após os dois lotes serem importados, validados e fechados para a competência**.
- Segurança não é alimentada por nota individual em planilha; é derivada dos relatórios.

## Pontuação e elegibilidade

- 5 estrelas: Segurança (0 ou 100), Produtividade, Dirigibilidade, Jornada, Treinamentos (0–100).
- Pesos propostos no regulamento: 30/25/20/15/10 (homologar antes de usar em produção).
- Score mensal: soma ponderada das cinco notas.
- Qualquer uma das notas iguais a zero: inelegibilidade no ciclo correspondente e no anual. Pode competir nos outros ciclos.
- Média do ciclo e anual: meses com pesos iguais, conforme calendário. Sucro Mar–Mai, Jun–Ago, Set–Nov, anual Mar–Nov; outros: Jan–Abr, Mai–Ago, Set–Dez, anual Jan–Dez.
- Ranking: elegíveis e inelegíveis com notas; só elegíveis têm posição. Pendentes ficam apenas na Central de Pendências.
- Ciclos exibem a média das cinco estrelas e score médio. Mensal exibe cinco estrelas e score mensal.

## Férias

- RH0034 traz `Data Ini. Férias`, `Data Fim Férias` e `Dias de Gozo`.
- Detectar automaticamente a competência de férias; não perguntar manualmente se está de férias.
- Só ao **fim do ciclo**, com outros meses completos, aplicar ao mês sem dados operacionais a **média dos demais meses reais válidos do mesmo ciclo** (máximo três em ciclos quadrimestrais e dois em Sucro).
- Meses têm pesos iguais; não proporcionalizar por dias de férias. Não usar média para recuperar inelegibilidade por zero.
- Se não houver histórico suficiente, manter pendência para avaliação excepcional, sem inventar nota.
- A futura implementação deverá distinguir Segurança automaticamente calculada dos quatro pilares operacionais ausentes.
- Desligamento continuará **manual**, com histórico preservado.

## Fechamento e relatórios

- Competência fecha dia 12 do mês seguinte (ou próximo dia útil quando cair em fim de semana); depois somente administradores alteram, com auditoria. Feriados exigem regra local a confirmar.
- Um relatório por segmento/categoria; respeitar filtros visíveis e ordenação, preservar posições oficiais.
- Gerador de PDF e Excel: Top N escolhido pelo usuário (Top 5/10/20/30 ou personalizado). Somente elegíveis participam do relatório.
- Exibir `Nome — Filial` no ranking e relatório, mantendo campos separados no banco.

## Acesso e colaboração

- Três administradores iniciais; criação de usuários via sistema pelos administradores.
- Permissões de acesso por abas/ações e por conjunto de filiais autorizado. RLS e backend devem impor os limites.
- Desenvolvimento conjunto com versionamento no GitHub. Mudanças em banco via migrações SQL.

## Pontos ainda sujeitos a conferência

1. Determinar o formato preciso dos campos de Empresa/Coligada, filial e data na RH0034, com amostras anonimizadas.
2. Validar como identificar sem ambiguidades matrículas presentes apenas nas planilhas das estrelas (sem coluna Coligada).
3. Confirmar as fórmulas e pesos oficiais dos operadores e o tratamento de empates.
4. Decidir acesso a dados históricos de advertência/acidente e retenção conforme RH/Jurídico.
5. Homologar regras de transferência e a exceção de férias sem outro mês válido.
