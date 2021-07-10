## legalporno 0.3.1

by boi123212321

Scrape Legalporno/Analvids scene data

### Download links
Each download link is for the latest version of the plugin, for the indicated porn-vault server version.  
Make sure you are reading the documentation of the plugin, for the correct porn-vault server version.  
| Server version                                                                                              | Plugin documentation                                                                                       |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [Download link for: stable](https://raw.githubusercontent.com/porn-vault/plugins/master/dist/legalporno.js) | [documentation](https://github.com/porn-vault/porn-vault-plugins/blob/master/plugins/legalporno/README.md) |
| [Download link for: 0.27](https://raw.githubusercontent.com/porn-vault/plugins/0.27/dist/legalporno.js)     | [documentation](https://github.com/porn-vault/porn-vault-plugins/blob/0.27/plugins/legalporno/README.md)   |


### Arguments

| Name       | Type    | Required | Description                                 |
| ---------- | ------- | -------- | ------------------------------------------- |
| deep       | Boolean | false    | Fetch scene details                         |
| dry        | Boolean | false    | Whether to commit data changes              |
| useSceneId | Boolean | false    | Whether to set scene name to found shoot ID |

### Example installation with default arguments

`config.json`

```json
---
{
  "plugins": {
    "register": {
      "legalporno": {
        "path": "./plugins/legalporno.js",
        "args": {
          "deep": true,
          "dry": false,
          "useSceneId": false
        }
      }
    },
    "events": {
      "sceneCreated": [
        "legalporno"
      ],
      "sceneCustom": [
        "legalporno"
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
    legalporno:
      path: ./plugins/legalporno.js
      args:
        deep: true
        dry: false
        useSceneId: false
  events:
    sceneCreated:
      - legalporno
    sceneCustom:
      - legalporno

---

```
