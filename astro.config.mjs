import { defineConfig } from 'astro/config';

// Vincoli non negoziabili (vedi CLAUDE.md):
// - output 'static': nessun SSR, il sito e' statico.
// - inlineStylesheets 'never': il default 'auto' inlinea i CSS piccoli e
//   costringerebbe la CSP ad accettare 'unsafe-inline'.
// - security.csp: CSP nativa di Astro (stabile da 6.0.0), rende <meta
//   http-equiv="content-security-policy"> con hash per script/style, senza
//   bisogno di adapter per l'header.
export default defineConfig({
  output: 'static',
  build: {
    inlineStylesheets: 'never',
  },
  security: {
    csp: {
      // Astro non aggiunge 'self' di default a script-src: lo elenchiamo
      // esplicitamente per permettere il caricamento di /crypto.js come
      // modulo ES esterno (vive in public/, non viene processato/hashato).
      scriptDirective: {
        resources: ["'self'"],
      },
      // 'frame-ancestors' e' deliberatamente escluso: la spec CSP lo ignora
      // quando la policy arriva via <meta> (unico veicolo possibile con
      // output 'static' senza adapter). Va impostato via header lato
      // Netlify: vedi netlify.toml.
      directives: [
        "default-src 'self'",
        "img-src 'self'",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
      ],
    },
  },
});
