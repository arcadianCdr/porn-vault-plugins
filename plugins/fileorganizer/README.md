## fileorganizer 0.0.1

by arcadianCdr

File and folder organizer plugin (using porn-vault's structured data). It uses your custom-defined templates to rename and/or move your scenes.

### Documentation

## Supported variables

TODO

### Arguments

| Name                        | Type     | Required | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dry                         | Boolean  | false    | Whether to perform the rename/move operation                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| fileStructure               | String   | true     | The template for the new name. Blocks are delimited with `{}`. Iside blocks, variables are delimited with `<>`.  All other characters are considered fixed text. If a fixed text is within a block, it will be used only if at least one block variable is defined (not empty). Fixed text outside of blocks is always used. For a list of allowed variables, please refer to the documentation above. Leave empty to not modify the file structure. Example: `{<studio>}{ - <releaseDate>}{ - <actors>}{ - <name>}` |
| folderStructure             | String   | false    | The template for the folder names. Blocks are delimited with `{}`. Variables are delimited with `<>`. `/` or `\` can be used indifferently as path separator. The structure is relative to the library path that is considered the 'base' folder. Leave empty to not modify the folder structure. Example: `{<studio>}{/<movie.name>}`                                                                                                                                                                               |
| normalizeAccents            | Boolean  | false    | Whether to normalize file names and path to unaccented unicode                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| normalizeMultipleSpaces     | Boolean  | false    | Whether to replace multiple spaces with a single space                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| nameConflictHandling        | String   | true     | Behavior in case of name conflicts. Possible values are: `rename`, `overwrite` and `skip`. For 'rename', the new filename will be suffixed with a number so that it does not conflict with an existing name anymore. For 'overwrite', the existing file will be overriden by the new one. For 'skip', the rename operation is cancelled.                                                                                                                                                                             |
| multipleValuesSeparator     | String   | true     | The separator to use for multiple values (like actors, labels,...). For instance, with a `,` as separator, the list of labels will be: `label1, label2, label3`.                                                                                                                                                                                                                                                                                                                                                     |
| invalidCharacterReplacement | String[] | false    | By default, characters that are invalid in a filename are removed. Alternatively, this argument can be used to use a substitute instead of a pure deletion. Supported invalid characters are: `"`, `/`, `*`, `<`, `?`, `>`, `:` and `\|`).                                                                                                                                                                                                                                                                           |
| filesBlacklist              | String[] | false    | files to ignore. Wildcards can be used.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| foldersBlacklist            | String[] | false    | folders to ignore. Wildcards can be used. Relative to base library path.                                                                                                                                                                                                                                                                                                                                                                                                                                             |

### Example installation with default arguments

`config.json`
```json
---
{
  "plugins": {
    "register": {
      "fileorganizer": {
        "path": "./plugins/fileorganizer/main.ts",
        "args": {
          "dry": false,
          "fileStructure": "",
          "folderStructure": "",
          "normalizeAccents": false,
          "normalizeMultipleSpaces": true,
          "nameConflictHandling": "rename",
          "multipleValuesSeparator": ",",
          "invalidCharacterReplacement": "",
          "filesBlacklist": "[]",
          "foldersBlacklist": "[]"
        }
      }
    },
    "events": {
      "sceneCreated": [
        "fileorganizer"
      ],
      "sceneCustom": [
        "fileorganizer"
      ]
    }
  }
}
---
```

`config.yaml`
```yaml
---
plugins:
  register:
    fileorganizer:
      path: ./plugins/fileorganizer/main.ts
      args:
        dry: false
        fileStructure: ""
        folderStructure: ""
        normalizeAccents: false
        normalizeMultipleSpaces: true
        nameConflictHandling: rename
        multipleValuesSeparator: ","
        invalidCharacterReplacement: ""
        filesBlacklist: "[]"
        foldersBlacklist: "[]"
  events:
    sceneCreated:
      - fileorganizer
    sceneCustom:
      - fileorganizer

---
```
