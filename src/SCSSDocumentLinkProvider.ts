import * as vscode from 'vscode';
import { Utils, URI } from 'vscode-uri';
import { getMappings } from './getMappings';
import { resolveSCSS } from './resolveSCSS';
import { escapeStringRegexp } from './escapeStringRegexp';
import { fileExists } from './fileExists';

export class SCSSDocumentLinkProvider implements vscode.DocumentLinkProvider {
  async provideDocumentLinks(
    document: vscode.TextDocument
  ): Promise<vscode.DocumentLink[]> {
    const links: vscode.DocumentLink[] = [];
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      return links;
    }
    const text = document.getText();
    const { array: mappings, map } = getMappings(document);
    if (mappings.length === 0) {
      return links;
    }
    const prefixs = mappings
      .map((item) => escapeStringRegexp(item.prefix))
      .join('|');

    await Promise.all([
      pushCSSLinks(prefixs, text, map, document, links, workspaceFolder),
      pushImportLinks(prefixs, text, map, document, links, workspaceFolder),
    ]);

    return links;
  }
}

async function pushImportLinks(
  prefixs: string,
  text: string,
  map: Record<string, string>,
  document: vscode.TextDocument,
  links: vscode.DocumentLink[],
  workspaceFolder: vscode.WorkspaceFolder
) {
  const regex = new RegExp(
    `(@(?:import|use)\\s+)['"]((${prefixs})\/.+?)['"]`,
    'g'
  );
  let match: RegExpExecArray | null;
  const todos: Array<() => Promise<void>> = [];
  while ((match = regex.exec(text)) !== null) {
    const importPath = match[2].replace(/\?.*/, '');
    const pre = match[3];
    const target = map[pre];
    const prefixLength = match[1].length;
    const range = new vscode.Range(
      document.positionAt(match.index + prefixLength),
      document.positionAt(match.index + match[0].length)
    );

    todos.push(async () => {
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
    });
  }

  if (todos.length) {
    await Promise.all(todos.map((fn) => fn()));
  }
}

async function pushCSSLinks(
  prefixs: string,
  text: string,
  map: Record<string, string>,
  document: vscode.TextDocument,
  links: vscode.DocumentLink[],
  workspaceFolder: vscode.WorkspaceFolder
) {
  const regex = new RegExp(`url\\(['"]?((${prefixs})\/.+?)['"]?\\)`, 'g');
  let match: RegExpExecArray | null;
  const todos: Array<() => Promise<void>> = [];
  while ((match = regex.exec(text)) !== null) {
    const importPath = match[1].replace(/\?.*/, '');
    const pre = match[2];
    const target = map[pre];
    const prefixLength = 4;
    const range = new vscode.Range(
      document.positionAt(match.index + prefixLength),
      document.positionAt(match.index + match[0].length - 1)
    );
    const targetPath = Utils.joinPath(
      workspaceFolder.uri,
      target,
      importPath.replace(pre, '')
    );
    todos.push(async () => {
      if (await fileExists(targetPath.toString(true))) {
        const link = new vscode.DocumentLink(range, targetPath);
        links.push(link);
      }
    });
  }
  if (todos.length) {
    await Promise.all(todos.map((fn) => fn()));
  }
}
