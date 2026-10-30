/* Portal do motorista: SW isolado na rota /motorista/.
 * Não armazenamos avaliações, matrículas, respostas de API ou HTML em cache.
 * A consulta exige rede e não pode mostrar notas antigas como atuais.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, {cache: 'no-store'}));
  }
});
