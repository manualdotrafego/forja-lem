/**
 * Campo de brasas do hero, em WebGL.
 *
 * Tema da FORJA: fagulhas subindo devagar, como de uma bigorna.
 * Um unico Points com shader proprio, ou seja, um draw call por quadro.
 * Nada de textura carregada: o brilho e desenhado no fragment shader.
 *
 * O modulo e carregado por import() dinamico, entao o three so entra
 * no bundle de quem realmente vai ver a animacao.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';

const VERTEX = /* glsl */ `
  uniform float uTempo;
  uniform float uAltura;
  uniform float uPixelRatio;

  attribute float aSemente;
  attribute float aTamanho;
  attribute float aVelocidade;

  varying float vAlfa;

  void main() {
    vec3 p = position;
    float t = uTempo * aVelocidade + aSemente * 100.0;

    // sobe em loop e balanca de leve, como fagulha pega pelo ar quente
    float subida = mod(position.y + uTempo * aVelocidade * 0.55, uAltura);
    p.y = subida - uAltura * 0.5;
    p.x += sin(t * 0.55 + aSemente * 6.28318) * 0.45;
    p.z += cos(t * 0.37 + aSemente * 3.14159) * 0.30;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aTamanho * uPixelRatio * (21.0 / max(-mv.z, 0.001));

    // nasce, brilha e apaga antes do topo. A janela e larga de proposito:
    // com a faixa estreita de antes, quase toda fagulha morria na metade
    // de baixo e o campo ficava com alfa medio de 47 em 255, ou seja, sumia.
    float vida = subida / uAltura;
    vAlfa = smoothstep(0.0, 0.08, vida) * (1.0 - smoothstep(0.6, 1.0, vida));
    vAlfa *= 0.68 + 0.32 * sin(t * 2.1 + aSemente * 12.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;

  uniform vec3 uCorBrasa;
  uniform vec3 uCorOuro;
  uniform float uIntensidade;

  varying float vAlfa;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float brilho = smoothstep(0.5, 0.0, d);
    vec3 cor = mix(uCorOuro, uCorBrasa, smoothstep(0.05, 0.42, d));
    gl_FragColor = vec4(cor, brilho * brilho * vAlfa * uIntensidade);
  }
`;

export type OpcoesBrasas = {
  quantidade: number;
  intensidade: number;
  pixelRatioMax: number;
};

export function iniciarBrasas(canvas: HTMLCanvasElement, opcoes: OpcoesBrasas) {
  const { quantidade, intensidade, pixelRatioMax } = opcoes;

  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
  });
  renderer.setClearAlpha(0);

  const cena = new Scene();
  const camera = new PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.z = 9;

  const ALTURA = 16;
  const LARGURA = 22;

  const posicoes = new Float32Array(quantidade * 3);
  const sementes = new Float32Array(quantidade);
  const tamanhos = new Float32Array(quantidade);
  const velocidades = new Float32Array(quantidade);

  for (let i = 0; i < quantidade; i++) {
    posicoes[i * 3] = (Math.random() - 0.5) * LARGURA;
    posicoes[i * 3 + 1] = Math.random() * ALTURA;
    posicoes[i * 3 + 2] = (Math.random() - 0.5) * 7;

    sementes[i] = Math.random();
    tamanhos[i] = 0.9 + Math.random() * 2.6;
    velocidades[i] = 0.22 + Math.random() * 0.55;
  }

  const geometria = new BufferGeometry();
  geometria.setAttribute('position', new BufferAttribute(posicoes, 3));
  geometria.setAttribute('aSemente', new BufferAttribute(sementes, 1));
  geometria.setAttribute('aTamanho', new BufferAttribute(tamanhos, 1));
  geometria.setAttribute('aVelocidade', new BufferAttribute(velocidades, 1));

  const material = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTempo: { value: 0 },
      uAltura: { value: ALTURA },
      uPixelRatio: { value: 1 },
      uCorBrasa: { value: new Color('#d9662b') },
      uCorOuro: { value: new Color('#ffd79a') },
      uIntensidade: { value: intensidade },
    },
  });

  const pontos = new Points(geometria, material);
  cena.add(pontos);

  const redimensionar = () => {
    const l = canvas.clientWidth || 1;
    const a = canvas.clientHeight || 1;
    const pr = Math.min(window.devicePixelRatio || 1, pixelRatioMax);
    renderer.setPixelRatio(pr);
    renderer.setSize(l, a, false);
    camera.aspect = l / a;
    camera.updateProjectionMatrix();
    material.uniforms.uPixelRatio.value = pr;
  };
  redimensionar();

  let rodando = false;
  let quadro = 0;
  let ultimo = performance.now();
  let tempo = 0;

  const laco = (agora: number) => {
    quadro = requestAnimationFrame(laco);
    // delta limitado: volta de aba em segundo plano nao teleporta as brasas
    const delta = Math.min((agora - ultimo) / 1000, 0.05);
    ultimo = agora;
    tempo += delta;
    material.uniforms.uTempo.value = tempo;
    renderer.render(cena, camera);
  };

  const tocar = () => {
    if (rodando) return;
    rodando = true;
    ultimo = performance.now();
    quadro = requestAnimationFrame(laco);
  };

  const pausar = () => {
    if (!rodando) return;
    rodando = false;
    cancelAnimationFrame(quadro);
  };

  // so gasta GPU enquanto o hero esta na tela e a aba esta visivel
  const observador = new IntersectionObserver(
    ([entrada]) => (entrada.isIntersecting && !document.hidden ? tocar() : pausar()),
    { threshold: 0 }
  );
  observador.observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pausar();
    else if (canvas.getBoundingClientRect().bottom > 0) tocar();
  });

  window.addEventListener('resize', redimensionar, { passive: true });

  return {
    destruir() {
      pausar();
      observador.disconnect();
      window.removeEventListener('resize', redimensionar);
      geometria.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
