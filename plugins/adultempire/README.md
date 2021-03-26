## adultempire 0.5.0

by boi123212321

[Download here](https://raw.githubusercontent.com/porn-vault/plugins/master/dist/adultempire.js)

Scrape data from adultempire

### Arguments

| Name      | Type     | Required | Description                                                                                          |
| --------- | -------- | -------- | ---------------------------------------------------------------------------------------------------- |
| whitelist | String[] | false    | Array of data fields to pick (possible values: 'avatar', 'hero', 'aliases', 'rating', 'description') |
| blacklist | String[] | false    | Array of data fields to omit (for values see whitelist)                                              |
| dry       | Boolean  | false    | Whether to commit data changes                                                                       |

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
          "whitelist": [],
          "blacklist": [],
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
