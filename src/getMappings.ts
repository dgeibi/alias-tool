import * as vscode from 'vscode';

export function getMappings(document: vscode.TextDocument) {
  const config = vscode.workspace.getConfiguration('alias-tool', document.uri);
  const mappings = config.get<Record<string, string>>('mappings') || {};
  const conf = Object.entries(mappings).map(([prefix, target]) => ({
    prefix,
    target,
  }));
  return { map: mappings, array: conf };
}
