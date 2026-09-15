import { defineConfig } from 'astro/config';

// Non-negotiable constraints (see PLAN.md):
// - output 'static': no SSR, the site is static.
// - inlineStylesheets 'never': the 'auto' default inlines small CSS and
//   would force the CSP to accept 'unsafe-inline'.
// - security.csp: Astro's native CSP (stable since 6.0.0), renders a
//   <meta http-equiv="content-security-policy"> with hashes for
//   scripts/styles, no adapter needed for the header.
export default defineConfig({
  output: 'static',
  build: {
    inlineStylesheets: 'never',
  },
  security: {
    csp: {
      // Astro doesn't add 'self' to script-src by default: we list it
      // explicitly to allow loading /crypto.js as an external ES module
      // (it lives in public/, unprocessed and unhashed).
      scriptDirective: {
        resources: ["'self'"],
      },
      // 'frame-ancestors' is deliberately left out: the CSP spec ignores
      // it when the policy arrives via <meta> (the only option with
      // output 'static' and no adapter). It's set via an HTTP header on
      // Netlify instead: see netlify.toml.
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
