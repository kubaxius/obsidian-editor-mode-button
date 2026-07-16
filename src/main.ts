import { Plugin, setIcon } from 'obsidian';
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
	settings!: EMBSettings;
	obsidianSettings = new ObsidianSettings(this.app);
	ribbonButton?: HTMLElement;

	mode!: editorMode;

	/* MAIN LOGIC */

	// This function is ran every time the mode setting changes in the obsidian settings.
	private async modeChanged(mode: editorMode) {
		this.mode = mode;
		this.updateRibbonIcon();
		await applyModeToOpenMarkdownViews(this.mode, this.app);
	}

	/* STARTUP AND UNLOAD */

	async onload() {
		await this.loadSettings();

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

	onunload() {}

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

	/* RIBBON ICON */

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
