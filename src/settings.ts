import { App, PluginSettingTab, Setting } from 'obsidian';
import EMBPlugin from '@src/main';
import { mode } from '@src/types';

export interface EMBSettings {
	defaultMode: mode;
}

export const DEFAULT_SETTINGS: EMBSettings = {
	defaultMode: 'editor',
};

export class EMBSettingTab extends PluginSettingTab {
	plugin: EMBPlugin;

	constructor(app: App, plugin: EMBPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Default Editor Mode')
			.setDesc('Set the default editor mode')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('editor', 'Editor')
					.addOption('preview', 'Preview')
					.setValue(this.plugin.settings.defaultMode)
					.onChange(async (value) => {
						this.plugin.settings.defaultMode = value as mode;
						await this.plugin.saveSettings();
					}),
			);
	}
}
