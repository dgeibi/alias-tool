import * as vscode from 'vscode';
import { Utils, URI } from 'vscode-uri';
import { getConfig, type Configuration } from './getConfig';
import { resolveSCSS } from './resolveSCSS';
import { escapeStringRegexp } from './escapeStringRegexp';
import { resolveAliasTarget } from './resolveAliasTarget';
import { normalizeImportPath } from './normalizeImportPath';
import { resolveAsset } from './resolveAsset';

export class SCSSDocumentLinkProvider implements vscode.DocumentLinkProvider {
  async provideDocumentLinks(
    document: vscode.TextDocument
  ): Promise<vscode.DocumentLink[]> {
    const links: vscode.DocumentLink[] = [];
    const text = document.getText();
    const config = getConfig(document);

    await Promise.all([
      pushAssetLinks(text, document, links, config),
      pushImportLinks(text, document, links, config),
    ]);

    return links;
  }
}

async function pushImportLinks(
  text: string,
  document: vscode.TextDocument,
  links: vscode.DocumentLink[],
  config: Configuration
) {
  const { array: mappings, map } = config;
  if (mappings.length) {
    return;
  }
  const prefixs = mappings
    .map((item) => escapeStringRegexp(item.prefix))
    .join('|');

  const regex = new RegExp(
    `(@(?:import|use)\\s+)['"]((${prefixs})\/.+?)['"]`,
    'g'
  );
  let match: RegExpExecArray | null;
  const todos: Array<() => Promise<void>> = [];
  while ((match = regex.exec(text)) !== null) {
    const importPath = normalizeImportPath(match[2]);
    const pre = match[3];
    const target = map[pre];
    const prefixLength = match[1].length;
    const range = new vscode.Range(
      document.positionAt(match.index + prefixLength),
      document.positionAt(match.index + match[0].length)
    );
    const prefixUri = resolveAliasTarget(target, config);
    if (!prefixUri) {
      continue;
    }
    todos.push(async () => {
      const targetPath = await resolveSCSS(
        Utils.joinPath(prefixUri, importPath.replace(pre, '')).toString(true)
      );
      if (targetPath) {
        const link = new vscode.DocumentLink(range, URI.parse(targetPath));
        links.push(link);
      }
    });
  }

  if (todos.length) {
    await Promise.all(todos.map((fn) => fn()));
  }
}

async function pushAssetLinks(
  text: string,
  document: vscode.TextDocument,
  links: vscode.DocumentLink[],
  config: Configuration
) {
  const regex = /url\(\s*['"]?(.+?)['"]?\s*\)/g;
  let match: RegExpExecArray | null;
  const todos: Array<() => Promise<void>> = [];
  while ((match = regex.exec(text)) !== null) {
    const { index, 0: match0, 1: importPath } = match;
    if (!importPath.includes('.')) {
      continue;
    }
    todos.push(async () => {
      const targetUri = await resolveAsset(importPath, config, document);
      if (targetUri) {
        const prefixLength = 4;
        const range = new vscode.Range(
          document.positionAt(index + prefixLength),
          document.positionAt(index + match0.length - 1)
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
