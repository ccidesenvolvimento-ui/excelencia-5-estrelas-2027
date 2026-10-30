# Roadmap do sistema corporativo

## v0.2 — Entregue como pacote, pendente de publicar
- Navegação completa das dez telas.
- Demonstração com dados fictícios, regra de notas, ranking, pendências e relatórios de teste.
- Download dos seis modelos XLSX, formulário de pré-verificação sem upload real.
- Workflow GitHub Pages e instruções para domínio.

## v0.3 — Segurança e base corporativa (não implementado)
- Revisar migração SQL e modelo próprio dos pilares de operadores.
- Criar Supabase de **teste**, Auth, perfis, filiais, RLS e testes de acesso indevido.
- Definir backend protegido (Next.js em hospedagem com servidor OU Supabase Edge Functions).
- Guardar arquivos e logs com retenção e políticas acordadas.

## v0.4 — Importações reais (não implementado)
- Upload RH0034 por usuário autorizado; parser com validação integral e transação.
- Associação empresa + matrícula, férias e regras de classificação; somente cadastros autorizados.
- Upload das seis planilhas; advertências, acidentes e fontes Gobrax/Maxtrack/IDT.
- Bloqueio integral por matrícula desconhecida, nota fora da faixa, duplicidade e campos ausentes.

## v0.5 — Fechamento e avaliação (não implementado)
- Scores mensais e ciclos, estimativa de férias no fim dos ciclos, fechamento mensal e reabertura auditada.
- Segurança 0/100 com confirmação explícita dos dois relatórios de ocorrências.
- Permissões por filial inclusive importações, ranking e exportações.

## v1.0 — Homologação e produção (não implementado)
- Testes automatizados de elegibilidade/empate/férias/desligamento, testes de segurança, auditoria.
- Plano de backup, observabilidade e ambientes distintos (desenvolvimento/homologação/produção).
- Relatórios oficiais PDF/XLSX, usuários administradores e domínio corporativo.
