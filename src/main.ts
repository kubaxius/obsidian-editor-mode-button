import { MarkdownView, Plugin, setIcon } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	EMBSettingTab,
	EMBSettings,
	ObsidianSettings,
} from './settings';
import {
	applyModeToOpenMarkdownViews,
	editorMode,
	nextMode,
} from './editor-mode';

const TOGGLE_DEFAULT_NEW_TAB_MODE_COMMAND_ID =
	'app:toggle-default-new-pane-mode';

interface ObsidianCommands {
	executeCommandById(commandId: string): boolean;
}

interface AppWithCommands {
	commands: ObsidianCommands;
}

export default class EMBPlugin extends Plugin {
	settings!: EMBSettings;
	obsidianSettings = new ObsidianSettings(this.app);
	ribbonButton?: HTMLElement;

	/* STARTUP AND UNLOAD */

	async onload() {
		await this.loadSettings();

		// Watch for changes in obsidian settings.
		this.registerEvent(
			this.obsidianSettings.onChange(({ current, previous }) => {
				console.log(current.defaultViewMode);
			}),
		);
		this.obsidianSettings.watch(this);

		this.app.workspace.onLayoutReady(() => {
			void this.setModeFromStartupValue();
		});

		// This creates an icon in the left ribbon.
		this.ribbonButton = this.addRibbonIcon(
			'book-open',
			'Sample',
			async (_evt: MouseEvent) => {
				// Called when the user clicks the icon.
				await this.ribbonIconPress();
			},
		);

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'switch-editor-mode-and-reload-files',
			name: 'Switch editor mode and reload files',
			callback: () => {},
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

	/* RIBBON ICON */

	private updateRibbonIcon(mode: editorMode) {
		if (!this.ribbonButton) {
			return;
		}

		setIcon(this.ribbonButton, mode === 'source' ? 'pencil' : 'book-open');
	}

	private async ribbonIconPress(): Promise<void> {
		let mode: editorMode = this.settings.startupMode;

		await this.obsidianSettings.updateJson((settings) => {
			mode = nextMode(settings.defaultViewMode as editorMode);
			settings.defaultViewMode = mode;
		});

		this.updateRibbonIcon(mode);
		await applyModeToOpenMarkdownViews(mode, this.app);
	}

	private async setModeFromStartupValue(): Promise<void> {
		await this.obsidianSettings.updateJson((settings) => {
			settings.defaultViewMode = this.settings.startupMode;
		});
		await applyModeToOpenMarkdownViews(this.settings.startupMode, this.app);
	}
}
