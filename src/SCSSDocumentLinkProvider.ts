import * as vscode from 'vscode';
import { Utils, URI } from 'vscode-uri';
import { getMappings } from './getMappings';
import { resolveSCSS } from './resolveSCSS';
import { escapeStringRegexp } from './escapeStringRegexp';

export class SCSSDocumentLinkProvider implements vscode.DocumentLinkProvider {
  async provideDocumentLinks(
    document: vscode.TextDocument
  ): Promise<vscode.DocumentLink[]> {
    const links: vscode.DocumentLink[] = [];
    const text = document.getText();
    const { array: mappings, map } = getMappings(document);
    if (mappings.length === 0) {
      return links;
    }
    const prefixs = mappings
      .map((item) => escapeStringRegexp(item.prefix))
      .join('|');
    pushCSSLinks(prefixs, text, map, document, links);
    await pushImportLinks(prefixs, text, map, document, links);
    return links;
  }
}

async function pushImportLinks(
  prefixs: string,
  text: string,
  map: Record<string, string>,
  document: vscode.TextDocument,
  links: vscode.DocumentLink[]
) {
  const regex = new RegExp(`@import\\s+['"]((${prefixs})\/.+?)['"]`, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const importPath = match[1].replace(/\?.*/, '');
    const pre = match[2];
    const target = map[pre];
    const prefix = /@import\s+/.exec(match[0]);
    const prefixLength = prefix && prefix[0] ? prefix && prefix[0].length : 0;
    const range = new vscode.Range(
      document.positionAt(match.index + prefixLength),
      document.positionAt(match.index + match[0].length)
    );
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      const targetPath = await resolveSCSS(
        Utils.joinPath(
          workspaceFolder.uri,
          target,
          importPath.replace(pre, '')
        ).toString(true)
      );
      if (targetPath) {
        const link = new vscode.DocumentLink(range, URI.parse(targetPath));
        links.push(link);
      }
    }
  }
}

export function pushCSSLinks(
  prefixs: string,
  text: string,
  map: Record<string, string>,
  document: vscode.TextDocument,
  links: vscode.DocumentLink[]
) {
  const regex = new RegExp(`url\\(['"]?((${prefixs})\/.+?)['"]?\\)`, 'g');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const importPath = match[1].replace(/\?.*/, '');
    const pre = match[2];
    const target = map[pre];
    const prefixLength = 4;
    const range = new vscode.Range(
      document.positionAt(match.index + prefixLength),
      document.positionAt(match.index + match[0].length - 1)
    );
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      const targetPath = Utils.joinPath(
        workspaceFolder.uri,
        target,
        importPath.replace(pre, '')
      );
      const link = new vscode.DocumentLink(range, targetPath);
      links.push(link);
    }
  }
}
