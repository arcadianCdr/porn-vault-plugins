## adultempire 0.6.0

by boi123212321

Scrape data from adultempire

### Download links
Each download link is for the latest version of the plugin, for the indicated porn-vault server version.  
Make sure you are reading the documentation of the plugin, for the correct porn-vault server version.  
| Server version                                                                                               | Plugin documentation                                                                                        |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| [Download link for: stable](https://raw.githubusercontent.com/porn-vault/plugins/master/dist/adultempire.js) | [documentation](https://github.com/porn-vault/porn-vault-plugins/blob/master/plugins/adultempire/README.md) |
| [Download link for: 0.27](https://raw.githubusercontent.com/porn-vault/plugins/0.27/dist/adultempire.js)     | [documentation](https://github.com/porn-vault/porn-vault-plugins/blob/0.27/plugins/adultempire/README.md)   |


### Arguments

| Name | Type    | Required | Description                    |
| ---- | ------- | -------- | ------------------------------ |
| dry  | Boolean | false    | Whether to commit data changes |

### Example installation with default arguments

`config.json`

```json
---
{
  "plugins": {
    "register": {
      "adultempire": {
        "path": "./plugins/adultempire.js",
        "args": {
          "dry": false
        }
      }
    },
    "events": {
      "movieCreated": [
        "adultempire"
      ],
      "actorCreated": [
        "adultempire"
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
    adultempire:
      path: ./plugins/adultempire.js
      args:
        dry: false
  events:
    movieCreated:
      - adultempire
    actorCreated:
      - adultempire

---

```
