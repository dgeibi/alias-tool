// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { URI, Utils } from 'vscode-uri';

class SCSSImportDefinitionProvider implements vscode.DefinitionProvider {
  protected async fileExists(uri: string): Promise<boolean> {
    try {
      const stat = await vscode.workspace.fs.stat(URI.parse(uri));
      if (stat.type === vscode.FileType.Unknown && stat.size === -1) {
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  }

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
    if (originImportPath.startsWith('sass:')) {
      return undefined; // sass library
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
      pathWidthExt = Utils.joinPath(
        workspaceFolder.uri,
        matchConf.target,
        originImportPath.replace(matchConf.prefix, '')
      ).toString(true);
    } else {
      pathWidthExt = Utils.joinPath(
        document.uri,
        '..',
        originImportPath
      ).toString(true);
    }

    for (const variation of toPathVariations(pathWidthExt)) {
      if (await this.fileExists(variation)) {
        const uri = URI.parse(variation);
        const range = new vscode.Range(0, 0, 0, 0);
        return new vscode.Location(uri, range);
      }
    }
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

function toPathVariations(target: string): string[] {
  // No variation for links that ends with suffix
  if (target.endsWith('.scss') || target.endsWith('.css')) {
    return [target];
  }

  // If a link is like a/, try resolving a/index.scss and a/_index.scss
  if (target.endsWith('/')) {
    return [target + 'index.scss', target + '_index.scss'];
  }

  const targetUri = URI.parse(target);
  const basename = Utils.basename(targetUri);
  const dirname = Utils.dirname(targetUri);
  if (basename.startsWith('_')) {
    // No variation for links such as _a
    return [Utils.joinPath(dirname, basename + '.scss').toString(true)];
  }

  return [
    Utils.joinPath(dirname, basename + '.scss').toString(true),
    Utils.joinPath(dirname, '_' + basename + '.scss').toString(true),
    target + '/index.scss',
    target + '/_index.scss',
    Utils.joinPath(dirname, basename + '.css').toString(true),
  ];
}
