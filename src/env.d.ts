/// <reference types="astro/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the GuestGuideIQ backend's lead-capture API (e.g.
   * "https://api.guestguideiq.com"). Set at build time — see
   * `src/site.config.ts` and `README.md` "Forms" section. Falls back to a
   * local dev placeholder when unset.
   */
  readonly PUBLIC_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
