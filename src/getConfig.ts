import * as vscode from 'vscode';

export function getConfig(document: vscode.TextDocument) {
  const config = vscode.workspace.getConfiguration('alias-tool', document.uri);
  const mappings = config.get<Record<string, string>>('mappings') || {};
  const conf = Object.entries(mappings).map(([prefix, target]) => ({
    prefix,
    target,
  }));
  const workspaceRootFolder = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0]
    : undefined;
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  return { map: mappings, array: conf, workspaceRootFolder, workspaceFolder };
}

export type Configuration = ReturnType<typeof getConfig>;
