/**
 * Eventos do Pixel da Meta.
 *
 * Todo link que leva ao checkout do Sympla dispara AddToCart no clique.
 * Como esses links abrem em aba nova, a pagina continua viva e o evento
 * tem tempo de sair: nao precisa segurar a navegacao.
 *
 * Cada disparo leva um eventID. Hoje ele nao serve para nada, mas no dia em
 * que a API de Conversoes entrar (o que exige servidor, ver README), a Meta
 * usa esse ID para casar o evento do navegador com o do servidor e nao
 * contar a mesma pessoa duas vezes.
 */

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    // usado pelo snippet oficial da Meta no <head>
    _fbq?: unknown;
  }
}

function idDoEvento() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return 'ev-' + Math.random().toString(36).slice(2) + '-' + performance.now().toString(36);
}

export function ligarEventosPixel() {
  // Delegacao: pega inclusive a barra fixa do mobile, que aparece depois
  document.addEventListener(
    'click',
    (e) => {
      const alvo = (e.target as Element | null)?.closest?.('[data-evento-pixel]');
      if (!alvo) return;

      const evento = alvo.getAttribute('data-evento-pixel');
      if (!evento || typeof window.fbq !== 'function') return;

      window.fbq('track', evento, {
        content_name: 'Aula Magna FORJA LEM',
        content_category: 'Evento presencial',
        content_ids: ['forja-lem-aula-magna-2026-09-12'],
        content_type: 'product',
        // De onde na pagina veio o clique. Ajuda a saber qual botao converte.
        origem: alvo.getAttribute('data-origem-pixel') || 'nao informado',
      }, { eventID: idDoEvento() });
    },
    { capture: true }
  );
}
