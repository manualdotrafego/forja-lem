# FORJA LEM — Aula Magna com Guilherme Freire

Landing page do evento presencial de 12 de setembro de 2026, no Hotel Saint Louis,
em Luís Eduardo Magalhães (BA).

**No ar:** https://manualdotrafego.github.io/forja-lem/

## Stack

Astro 7 + Tailwind 4, saída estática. Base: [AstroWind](https://github.com/arthelokyo/astrowind)
(MIT), podado para uma página só.

Camada de movimento:

| Lib | Para quê | Quando carrega | Peso (gzip) |
|---|---|---|---|
| GSAP + ScrollTrigger | entrada do hero, revelação das seções, parallax | sempre, adiado | 45 kB |
| Lenis | rolagem suave | só desktop | 5 kB |
| three.js | campo de brasas em WebGL no hero | só se o aparelho e a rede aguentarem | 125 kB |

O three entra por `import()` dinâmico. Quem estiver com economia de dados ligada,
em rede abaixo de 4G, com menos de 4 GB de RAM ou menos de 4 núcleos vê o hero
igual, só sem as fagulhas. Quem pediu `prefers-reduced-motion: reduce` não recebe
animação nenhuma.

### Mobile

`gsap.matchMedia()` separa três cenários: desktop, mobile e movimento reduzido.
No mobile:

- sem parallax (a barra do navegador entra e sai na rolagem e o efeito treme)
- sem rolagem suave, vale a nativa do sistema
- 300 fagulhas em vez de 900, brilho menor, sem retina cheia
- barra fixa embaixo com o CTA e o WhatsApp, que sobe depois do hero
- o balão do WhatsApp fica só no desktop, para não duplicar

## Patrocinadores

Carrossel infinito em CSS puro (`.carrossel` no layout), sem JavaScript. A
faixa repete a lista duas vezes e desliza `-50%`, o que fecha o laço sem
emenda. Para no hover e no foco do teclado. Com `prefers-reduced-motion:
reduce` vira uma grade parada.

As logos ficam em medalhões circulares claros: assim cada marca aparece nas
cores dela em vez de virar silhueta branca, que é o que o patrocinador
espera ver. Dentro do círculo os limites são em porcentagem do diâmetro
(`max-h-[42%] max-w-[80%]`), porque uma logo baixa cabe numa corda mais
larga que o quadrado inscrito.

Para adicionar um patrocinador: coloque o PNG em
`src/assets/images/forja/patrocinadores/` (fundo transparente, recortado
justo, altura de 260 px) e acrescente uma linha no array `patrocinadores`
em `src/pages/index.astro`.

As logos atuais foram processadas a partir dos originais: fundo branco
removido nas que vieram chapadas, recorte justo, e a DBOUT recolorida de
branco para preto, porque em cartão claro ela sumiria.

## Rastreamento (Meta)

Pixel `1279060486021727`, no `<head>` via `src/layouts/ForjaLayout.astro`.
Só carrega fora de `localhost`, para teste não sujar os dados da conta.

| Evento | Quando dispara |
|---|---|
| `PageView` | ao abrir a página |
| `AddToCart` | clique em qualquer um dos 4 botões que levam ao Sympla |

Os botões são marcados com `data-evento-pixel="AddToCart"` e
`data-origem-pixel="..."` (cabecalho, hero, cta-final, barra-mobile), e a
escuta fica em `src/scripts/forja-pixel.ts`, por delegação. O parâmetro
`origem` vai junto no evento, então dá para ver qual botão converte mais.

Cada disparo leva um `eventID` único, que serve para deduplicar caso a API
de Conversões entre depois.

### Sobre o token da API de Conversões

**Não está neste repositório, e não pode estar.** O site é estático e o repo
é público: qualquer token commitado aqui fica legível para qualquer pessoa,
e com ele dá para enviar eventos falsos em nome da conta.

A API de Conversões exige um servidor que guarde o token como variável de
ambiente. Caminhos possíveis:

1. Uma function na Vercel ou Netlify, com o token em variável de ambiente.
2. A VPS que já roda as outras automações.
3. Uma Conversion API Gateway da própria Meta.

Sem isso, o pixel do navegador cobre o essencial.

## Rodar local

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # gera dist/
npm run preview  # confere o build
```

## Deploy

Automático. Todo push na branch `main` dispara `.github/workflows/deploy.yml`, que
builda e publica no GitHub Pages.

## Onde mexer

| O quê | Onde |
|---|---|
| Todo o conteúdo da página | `src/pages/index.astro` |
| Link do Sympla e do WhatsApp | constantes `INSCRICAO` e `WHATSAPP`, topo do mesmo arquivo |
| Textos das seções | arrays `publico`, `temas`, `credenciais`, `faq` |
| Cores, fontes e estado inicial | `src/layouts/ForjaLayout.astro` |
| Animação e regras por breakpoint | `src/scripts/forja-movimento.ts` |
| Shader das brasas | `src/scripts/forja-brasas.ts` |
| Título, descrição e domínio | `src/config.yaml` |
| Imagem de compartilhamento | `public/og-forja-lem.jpg` |
| Patrocinadores | array `patrocinadores` + `src/assets/images/forja/patrocinadores/` |

### Paleta

Preto `#0A0908`, carvão `#131110`, dourado `#EBC173`, creme `#FFF1DF`,
brasa `#D9662B` (tirada do laranja do logo).

Títulos em EB Garamond, rótulos e botões em Montserrat, corpo em Inter.
As três são self-hosted pelo Astro, sem chamada ao Google Fonts.

## Imagens

Em `src/assets/images/forja/`:

- `gf-hero.jpg` — retrato na biblioteca, do site filosofiadozero.com.br
- `gf-palestra.jpg` — Guilherme no palco, da landing anterior
- `forja-logo.jpg` — logo FORJA LEM, da landing anterior

## Pendências antes de divulgar

1. O link do Sympla é uma URL `/preview/`, ou seja, o evento ainda não está
   publicado. Trocar pela URL pública.
2. O logo é foto de um banner impresso. Um PNG ou SVG com fundo transparente
   melhora bastante o cabeçalho.
3. No FAQ, a resposta sobre o endereço completo ser enviado por e-mail foi escrita
   por suposição. Ajustar se o fluxo for outro.
4. Não há preço na página. Se o evento for pago, cabe um bloco de investimento
   antes do CTA final.
