## fileparser 0.1.2

by arcadianCdr

Automatically extracts scene details from your library's file and directory structure.

The following data can be parsed: `release date`, `studio`, `name`, `actors`, `movie` and `labels`.

Used in combination with web scraping plug-ins, it is possible to fully automate your library creation!

### How?

The plugin works by recognizing patterns in your files:
- a built-in pattern identifies dates and work "out-of-the-box". 
- for custom patterns (like studio, actors or movie) that are specific to your naming convention, a little bit of configuration is needed to "tell the plugin" how to recognize the right patterns.

fileparser uses the "regular expression" standard to match patterns (regex). If you don't know the regex syntax, there are many details and examples below that can be reused with little to no understanding of regex.

### Configuration - not your typical plugin

A consistent and uniform naming convention across a whole media library is extremely unlikely. Therefore, fileparser supports not one, but multiple `parserconfig` files. They are placed alongside your media files, directly into the library. 

A configuration file applies to all files and subdirectories below it: the same directory or anything deeper in the dir structure. 

Config files can also be nested. In this case, the deepest and most specific config is always used. 

Configs are searched and loaded dynamically when the plug-in is executed. They can be added, modified or removed while pv is running (I would advise against config modifications in the middle of a scan for new files). You can modify a config and (re)run the plug-in manually. Any config change will immediately be taken into account.

Time to [setup the plugin](#Example-installation-with-default-arguments) and [start your first `parserconfig` file](#`parserconfig`-examples)!

### Arguments

Since most of the customisation is done within `parserconfig` files, the plug-in arguments are reduced to the minimum:

| Name       | Type    | Required | Description                            |
| ---------- | ------- | -------- | -------------------------------------- |
| dry        | boolean | false    | Whether to commit data changes.        |
| parseDate  | boolean | false    | whether to parse release dates. Defaults to true       |

### Example installation with default arguments

`config.json`
```json
---
{
  "plugins": {
    "register": {
      "fileparser": {
        "path": "./plugins/fileparser/main.ts",
        "args": {
          "dry": false,
          "parseDate": true
        }
      }
    },
    "events": {
      "sceneCreated": [
        "fileparser"
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
    fileparser:
      path: "./plugins/fileparser/main.ts"
      args:
        dry: false
        parseDate: true
  events:
    sceneCreated:
    - fileparser
---
```

### `parserconfig` file structure

configuration files consist of a series of matcher for each of the supported scene attributes, all of which are optional. 

| Name           | Type      | Required |
| -------------- | --------- | -------- | 
| studioMatcher  | matcher   | false    |  
| nameMatcher    | matcher   | false    | 
| actorsMatcher  | matcher   | false    |  
| movieMatcher   | matcher   | false    | 
| labelsMatcher  | matcher   | false    |  

The basic structure of a matcher  is always the same and has only one mandatory field: the regex.

| Name          | Type      | Required | Description                            |
| ------------- | --------- | -------- | -------------------------------------- |
| scopeDirname  | string    | false    | Whether the regex is applied to the directory's full path (excluding the trailing path separator) or to the base name of the scene file (the filename without the ending dot and the extension). . If omitted or false, the filename is used.          |
| regex         | string    | true     | A regular expression (regex). Regex can be easily previewed and tested via [https://regex101.com/](https://regex101.com/)           |
| regexFlags    | string    | false    | regex flags: as per spec, like `g`: `g`lobal, `ì`: case `i`nsensitive,... Defaults to `g` that is mandatory along any other flag you may want to set. Flags can be combined (ex: `gi`).        |
| matchesToUse  | number[]  | false     | Specifies which match to use in the result. If omitted, all matches are used. Match indexes starts at 0.           |
| groupsToUse   | number[]  | flase     | If your regexp returns results split in groups, you can use this attribute to control which groups to use in the result. If omitted, all groups are used. Group indexes starts at 0.          |
| splitter      | string    | false     | When the regxp match represents a collection (array of values), the splitter can be used to break the string in individual items (the most frequent use case being a list of actors or labels).           |

### `parserconfig` examples

The full config structure has many options. In most cases only a fraction of them is needed and the same regex structure is reusable. Once you get your first config setup, it becomes quite straightforward.

Before diving into an example, let's assume the following directory and file structure:

`/movies/movie series/Movie Name 17/Studio name ~ first1 last1, first2 last2 ~ Scene title ~ 2017-12-31.mp4`

A common naming convention is used for all files under "movies" => the  `parserconfig` file is placed in `'/movies'`.

We want to identify the following patterns:
- The deepest folder is the `movie name`
- The file name has different sections, all separated by the same `' ~ '` delimiter. We can therefore use the same regex to match the `studio`, the `actors` and the scene's `name`.
- The `release date` is matched automatically. There is nothing to configure for that.

We can use two regex:
- `(.+?)(?: ~ |$)` that breaks a string into matches for each part delimited by the `' ~ '` separator:
  - Get the studio: match at index 0
  - Get the scene name: match at index 2
  - Get the list of actors: match at index 1, further split into individual actor by using a `","` splitter on the match.
- `(?![\\s\\S]*\/)(.*)$` that matches everything from the last separator to the end of the string. By setting `scopeDirname: true`, the pattern is applied on the full path, which is perfect to get the movie name (that in our example is always the deepest directory in the path). 

Some useful regex can be (replace `DELIM` with text of your choice):
- `(.+?)(?:DELIM|$)`: break a string into a match for each part of the string delimited by the given separator. Can be used on path to split folders with `'/'`as delimiter or on file name to split the file components according to your separator of choice.
- `(?<=DELIM).+?(?=DELIM)`: match everything between two separators (that can be different from each other).
- `(?![\\s\\S]*DELIM)(.*)$`: match everything after the last delimiter of its kind (until end of the string).


`parserconfig.json` (remember: to be placed it in your library)
```json
{
  "studioMatcher": {
    "regex": "(.+?)(?: ~ |$)",
    "matchesToUse": [0], 
    "groupsToUse": [1]
  },
  "nameMatcher": {
    "regex": "(.+?)(?: ~ |$)",
    "matchesToUse": [2], 
    "groupsToUse": [1]
  },
  "actorsMatcher": {
    "regex": "(.+?)(?: ~ |$)",
    "matchesToUse": [1], 
    "groupsToUse": [1],
    "splitter": ","
  },
  "movieMatcher": {
    "scopeDirname": true,
    "regex": "(?![\\s\\S]*\/)(.*)$",
    "matchesToUse": [0]
  }
}
```

`parserconfig.yaml` (remember: to be placed it in your library)
```yaml
---
studioMatcher:
  regex: "(.+?)(?: ~ |$)"
  matchesToUse:
  - 0
  groupsToUse:
  - 1
nameMatcher:
  regex: "(.+?)(?: ~ |$)"
  matchesToUse:
  - 2
  groupsToUse:
  - 1
actorsMatcher:
  regex: "(.+?)(?: ~ |$)"
  matchesToUse:
  - 1
  groupsToUse:
  - 1
  splitter: ","
movieMatcher:
  scopeDirname: true
  regex: "(?![\\s\\S]*\/)(.*)$"
  matchesToUse:
  - 0
```
