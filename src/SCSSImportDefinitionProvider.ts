import * as vscode from 'vscode';
import { URI, Utils } from 'vscode-uri';
import { resolveSCSS } from './resolveSCSS';
import { getConfig } from './getConfig';
import { resolveAliasTarget } from './resolveAliasTarget';
import { normalizeImportPath } from './normalizeImportPath';

export class SCSSImportDefinitionProvider implements vscode.DefinitionProvider {
  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Definition | undefined> {
    const line = document.lineAt(position);
    const importRegex = /@import\s+['"](.+?)['"];/;
    const match = importRegex.exec(line.text);
    const originImportPath = match && match[1];
    if (!originImportPath) {
      return undefined;
    }
    if (originImportPath.startsWith('sass:')) {
      return undefined; // sass library
    }
    const config = getConfig(document);
    const { array: mappings } = config;
    const importPath = normalizeImportPath(originImportPath);
    const aliasMatchItem = mappings.find((item) =>
      importPath.startsWith(item.prefix + '/')
    );
    let finalPath: string | undefined;
    if (aliasMatchItem) {
      const targetPrefixUri = resolveAliasTarget(aliasMatchItem.target, config);
      if (targetPrefixUri) {
        finalPath = Utils.joinPath(
          targetPrefixUri,
          importPath.replace(aliasMatchItem.prefix, '')
        ).toString(true);
      }
    } else {
      finalPath = Utils.joinPath(document.uri, '..', importPath).toString(true);
    }

    if (finalPath) {
      const variation = await resolveSCSS(finalPath);
      if (variation) {
        const uri = URI.parse(variation);
        const range = new vscode.Range(0, 0, 0, 0);
        return new vscode.Location(uri, range);
      }
    }
  }
}
