# Homologação do modal com API auditada — Issue #77

## Entrega
- A página demo de GitHub Pages permanece em `/ajustes-notas`, completamente fictícia e sem chamadas HTTP.
- `src/server/templates/ajustes-notas-live-page.tsx` é um template de página **opt-in**. Apenas um runner de CI descartável copia o arquivo para `src/app/ajustes-notas-live/page.tsx`. Não há rota de escrita real instalada por padrão.
- `ModalAjusteNotaReal` compartilha a linguagem visual com o modal demonstrativo, mas exige revisão, justificativa e confirmação. O POST carrega `notaEsperada` para detectar concorrência.
- O GET limitado a 50 avaliações usa a sessão autenticada e as regras RLS de filial, via API de ajustes.
- Após o POST, a interface recarrega a nota efetiva e o histórico de ajustes.
- A nota de Segurança não permite ajuste manual. O banco continua sendo a última autoridade.

## CI efêmera
O runner GitHub cria Supabase local (GoTrue, PostgREST e PostgreSQL), instala a API e a rota de login de teste, autentica usuários fictícios, valida o ajuste de 75 para 90 via HTTP e testa o modal via Playwright desktop/mobile para uma segunda correção de 90 para 85.

## Pendências
- Não existe deploy de homologação persistente do modal.
- O proxy corporativo completo não é exercitado neste teste de UI.
- Não há paginação completa na tela de homologação: ela informa explicitamente quando há mais registros.
- Ranking e relatórios ainda não consomem `nota_efetiva`.
- A autorização para habilitar a função com pessoas/dados reais ainda não foi solicitada.

**Não** integrar o template em `src/app` nem habilitar flags na infraestrutura empresarial sem aprovação e validação de segurança.
