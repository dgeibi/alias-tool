// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

class SCSSImportDefinitionProvider implements vscode.DefinitionProvider {
  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Definition | undefined> {
    const line = document.lineAt(position);
    const importRegex = /@import\s+['"](.*)['"];/;
    const match = importRegex.exec(line.text);
    const originImportPath = match && match[1];
    if (!originImportPath) {
      return undefined;
    }
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      return undefined;
    }
    const config = vscode.workspace.getConfiguration(
      'alias-tool',
      document.uri
    );
    const mappings = config.get<Record<string, string>>('mappings') || {};
    const conf = Object.entries(mappings).map(([prefix, target]) => ({
      prefix,
      target,
    }));
    const matchConf = conf.find((item) =>
      originImportPath.startsWith(item.prefix + '/')
    );
    let pathWidthExt: string;
    if (matchConf) {
      pathWidthExt = path.join(
        workspaceFolder.uri.fsPath,
        matchConf.target,
        originImportPath.replace(matchConf.prefix, '')
      );
    } else {
      pathWidthExt = path.join(document.fileName, '..', originImportPath);
    }

    const importPath = pathWidthExt.endsWith('.scss')
      ? pathWidthExt
      : pathWidthExt + '.scss';

    const uri = vscode.Uri.file(importPath);
    const range = new vscode.Range(0, 0, 0, 0);
    return new vscode.Location(uri, range);
  }
}

export function activate(context: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = {
    scheme: 'file',
    language: 'scss',
  };
  const provider = new SCSSImportDefinitionProvider();
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, provider)
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
