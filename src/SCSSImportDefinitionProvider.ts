import * as vscode from 'vscode';
import { URI, Utils } from 'vscode-uri';
import { resolveSCSS } from './resolveSCSS';
import { getMappings } from './getMappings';

export class SCSSImportDefinitionProvider implements vscode.DefinitionProvider {
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
    const { array: mappings } = getMappings(document);
    const matchConf = mappings.find((item) =>
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

    const variation = await resolveSCSS(pathWidthExt);
    if (variation) {
      const uri = URI.parse(variation);
      const range = new vscode.Range(0, 0, 0, 0);
      return new vscode.Location(uri, range);
    }
  }
}
