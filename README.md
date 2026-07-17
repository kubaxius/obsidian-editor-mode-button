# Editor Mode Button

I made this extension because Obsidian only has a "Default editing mode for new notes" setting, and that never felt like enough to me. I wanted notes to work more like Vim modes or a blog editor: one clear mode for reading, and one clear mode for editing.

It makes the separation between editing mode and reading mode clear. When you switch `Default view for new tabs`, it applies not only to newly opened files, but also to the ones that are already open.

## CSS

You can easily change how Obsidian looks in both modes. Just create a CSS file in your vault, and set its path in the settings.

```css
body.emb-mode-source .view-header {
	background-color: rgb(45, 25, 0) !important;
}

body.emb-mode-preview .view-header {
	background-color: var(--background-secondary);
}
```

All styles that should be visible in a specific mode should be placed either in the `body.emb-mode-source` selector (for editing mode), or in `body.emb-mode-preview` (for reading mode). The custom CSS will override the default styles.

### Default Reading Mode

![Reading Mode Top Bar](screenshots/reading_mode.png)

### Default Editing Mode

![Editing Mode Top Bar](screenshots/editing_mode.png)

## Ribbon Indicator

There's an indicator on the ribbon (menu on the right) that shows which mode you are in. You can click it to quickly switch modes, and when you do, all open files will change their mode too.

![Mode Indicator](screenshots/mode_indicator.png)

## Commands

`Toggle default mode for new tabs` is already a command, but due to the limitations of Obsidian Api it can take a second to register new CSS when using it. To circumvent this, this extension includes a new command:

`Editor Mode Button: Switch editor mode and reload files`.

You can add a keyboard shortcut for it if you feel like it, in the `Hotkeys` category in the Obsidian settings.
