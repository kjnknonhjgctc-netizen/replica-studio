<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Delux app lives in src/delux and renders client-only from src/routes/index.tsx and src/routes/$.tsx; its internal screens use the small router layer in src/delux/router.tsx. Why: faithful port of the original single-page app.
- Delux data is stored in the browser (src/delux/services/localServer.ts mirrors the original API); only AI runs on the server (src/delux/ai.functions.ts). Why: original used a local JSON file with no real backend.
- Assistant instructions and gateway calls stay server-only; bounded plain conversation turns and user-scoped goal context accompany each request. Why: the gateway is stateless and advice must reflect the user's constraints without exposing secrets.
- Installed-app system surfaces use the theme-aware global system-background token and standalone CSS; ThemeContext synchronizes browser chrome with the selected theme. Why: match gesture-inset areas to page themes while leaving Android-owned navigation controls to the OS.
- Keep the theme context and hook in themeState.ts, separate from the provider component, and preserve context identity through hot updates. Why: mounted preview consumers must not lose their provider during React Refresh.
