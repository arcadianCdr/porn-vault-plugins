## moviescene 0.1.1

by arcadianCdr, boi123212321 (for some adultempire movie scraping code I reused)

[Download here](https://raw.githubusercontent.com/porn-vault/plugins/master/dist/moviescene.js)

Scrape scene details from adultempire. Does not work by itself. It needs to be piped (chained) with another plugin that will parse the movie, actors or scene name (like fileparser).

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
      "moviescene": {
        "path": "./plugins/moviescene.js",
        "args": {
          "dry": false
        }
      }
    },
    "events": {
      "sceneCreated": [
        "moviescene"
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
    moviescene:
      path: ./plugins/moviescene.js
      args:
        dry: false
  events:
    sceneCreated:
      - moviescene

---

```
