import {
	App,
	Component,
	EventRef,
	Events,
	normalizePath,
	PluginSettingTab,
	Setting,
} from 'obsidian';
import EMBPlugin from '@src/main';
import { editorMode } from './editor-mode';

export interface EMBSettings {
	startupMode: editorMode;
	customCssPath: string;
}

export const DEFAULT_SETTINGS: EMBSettings = {
	startupMode: 'source',
	customCssPath: '',
};

export const OBSIDIAN_SETTINGS_CHANGE_EVENT = 'change';

export type ObsidianSettingsJson = Record<string, unknown>;

export interface ObsidianSettingsChange {
	current: ObsidianSettingsJson;
	previous: ObsidianSettingsJson;
}

export type ObsidianSettingsChangeHandler = (
	change: ObsidianSettingsChange,
) => void;

export type ObsidianSettingsPath = string | string[];

export class EMBSettingTab extends PluginSettingTab {
	plugin: EMBPlugin;

	constructor(app: App, plugin: EMBPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions() {
		return [
			{
				name: 'Editor mode on startup',
				desc: 'Set the default editor mode that is set on Obsidian startup',
				control: {
					type: 'dropdown',
					key: 'startupMode',
					defaultValue: 'preview',
					options: { preview: 'Preview', source: 'Source' },
				},
			},
			{
				name: 'Custom CSS file',
				desc: 'Use a vault-relative CSS file instead of the default styles',
				control: {
					type: 'text',
					key: 'customCssPath',
					defaultValue: '',
				},
			},
		];
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Editor mode on startup')
			.setDesc(
				'Set the default editor mode that is set on Obsidian startup',
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption('preview', 'Preview')
					.addOption('source', 'Source')
					.setValue(this.plugin.settings.startupMode)
					.onChange(async (value) => {
						this.plugin.settings.startupMode = value as editorMode;
						await this.plugin.saveSettings();
					}),
				);

		new Setting(containerEl)
			.setName('Custom CSS file')
			.setDesc(
				'Use a vault-relative CSS file instead of the default styles.',
			)
			.addText((text) =>
				text
					.setPlaceholder('styles/editor-mode.css')
					.setValue(this.plugin.settings.customCssPath)
					.onChange(async (value) => {
						this.plugin.settings.customCssPath = value.trim();
						await this.plugin.saveSettings();
					}),
			)
			.addButton((button) =>
				button.setButtonText('Apply').onClick(async () => {
					await this.plugin.loadCustomCss(true);
				}),
			);
	}
}

export class ObsidianSettings extends Events {
	private app: App;
	private configPath: string;
	private lastMtime: number | null = null;
	private lastJson: ObsidianSettingsJson | null = null;

	constructor(app: App) {
		super();
		this.configPath = normalizePath(`${app.vault.configDir}/app.json`);
		this.app = app;
	}

	private async checkForChanges(): Promise<void> {
		const stat = await this.app.vault.adapter.stat(this.configPath);

		if (stat?.mtime === this.lastMtime) {
			return;
		}

		const previous = this.lastJson;
		const current = await this.getJson();
		this.lastJson = current;

		this.lastMtime = stat?.mtime ?? null;

		if (!previous) {
			return;
		}

		this.trigger(OBSIDIAN_SETTINGS_CHANGE_EVENT, {
			current,
			previous,
		} satisfies ObsidianSettingsChange);
	}

	private handleChangeCheckError(error: unknown): void {
		console.error('Failed to check Obsidian settings for changes', error);
	}

	watch(component: Component, intervalMs = 1500): void {
		void this.checkForChanges().catch((error) => {
			this.handleChangeCheckError(error);
		});

		component.registerInterval(
			window.setInterval(() => {
				void this.checkForChanges().catch((error) => {
					this.handleChangeCheckError(error);
				});
			}, intervalMs),
		);
	}

	// signal
	onChange(callback: ObsidianSettingsChangeHandler): EventRef {
		return this.on(OBSIDIAN_SETTINGS_CHANGE_EVENT, (change) => {
			callback(change as ObsidianSettingsChange);
		});
	}

	async getJson(): Promise<ObsidianSettingsJson> {
		try {
			const rawConfig = await this.app.vault.adapter.read(
				this.configPath,
			);
			const appConfig = JSON.parse(rawConfig) as ObsidianSettingsJson;
			return appConfig;
		} catch {
			throw new Error('Failed to read Obsidian settings JSON');
		}
	}

	async updateJson(
		update: (settings: ObsidianSettingsJson) => void | Promise<void>,
	): Promise<ObsidianSettingsJson> {
		const previous = await this.getJson();
		const current = structuredClone(previous);

		await update(current);
		await this.writeJson(current);
		this.lastJson = current;

		this.trigger(OBSIDIAN_SETTINGS_CHANGE_EVENT, {
			current,
			previous,
		} satisfies ObsidianSettingsChange);

		return current;
	}

	private async writeJson(settings: ObsidianSettingsJson): Promise<void> {
		try {
			await this.app.vault.adapter.write(
				this.configPath,
				JSON.stringify(settings),
			);
			const stat = await this.app.vault.adapter.stat(this.configPath);
			this.lastMtime = stat?.mtime ?? null;
		} catch {
			throw new Error('Failed to write Obsidian settings JSON');
		}
	}
}
