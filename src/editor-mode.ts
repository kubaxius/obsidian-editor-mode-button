import { App, MarkdownView } from 'obsidian';
import { ObsidianSettings } from './settings';

export type editorMode = 'preview' | 'source';

export function isEditorMode(value: unknown): value is editorMode {
	return value === 'preview' || value === 'source';
}

function nextMode(current: editorMode): editorMode {
	if (current === 'preview') return 'source';
	if (current === 'source') return 'preview';

	return 'source';
}

export async function setMode(
	obsidianSettings: ObsidianSettings,
	mode: editorMode,
) {
	await obsidianSettings.updateJson((settings) => {
		settings.defaultViewMode = mode;
	});
}

export async function cycleMode(obsidianSettings: ObsidianSettings) {
	await obsidianSettings.updateJson((settings) => {
		const mode = nextMode(settings.defaultViewMode as editorMode);
		settings.defaultViewMode = mode;
	});
}

export async function applyModeToOpenMarkdownViews(
	mode: editorMode,
	app: App,
): Promise<void> {
	const leaves = app.workspace.getLeavesOfType('markdown');

	await Promise.all(
		leaves.map(async (leaf) => {
			if (leaf.isDeferred || !(leaf.view instanceof MarkdownView)) {
				return;
			}

			if (leaf.view.getMode() === mode) {
				return;
			}

			await leaf.view.setState(
				{
					...leaf.view.getState(),
					mode,
				},
				{ history: false },
			);
		}),
	);
}
