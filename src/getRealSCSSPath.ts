import { URI, Utils } from 'vscode-uri';
import { fileExists } from './fileExists';

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

export async function getRealSCSSPath(path: string) {
  for (const variation of toPathVariations(path)) {
    if (await fileExists(variation)) {
      return variation;
    }
  }
}
