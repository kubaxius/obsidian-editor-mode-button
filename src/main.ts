import { normalizePath, Notice, Plugin, setIcon } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	EMBSettingTab,
	EMBSettings,
	ObsidianSettings,
	ObsidianSettingsChange,
} from './settings';
import {
	cycleMode,
	editorMode,
	applyModeToOpenMarkdownViews,
	isEditorMode,
	setMode,
} from './editor-mode';

export default class EMBPlugin extends Plugin {
	private static readonly MODE_CLASSES = [
		'emb-mode-preview',
		'emb-mode-source',
	];
	private static readonly DEFAULT_STYLES_CLASS = 'emb-use-default-styles';

	settings!: EMBSettings;
	obsidianSettings = new ObsidianSettings(this.app);
	ribbonButton?: HTMLElement;
	private customStyleSheet?: CSSStyleSheet;

	mode!: editorMode;

	/* MAIN LOGIC */

	// This function is ran every time the mode setting changes in the obsidian settings.
	private async modeChanged(mode: editorMode) {
		this.mode = mode;
		this.updateRibbonIcon();
		this.updateModeClass();
		await applyModeToOpenMarkdownViews(this.mode, this.app);
	}

	/* STARTUP AND UNLOAD */

	async onload() {
		await this.loadSettings();
		await this.loadCustomCss();

		// Watch for changes in obsidian settings.
		this.registerEvent(
			this.obsidianSettings.onChange((change) => {
				this.onObsidianSettingsChange(change);
			}),
		);
		this.obsidianSettings.watch(this);

		// Change default mode when the layout finishes loading.
		this.app.workspace.onLayoutReady(() => {
			void this.setModeFromStartupValue();
		});

		// This creates an icon in the left ribbon.
		this.ribbonButton = this.addRibbonIcon(
			'book-open',
			'Change editor mode',
			async (_evt: MouseEvent) => {
				// Called when the user clicks the icon.
				await this.onRibbonIconPress();
			},
		);

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'switch-editor-mode-and-reload-files',
			name: 'Switch editor mode and reload files',
			callback: async () => {
				await cycleMode(this.obsidianSettings);
			},
		});

		this.addSettingTab(new EMBSettingTab(this.app, this));
	}

	onunload() {
		this.clearModeClasses();
		this.clearCustomCss();
		document.body.classList.remove(EMBPlugin.DEFAULT_STYLES_CLASS);
	}

	/* SETTINGS */

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<EMBSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/* MODE STYLING */

	private updateModeClass() {
		this.clearModeClasses();
		document.body.classList.add(`emb-mode-${this.mode}`);
	}

	private clearModeClasses() {
		document.body.classList.remove(...EMBPlugin.MODE_CLASSES);
	}

	/* CUSTOM CSS */

	async loadCustomCss(showNotice = false): Promise<boolean> {
		const cssPath = this.settings.customCssPath.trim();

		if (!cssPath) {
			this.clearCustomCss();
			document.body.classList.add(EMBPlugin.DEFAULT_STYLES_CLASS);
			if (showNotice) {
				new Notice('Using default editor mode styles.');
			}
			return true;
		}

		try {
			if (!this.canUseCustomStyleSheet()) {
				this.clearCustomCss();
				document.body.classList.add(EMBPlugin.DEFAULT_STYLES_CLASS);
				if (showNotice) {
					new Notice('Custom CSS is not supported here. Using default styles.');
				}
				return false;
			}

			const normalizedPath = normalizePath(cssPath);
			const exists = await this.app.vault.adapter.exists(normalizedPath);

			if (!exists) {
				this.clearCustomCss();
				document.body.classList.add(EMBPlugin.DEFAULT_STYLES_CLASS);
				if (showNotice) {
					new Notice('Custom CSS file not found. Using default styles.');
				}
				return false;
			}

			const css = await this.app.vault.adapter.read(normalizedPath);
			this.setCustomCss(css);
			document.body.classList.remove(EMBPlugin.DEFAULT_STYLES_CLASS);
			if (showNotice) {
				new Notice('Custom editor mode CSS loaded.');
			}
			return true;
		} catch (error) {
			console.error('Failed to load custom editor mode CSS', error);
			this.clearCustomCss();
			document.body.classList.add(EMBPlugin.DEFAULT_STYLES_CLASS);
			if (showNotice) {
				new Notice('Failed to load custom CSS. Using default styles.');
			}
			return false;
		}
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

	/* OBSIDIAN SETTINGS */

	private onObsidianSettingsChange({
		current,
		previous,
	}: ObsidianSettingsChange): void {
		if (current.defaultViewMode !== previous.defaultViewMode) {
			if (!isEditorMode(current.defaultViewMode)) {
				return;
			}

			void this.modeChanged(current.defaultViewMode);
		}
	}

	private async setModeFromStartupValue(): Promise<void> {
		await setMode(this.obsidianSettings, this.settings.startupMode);
	}

	/* RIBBON */

	private updateRibbonIcon() {
		if (!this.ribbonButton) {
			return;
		}

		setIcon(
			this.ribbonButton,
			this.mode === 'source' ? 'pencil' : 'book-open',
		);
	}

	private async onRibbonIconPress(): Promise<void> {
		await cycleMode(this.obsidianSettings);
	}
}
