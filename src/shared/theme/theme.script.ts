import {
  DARK_CLASS_NAME,
  DARK_SCHEME_MEDIA_QUERY,
  DEFAULT_THEME,
  THEMES,
  THEME_STORAGE_KEY,
} from './theme.model'

/*
 * Runs synchronously in <head> before first paint so a returning dark-mode
 * user never sees a light flash. It has to be a string (no bundler, no React),
 * so it is assembled from the model's constants rather than repeating them.
 *
 * Embedded Shopify stays light: Polaris has no dark scheme. The provider uses
 * the app's full embedded-context resolver; this script only needs a cheap
 * approximation, so it treats "shop + host params" or "inside an iframe" as
 * embedded. Any mismatch is corrected by the provider right after hydration.
 */
export const themeInitScript = `(function(){
  var theme = ${JSON.stringify(DEFAULT_THEME)};
  try {
    var stored = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (${JSON.stringify(THEMES)}.indexOf(stored) !== -1) theme = stored;
  } catch (e) {}

  var embedded = false;
  try {
    var params = new URLSearchParams(window.location.search);
    embedded = (params.get('shop') && params.get('host')) || window.top !== window.self;
  } catch (e) {
    embedded = true;
  }

  var dark = !embedded && (theme === 'dark' ||
    (theme === 'system' && window.matchMedia(${JSON.stringify(DARK_SCHEME_MEDIA_QUERY)}).matches));
  document.documentElement.classList.toggle(${JSON.stringify(DARK_CLASS_NAME)}, dark);
})();`
