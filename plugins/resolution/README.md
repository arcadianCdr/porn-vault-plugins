## resolution 0.1.0

by boi123212321

Add resolution labels to a scene

### Download links
Each download link is for the latest version of the plugin, for the indicated porn-vault server version.  
Make sure you are reading the documentation of the plugin, for the correct porn-vault server version.  
| Server version                                                                                              | Plugin documentation                                                                                       |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [Download link for: stable](https://raw.githubusercontent.com/porn-vault/plugins/master/dist/resolution.js) | [documentation](https://github.com/porn-vault/porn-vault-plugins/blob/master/plugins/resolution/README.md) |
| [Download link for: 0.27](https://raw.githubusercontent.com/porn-vault/plugins/0.27/dist/resolution.js)     | [documentation](https://github.com/porn-vault/porn-vault-plugins/blob/0.27/plugins/resolution/README.md)   |


### Arguments

| Name        | Type     | Required | Description                                                                                         |
| ----------- | -------- | -------- | --------------------------------------------------------------------------------------------------- |
| resolutions | number[] | false    | Resolutions to match against the scene's path, when the scene's metadata has not yet been extracted |

### Example installation with default arguments

`config.json`

```json
---
{
  "plugins": {
    "register": {
      "resolution": {
        "path": "./plugins/resolution.js",
        "args": {
          "resolutions": []
        }
      }
    },
    "events": {
      "sceneCreated": [
        "resolution"
      ],
      "sceneCustom": [
        "resolution"
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
    resolution:
      path: ./plugins/resolution.js
      args:
        resolutions: []
  events:
    sceneCreated:
      - resolution
    sceneCustom:
      - resolution

---

```
