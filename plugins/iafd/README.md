## iafd 0.1.0

by ArcadianCdr

[Download here](https://raw.githubusercontent.com/porn-vault/plugins/master/dist/iafd.js)

Scrapes scene data from the Internet Adult Film Database (iafd). Supports single-scene and multi-scene titles (movies).

### Documentation

On IAFD, everything is considered a 'movie'. Standalone scenes are just single-scene titles, while actual movies are multi-scene titles. IAFD is therefore particularly well suited to scrape older scene's data that are part of a movie (DVD, BluRay,...).

In order to work on multi-scene movies, the plugin needs to identify the correct scene in the movie. This can be done in two ways:
- Adding the scene in PV and linking it to a movie prior to running the iafd plugin (configure iafd on the 'sceneCustom' event)
- Use iafd plugin in conjunction with a plugin that can identity the 'movie' name and the 'scene name' and/or the 'actors' from the file name. Plugins like fileparser can do that by matching patterns in the filename (configure both fileparser and iafd on the 'sceneCreated' event)

Either way, the iafd plugin will identify the correct scene in a multi-scene title by either:
- Identifying a number in the scene name (for instance 'Scene 1', 'S01',...). For this to work, make sure your scene name does not contain more than one number.
- Identifying matching actors between porn-vault's database and IAFD.

### Arguments

| Name                    | Type     | Required | Description                                                                                                                                                                                                                                                                        |
| ----------------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dry                     | Boolean  | false    | Whether to commit data changes                                                                                                                                                                                                                                                     |
| whitelist               | String[] | false    | Array of data fields to pick (possible values: 'description, actors, studio, releaseDate, labels                                                                                                                                                                                   |
| blacklist               | String[] | false    | Array of data fields to omit (for values see whitelist)                                                                                                                                                                                                                            |
| addMovieNameInSceneName | String   | false    | For multi-scene titles (movies), IAFD simply names the scene: 'Scene 1', 'Scene 2',... This does not make for very good scene names. When this argument is true, the scene name will be a concatenation of the movie name and the scene name. Example: 'Best Movie Ever - Scene 1' |

### Example installation with default arguments

`config.json`

```json
---
{
  "plugins": {
    "register": {
      "iafd": {
        "path": "./plugins/iafd.js",
        "args": {
          "dry": false,
          "whitelist": [],
          "blacklist": [],
          "addMovieNameInSceneName": false
        }
      }
    },
    "events": {
      "sceneCreated": [
        "iafd"
      ],
      "sceneCustom": [
        "iafd"
      ]
    }
  }
}
---
```

`config.yaml`

```yaml
---
{ { { exampleYAML } } }
---

```
