import { App, normalizePath, Notice } from 'obsidian';
import { editorMode } from './editor-mode';

export class EditorModeStyles {
	private static readonly MODE_CLASSES = [
		'emb-mode-preview',
		'emb-mode-source',
	];
	private static readonly DEFAULT_STYLES_CLASS = 'emb-use-default-styles';

	private app: App;
	private customStyleSheet?: CSSStyleSheet;

	constructor(app: App) {
		this.app = app;
	}

	setMode(mode: editorMode) {
		this.clearModeClasses();
		document.body.classList.add(`emb-mode-${mode}`);
	}

	clear() {
		this.clearModeClasses();
		this.clearCustomCss();
		document.body.classList.remove(EditorModeStyles.DEFAULT_STYLES_CLASS);
	}

	async loadCustomCss(
		customCssPath: string,
		showNotice = false,
	): Promise<boolean> {
		const cssPath = customCssPath.trim();

		if (!cssPath) {
			this.clearCustomCss();
			document.body.classList.add(EditorModeStyles.DEFAULT_STYLES_CLASS);
			if (showNotice) {
				new Notice('Using default editor mode styles.');
			}
			return true;
		}

		try {
			if (!this.canUseCustomStyleSheet()) {
				this.clearCustomCss();
				document.body.classList.add(
					EditorModeStyles.DEFAULT_STYLES_CLASS,
				);
				if (showNotice) {
					new Notice(
						'Custom CSS is not supported here. Using default styles.',
					);
				}
				return false;
			}

			const normalizedPath = normalizePath(cssPath);
			const exists = await this.app.vault.adapter.exists(normalizedPath);

			if (!exists) {
				this.clearCustomCss();
				document.body.classList.add(
					EditorModeStyles.DEFAULT_STYLES_CLASS,
				);
				if (showNotice) {
					new Notice('Custom CSS file not found. Using default styles.');
				}
				return false;
			}

			const css = await this.app.vault.adapter.read(normalizedPath);
			this.setCustomCss(css);
			document.body.classList.remove(EditorModeStyles.DEFAULT_STYLES_CLASS);
			if (showNotice) {
				new Notice('Custom editor mode CSS loaded.');
			}
			return true;
		} catch (error) {
			console.error('Failed to load custom editor mode CSS', error);
			this.clearCustomCss();
			document.body.classList.add(EditorModeStyles.DEFAULT_STYLES_CLASS);
			if (showNotice) {
				new Notice('Failed to load custom CSS. Using default styles.');
			}
			return false;
		}
	}

	private clearModeClasses() {
		document.body.classList.remove(...EditorModeStyles.MODE_CLASSES);
	}

	private canUseCustomStyleSheet(): boolean {
		return (
			'adoptedStyleSheets' in document &&
			typeof CSSStyleSheet !== 'undefined' &&
			typeof CSSStyleSheet.prototype.replaceSync === 'function'
		);
	}

	private setCustomCss(css: string) {
		if (!this.customStyleSheet) {
			// Constructable stylesheets let us add user CSS without creating
			// a <style> element, which keeps Obsidian's DOM rules happy.
			this.customStyleSheet = new CSSStyleSheet();

			// adoptedStyleSheets is the document-level list of constructable
			// stylesheets. Assigning a new array adds ours while preserving any
			// stylesheets Obsidian or other plugins already adopted.
			document.adoptedStyleSheets = [
				...document.adoptedStyleSheets,
				this.customStyleSheet,
			];
		}

		// replaceSync swaps the CSS text inside the same stylesheet object, so
		// applying a changed custom file does not keep stacking old copies.
		this.customStyleSheet.replaceSync(css);
	}

	private clearCustomCss() {
		if (!this.customStyleSheet) {
			return;
		}

		// Remove only the stylesheet object this plugin created. Reassigning the
		// filtered list leaves Obsidian's own styles and other plugins untouched.
		document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
			(styleSheet) => styleSheet !== this.customStyleSheet,
		);
		this.customStyleSheet = undefined;
	}
}
