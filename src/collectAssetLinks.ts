import * as vscode from 'vscode';
import { type Configuration } from './getConfig';
import { resolveAsset } from './resolveAsset';

export async function collectAssetLinks(
  regex: RegExp,
  text: string,
  document: vscode.TextDocument,
  links: vscode.DocumentLink[],
  config: Configuration
) {
  let match: RegExpExecArray | null;
  const todos: Array<() => Promise<void>> = [];
  while ((match = regex.exec(text)) !== null) {
    const { index, 0: match0, 1: prefix, 2: importPath, 3: suffix } = match;
    if (!importPath.includes('.')) {
      continue;
    }
    todos.push(async () => {
      const targetUri = await resolveAsset(importPath, config, document);
      if (targetUri) {
        const range = new vscode.Range(
          document.positionAt(index + prefix.length),
          document.positionAt(index + match0.length - (suffix?.length || 0))
        );
        const link = new vscode.DocumentLink(range, targetUri);
        links.push(link);
      }
    });
  }
  if (todos.length) {
    await Promise.all(todos.map((fn) => fn()));
  }
}
