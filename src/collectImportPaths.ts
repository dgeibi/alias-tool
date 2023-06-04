import * as vscode from 'vscode';
import { type Configuration } from './getConfig';
import { resolveAsset } from './resolveAsset';
import { type URI } from 'vscode-uri';

const defaultIgnore = (path: string) => !path.includes('.');

export async function collectImportPaths(
  regex: RegExp,
  text: string,
  document: vscode.TextDocument,
  config: Configuration,
  ignoreImportPath = defaultIgnore,
  resolve = resolveAsset
): Promise<Array<{ range: [number,number]; uri: URI }>> {
  let match: RegExpExecArray | null;
  const todos: Array<() => Promise<void>> = [];
  const items: Array<{ range:[number,number]; uri: URI }> = [];
  while ((match = regex.exec(text)) !== null) {
    const { index, 0: match0, 1: prefix, 2: importPath, 3: suffix } = match;
    if (ignoreImportPath(importPath)) {
      continue;
    }
    todos.push(async () => {
      const targetUri = await resolve(importPath, config, document);
      if (targetUri) {
        items.push({
          uri: targetUri,
          range: [
            index + prefix.length,
            index + match0.length - (suffix?.length || 0)
          ]
        });
      }
    });
  }
  if (todos.length) {
    await Promise.all(todos.map((fn) => fn()));
    return items;
  }
  return items;
}
