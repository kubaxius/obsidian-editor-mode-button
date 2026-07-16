import { App, MarkdownView, normalizePath } from 'obsidian';

export type editorMode = 'preview' | 'source';

export function nextMode(current: editorMode): editorMode {
	if (current === 'preview') return 'source';
	if (current === 'source') return 'preview';

	return 'source';
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
