import { App, View } from 'obsidian';
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

type ModeAwareView = View & {
	getMode(): unknown;
};

function hasModeGetter(view: View): view is ModeAwareView {
	return (
		'getMode' in view &&
		typeof (view as Partial<ModeAwareView>).getMode === 'function'
	);
}

function getModeFromView(view: View): editorMode | null {
	if (hasModeGetter(view)) {
		const mode = view.getMode();

		if (isEditorMode(mode)) {
			return mode;
		}
	}

	const mode = view.getState().mode;

	if (isEditorMode(mode)) {
		return mode;
	}

	return null;
}

export async function applyModeToOpenViews(
	mode: editorMode,
	app: App,
): Promise<void> {
	const updates: Promise<void>[] = [];

	app.workspace.iterateAllLeaves((leaf) => {
		if (leaf.isDeferred) {
			return;
		}

		const currentMode = getModeFromView(leaf.view);

		if (!currentMode || currentMode === mode) {
			return;
		}

		updates.push(
			leaf.view.setState(
				{
					...leaf.view.getState(),
					mode,
				},
				{ history: false },
			),
		);
	});

	await Promise.all(updates);
}
