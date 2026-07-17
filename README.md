# Editor Mode Button

I made this plugin because Obsidian only has a "Default editing mode for new notes" setting, and that never felt like enough to me. I wanted notes to work more like Vim modes or a blog editor: one clear mode for reading, and one clear mode for editing.

It makes the separation between editing mode and reading mode clear. When you switch `Default view for new tabs`, it applies not only to newly opened files, but also to the ones that are already open.

## CSS

You can easily change how Obsidian looks in both modes. Just create a CSS file in your vault, and set its path in the settings.

```css
body.emb-use-default-styles.emb-mode-source .view-header {
	--file-header-background-focused: rgb(45, 25, 0);
	--file-header-background: rgb(25, 0, 0);
}

body.emb-use-default-styles.emb-mode-preview .view-header {
	--file-header-background-focused: rgb(25, 25, 25);
	--file-header-background: rgb(0, 0, 0);
}
```

All styles that should be visible in a specific mode should be placed either in the `body.emb-mode-source` selector (for editing mode), or in `body.emb-mode-preview` (for reading mode). The custom CSS will override the default styles.

### Default reading mode

![Reading Mode Top Bar](screenshots/reading_mode.png)

### Default editing mode

![Editing Mode Top Bar](screenshots/editing_mode.png)

## Ribbon indicator

There's an indicator on the ribbon that shows which mode you are in. You can click it to quickly switch modes, and when you do, all open files will change their mode too.

![Mode Indicator](screenshots/mode_indicator.png)

## Commands

`Toggle default mode for new tabs` is already a command, but due to the limitations of the Obsidian API it can take a second to register new CSS when using it. To avoid that delay, this plugin includes a new command:

`Editor Mode Button: Switch editor mode and reload files`.

You can add a keyboard shortcut for it if you feel like it, in the `Hotkeys` category in the Obsidian settings.
