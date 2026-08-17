# FORJA LEM — Aula Magna com Guilherme Freire

Landing page do evento presencial de 12 de setembro de 2026, no Hotel Saint Louis,
em Luís Eduardo Magalhães (BA).

**No ar:** https://manualdotrafego.github.io/forja-lem/

## Stack

Astro 7 + Tailwind 4, saída estática. Sem framework de UI no cliente: o único
JavaScript da página é a contagem regressiva e o observador que revela as seções.

Base do projeto: [AstroWind](https://github.com/arthelokyo/astrowind) (MIT), podado
para uma página só.

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
| Cores, fontes e animação | `src/layouts/ForjaLayout.astro` |
| Título, descrição e domínio | `src/config.yaml` |
| Imagem de compartilhamento | `public/og-forja-lem.jpg` |

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
