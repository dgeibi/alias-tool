import * as vscode from 'vscode';
import { getConfig } from './getConfig';
import { resolveAsset } from './resolveAsset';

export class CSSImportDefinitionProvider implements vscode.DefinitionProvider {
  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Definition | undefined> {
    const line = document.lineAt(position);
    const importRegex = /@import\s+['"](.+?)['"];/;
    const match = importRegex.exec(line.text);
    if (!match) {
      return undefined;
    }
    const importPath = match[1];
    const config = getConfig(document);
    const targetUri = await resolveAsset(importPath, config, document);
    if (targetUri) {
      const range = new vscode.Range(0, 0, 0, 0);
      return new vscode.Location(targetUri, range);
    }
  }
}
