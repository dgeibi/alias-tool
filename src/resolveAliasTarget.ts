import { URI } from 'vscode-uri';
import { type Configuration } from './getConfig';

export function resolveAliasTarget(target: string, config: Configuration) {
  let path = target;
  if (config.workspaceFolder) {
    path = path.replace('${folder}', config.workspaceFolder.uri.toString(true));
  }
  if (config.workspaceRootFolder) {
    path = path.replace(
      '${workspace}',
      config.workspaceRootFolder.uri.toString(true)
    );
  }
  if (path.startsWith('file:')) {
    return URI.parse(path);
  } else {
    return null;
  }
}
