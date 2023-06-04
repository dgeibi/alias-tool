import * as vscode from 'vscode';
import { URI, Utils } from 'vscode-uri';
import { Configuration, getConfig } from './getConfig';
import { escapeStringRegexp } from './escapeStringRegexp';
import { fileExists } from './fileExists';
import { resolveAliasTarget } from './resolveAliasTarget';
import { normalizeImportPath } from './normalizeImportPath';
import { getRealSCSSPath } from './getRealSCSSPath';

function isWithSearch(importPath: string) {
  return importPath.includes('?') && importPath[0] === '.';
}

let cache: [
  {
    prefix: string;
    target: string;
  }[],
  RegExp | null
];

const getPrefixRegExp = (
  array: {
    prefix: string;
    target: string;
  }[]
) => {
  if (cache && cache[0] === array) {
    return cache[1];
  }
  const ret =
    array.length !== 0
      ? new RegExp(
          `^(${array
            .map((item) => escapeStringRegexp(item.prefix))
            .join('|')})\/`
        )
      : null;
  cache = [array, ret];
  return ret;
};

async function defaultResolver(path: string) {
  if (path && (await fileExists(path))) {
    return URI.parse(path);
  }
  return null;
}

export async function resolveAsset(
  importPath: string,
  config: Configuration,
  document: vscode.TextDocument,
  resolver = defaultResolver
) {
  const prefixRegExp = getPrefixRegExp(config.array);
  let targetUri: URI | null = null;
  const result = prefixRegExp && prefixRegExp.exec(importPath);
  if (result) {
    const pre = result[1];
    const target = config.map[pre];
    const targetPrefix = resolveAliasTarget(target, config);
    if (targetPrefix) {
      targetUri = Utils.joinPath(
        targetPrefix,
        normalizeImportPath(importPath).replace(pre, '')
      );
    }
  } else if (isWithSearch(importPath)) {
    // fix links with search
    targetUri = Utils.joinPath(
      document.uri,
      '..',
      normalizeImportPath(importPath)
    );
  }
  if (targetUri) {
    targetUri = await resolver(targetUri.toString(true));
  }
  return targetUri;
}

export function resolveSCSS(
  importPath: string,
  config: Configuration,
  document: vscode.TextDocument
) {
  return resolveAsset(importPath, config, document, async (path) => {
    const fileUri = await getRealSCSSPath(path);
    if (fileUri) {
      return URI.parse(fileUri);
    }
    return null;
  });
}
