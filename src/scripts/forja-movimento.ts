/**
 * Movimento da landing: GSAP + ScrollTrigger para as revelacoes,
 * Lenis para a rolagem suave, e o campo de brasas em WebGL no hero.
 *
 * Tudo passa por gsap.matchMedia(), que e o jeito do GSAP de ligar e
 * desligar animacao por breakpoint e limpar sozinho na troca. Os tres
 * cenarios sao: desktop, mobile e "quero menos movimento".
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const q = <T extends Element>(sel: string) => Array.from(document.querySelectorAll<T>(sel));

/**
 * O three custa 125 kB comprimidos so para fazer ambiente. Isso so se paga
 * em aparelho e rede que aguentam: quem estiver no 3G ou com economia de
 * dados ligada ve o hero identico, apenas sem as fagulhas.
 */
function aguentaWebGL() {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const rede = nav.connection;
  if (rede?.saveData) return false;
  if (rede?.effectiveType && !rede.effectiveType.includes('4g')) return false;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return false;
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency < 4) return false;
  return true;
}

/* ------------------------------------------------------------------ *
 * Rolagem suave (Lenis)
 * ------------------------------------------------------------------ */
async function ligarRolagemSuave() {
  const { default: Lenis } = await import('lenis');

  const lenis = new Lenis({
    duration: 1.05,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    // no toque, a rolagem nativa do sistema ganha: e mais previsivel
    // e nao briga com o "puxar para atualizar" nem com a barra do navegador
    syncTouch: false,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((tempo) => lenis.raf(tempo * 1000));
  gsap.ticker.lagSmoothing(0);

  // ancoras internas passam a usar o easing do Lenis
  q<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const alvo = document.querySelector(a.getAttribute('href') || '');
      if (!alvo) return;
      e.preventDefault();
      lenis.scrollTo(alvo as HTMLElement, { offset: -80 });
    });
  });

  return lenis;
}

/* ------------------------------------------------------------------ *
 * Entrada do hero
 * ------------------------------------------------------------------ */
function animarHero(desktop: boolean) {
  const linhas = q('[data-hero-linha]');
  const itens = q('[data-hero-item]');

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from('[data-hero-rotulo]', { autoAlpha: 0, x: -18, duration: 0.7 })
    .from(linhas, { autoAlpha: 0, y: desktop ? 34 : 22, duration: 0.9, stagger: 0.11 }, '-=0.35')
    .from(itens, { autoAlpha: 0, y: 18, duration: 0.7, stagger: 0.09 }, '-=0.45');

  return tl;
}

/* ------------------------------------------------------------------ *
 * Revelacoes de secao
 * ------------------------------------------------------------------ */
function animarSecoes(desktop: boolean) {
  q('[data-revelar]').forEach((el) => {
    gsap.from(el, {
      autoAlpha: 0,
      y: desktop ? 40 : 24,
      duration: 0.85,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // listas e grades entram escalonadas, item a item
  q('[data-revelar-lista]').forEach((lista) => {
    gsap.from(lista.children, {
      autoAlpha: 0,
      y: desktop ? 30 : 18,
      duration: 0.7,
      ease: 'power2.out',
      stagger: desktop ? 0.08 : 0.05,
      scrollTrigger: { trigger: lista, start: 'top 85%', once: true },
    });
  });
}

/* ------------------------------------------------------------------ *
 * Parallax, so no desktop: em telas de toque a barra do navegador
 * entra e sai durante a rolagem e o efeito vira tremida
 * ------------------------------------------------------------------ */
function animarParallax() {
  const foto = document.querySelector('[data-hero-foto]');
  if (foto) {
    gsap.to(foto, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: '#topo', start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  const brasas = document.querySelector('[data-brasas]');
  if (brasas) {
    gsap.to(brasas, {
      yPercent: 22,
      autoAlpha: 0,
      ease: 'none',
      scrollTrigger: { trigger: '#topo', start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  const retrato = document.querySelector('[data-retrato]');
  if (retrato) {
    gsap.fromTo(
      retrato,
      { yPercent: -5 },
      {
        yPercent: 5,
        ease: 'none',
        scrollTrigger: { trigger: retrato, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
  }
}

/* ------------------------------------------------------------------ *
 * Barra fixa de inscricao no mobile
 * ------------------------------------------------------------------ */
function animarBarraMobile() {
  const barra = document.querySelector('[data-barra-mobile]');
  if (!barra) return;

  gsap.set(barra, { yPercent: 120, autoAlpha: 0 });

  ScrollTrigger.create({
    trigger: '#topo',
    start: 'bottom 80%',
    onEnter: () => gsap.to(barra, { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' }),
    onLeaveBack: () => gsap.to(barra, { yPercent: 120, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }),
  });
}

/* ------------------------------------------------------------------ *
 * Brasas em WebGL
 * ------------------------------------------------------------------ */
async function ligarBrasas(quantidade: number, intensidade: number, pixelRatioMax: number) {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-brasas]');
  if (!canvas || !aguentaWebGL()) return null;

  try {
    const { iniciarBrasas } = await import('./forja-brasas');
    const campo = iniciarBrasas(canvas, { quantidade, intensidade, pixelRatioMax });
    gsap.to(canvas, { autoAlpha: 1, duration: 1.6, ease: 'power2.out' });
    return campo;
  } catch {
    // sem WebGL o hero continua igual, so sem as fagulhas
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Montagem
 * ------------------------------------------------------------------ */
export function iniciar() {
  const mm = gsap.matchMedia();

  mm.add(
    {
      desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
      mobile: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
      reduzido: '(prefers-reduced-motion: reduce)',
    },
    (contexto) => {
      const { desktop, mobile, reduzido } = contexto.conditions as Record<string, boolean>;

      if (reduzido) {
        // acessibilidade acima de tudo: conteudo visivel, zero movimento
        gsap.set('[data-revelar], [data-revelar-lista] > *', { autoAlpha: 1, y: 0 });
        const barra = document.querySelector('[data-barra-mobile]');
        if (barra) gsap.set(barra, { yPercent: 0, autoAlpha: 1 });
        return;
      }

      animarHero(!!desktop);
      animarSecoes(!!desktop);

      let campo: Awaited<ReturnType<typeof ligarBrasas>> = null;
      let lenis: Awaited<ReturnType<typeof ligarRolagemSuave>> | null = null;

      if (desktop) {
        animarParallax();
        ligarRolagemSuave().then((l) => (lenis = l));
        ligarBrasas(900, 2.2, 2).then((c) => (campo = c));
      }

      if (mobile) {
        animarBarraMobile();
        // menos da metade das particulas, brilho menor e nada de retina cheia:
        // o hero mobile e quase todo texto, as fagulhas sao so ambiente
        ligarBrasas(300, 1.6, 1.5).then((c) => (campo = c));
      }

      return () => {
        campo?.destruir();
        lenis?.destroy();
      };
    }
  );

  // O CSS esconde os alvos ate aqui para nao piscar. As chamadas gsap.from()
  // acima ja gravaram visibility:hidden inline, entao soltar a classe agora
  // nao mostra nada antes da hora: acontece tudo na mesma tarefa sincrona.
  document.documentElement.classList.remove('js-motion');

  vigiarRevelacao();

  // as fontes mudam a altura do texto: recalcula os gatilhos quando chegarem
  if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
}

/**
 * Rede de seguranca.
 *
 * O GSAP deixa visibility:hidden inline ate o tween rodar, e o tween depende
 * de requestAnimationFrame. Em aba de segundo plano o rAF nao dispara, e o
 * mesmo vale se o GSAP quebrar no meio. Numa pagina de conversao, texto
 * invisivel e pior do que animacao nenhuma: aqui, se o hero nao apareceu,
 * a gente derruba a animacao e mostra tudo.
 */
function vigiarRevelacao() {
  let jaLiberou = false;

  const conferir = (forcar = false) => {
    if (jaLiberou) return;
    // Aba em segundo plano nao roda requestAnimationFrame, entao o normal e
    // esperar a pessoa voltar. So que webview de app (WhatsApp, Instagram)
    // as vezes mente sobre isso, e essa landing chega quase toda por link de
    // WhatsApp. Por isso o segundo prazo ignora a visibilidade e libera.
    if (!forcar && document.visibilityState !== 'visible') return;

    const alvo = document.querySelector('[data-hero-linha]');
    if (alvo && Number(getComputedStyle(alvo).opacity) > 0.9) return; // animou, tudo certo

    jaLiberou = true;

    const presos = q('[data-revelar], [data-hero-rotulo], [data-hero-linha], [data-hero-item]').concat(
      q('[data-revelar-lista] > *')
    );
    gsap.killTweensOf(presos);
    gsap.set(presos, { clearProps: 'all' });

    const barra = document.querySelector('[data-barra-mobile]');
    if (barra) gsap.set(barra, { yPercent: 0, autoAlpha: 1 });
  };

  setTimeout(() => conferir(), 2500);
  setTimeout(() => conferir(true), 8000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') setTimeout(() => conferir(), 2500);
  });
}
