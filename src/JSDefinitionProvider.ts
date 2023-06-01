import * as vscode from 'vscode';
import { resolveAsset } from './resolveAsset';
import { getConfig } from './getConfig';

export class JSDefinitionProvider implements vscode.DefinitionProvider {
  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Definition | undefined> {
    const line = document.lineAt(position);
    const importRegex =
      /(?:\bimport\s*.+\s*\bfrom\b\s*|\bimport\s*)['"](.+?)['"]/;
    const match = importRegex.exec(line.text);
    const originImportPath = match && match[1];
    if (!originImportPath) {
      return undefined;
    }
    if (isIgnore(originImportPath)) {
      return undefined;
    }
    const targetUri = await resolveAsset(
      originImportPath,
      getConfig(document),
      document
    );
    if (targetUri) {
      const range = new vscode.Range(0, 0, 0, 0);
      return new vscode.Location(targetUri, range);
    }
  }
}

const jsExtensionReg = /\.(?:js|mjs|cjs|jsx|ts|tsx)$/;

// ignore file without .ext and js files
function isIgnore(importPath: string) {
  return !importPath.includes('.') || jsExtensionReg.test(importPath);
}
