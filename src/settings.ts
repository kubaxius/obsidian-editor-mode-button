import { App, PluginSettingTab, Setting } from 'obsidian';
import EMBPlugin from './main';

export interface EMBSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: EMBSettings = {
	mySetting: 'default',
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
			.setName('Settings #1')
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder('Enter your secret')
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
