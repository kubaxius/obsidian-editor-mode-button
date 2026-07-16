import {
	Plugin,
	normalizePath,
	setIcon,
} from 'obsidian';
import { DEFAULT_SETTINGS, EMBSettingTab, EMBSettings } from './settings';

const TOGGLE_DEFAULT_NEW_TAB_MODE_COMMAND_ID = 'app:toggle-default-new-pane-mode';

interface ObsidianCommands {
	executeCommandById(commandId: string): boolean;
}

interface AppWithCommands {
	commands: ObsidianCommands;
}

export default class EMBPlugin extends Plugin {
	settings!: EMBSettings;
	ribbonEl?: HTMLElement;

	editorMode: EMBSettings['defaultMode'] = DEFAULT_SETTINGS.defaultMode;

	async onload() {
		await this.loadSettings();
		await this.syncEditorModeFromObsidian();

		// This creates an icon in the left ribbon.
		this.ribbonEl = this.addRibbonIcon(
			'book-open',
			'Sample',
			(_evt: MouseEvent) => {
				// Called when the user clicks the icon.
				void this.toggleMode();
			},
		);
		this.updateRibbonIcon();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'switch-editor-mode-and-reload-files',
			name: 'Switch editor mode and reload files',
			callback: () => {
				// TODO: Implementation for switching editor mode and reloading files
				void this.toggleMode();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new EMBSettingTab(this.app, this));
	}

	onunload() {}

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

	async syncEditorModeFromObsidian() {
		const obsidianDefaultMode = await this.getObsidianDefaultMode();

		if (!obsidianDefaultMode) {
			this.editorMode = this.settings.defaultMode;
			return;
		}

		this.editorMode = obsidianDefaultMode;
		this.settings.defaultMode = obsidianDefaultMode;
		await this.saveSettings();
	}

	async toggleMode() {
		this.getCommands().executeCommandById(TOGGLE_DEFAULT_NEW_TAB_MODE_COMMAND_ID);

		this.editorMode = this.editorMode === 'editor' ? 'preview' : 'editor';
		this.settings.defaultMode = this.editorMode;
		await this.saveSettings();
		this.updateRibbonIcon();
	}

	updateRibbonIcon() {
		if (!this.ribbonEl) {
			return;
		}

		setIcon(
			this.ribbonEl,
			this.editorMode === 'editor' ? 'pencil' : 'book-open',
		);
	}

	async getObsidianDefaultMode(): Promise<EMBSettings['defaultMode'] | null> {
		const appConfigPath = normalizePath(`${this.app.vault.configDir}/app.json`);

		try {
			const rawConfig = await this.app.vault.adapter.read(appConfigPath);
			const appConfig = JSON.parse(rawConfig) as Record<string, unknown>;

			return this.toEditorMode(appConfig.defaultViewMode);
		} catch {
			return null;
		}
	}

	toEditorMode(value: unknown): EMBSettings['defaultMode'] | null {
		if (value === 'source' || value === 'editor') {
			return 'editor';
		}

		if (value === 'preview') {
			return 'preview';
		}

		return null;
	}

	getCommands(): ObsidianCommands {
		return (this.app as typeof this.app & AppWithCommands).commands;
	}
}
