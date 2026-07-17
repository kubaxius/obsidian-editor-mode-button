# Editor Mode Button development

This project is an Obsidian community plugin built with TypeScript and esbuild.

## Setup

- Install dependencies with `npm install`.
- Run `npm run dev` to build `main.js` in watch mode.
- Run `npm run build` before publishing.
- Run `npm run lint` before committing.

## Manual testing

For local testing, place this repository at:

```text
<Vault>/.obsidian/plugins/editor-mode-button/
```

Then reload Obsidian and enable **Editor Mode Button** in **Settings -> Community plugins**.

## Release checklist

- Update `version` in `manifest.json` and `package.json`.
- Update `versions.json` with the matching minimum Obsidian version.
- Run `npm install` after changing `package.json` so `package-lock.json` stays in sync.
- Run `npm run build`.
- Run `npm run lint`.
- Create a GitHub release tagged with the exact version number, without a leading `v`.
- Attach `manifest.json`, `main.js`, and `styles.css` to the release.

The GitHub release workflow builds the plugin and creates a draft release when a version tag is pushed.
