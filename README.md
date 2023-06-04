# alias-tool

## Features

1. scss: `@import "@alias/path";` , `@use "@alias/path";` and `url(@alias/path.png) ` go to definition / links
2. css: `@import "@alias/path";` and `url(@alias/path.png) ` links
3. js / ts: `import "@alias/path.png"` go to definition
4. fix `.png?query` go to definition

## Extension Settings

`alias-tool.mappings`:

```
{
    "alias-tool.mappings": {
        "app": "${folder}/frontend/app",
        "@client": "${folder}/frontend/app",
        "~@client": "${folder}/frontend/app"
    }
}
```

Supported variables:

| Name | Description |
|------|-------------|
| `${folder}` | The root folder of the current file |
| `${workspace}` | The root folder of the current workspace |

## See also

- use [Path Autocomplete](https://marketplace.visualstudio.com/items?itemName=ionutvmi.path-autocomplete) for autocomplete

## Acknowledgements

- https://github.com/mihai-vlc/path-autocomplete
