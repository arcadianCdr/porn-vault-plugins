The plugin works by recognizing patterns in your files:
- a built-in pattern identifies dates and works "out-of-the-box". 
- for custom patterns (like studio, actors or movie) that are specific to your naming convention, a little bit of configuration is needed to "tell the plugin" how to recognize the right patterns.

fileparser uses the "regular expression" standard to match patterns (regex). If you don't know the regex syntax, there are many details and examples below that can be reused with little to no understanding of regex.

Used in combination with web scraping plug-ins, it is possible to fully automate your library creation!

#### Configuration - not your typical plugin

A consistent and uniform naming convention across a whole media library is extremely unlikely. Therefore, fileparser supports not one, but multiple `parserconfig` files. They are placed alongside your media files, directly into the library. 

A configuration file applies to all files and subdirectories below it: the same directory or anything deeper in the dir structure. 

Config files can also be nested. In this case, the deepest and most specific config is always used. 

Configs are searched and loaded dynamically when the plug-in is executed. They can be added, modified or removed while pv is running (I would advise against config modifications in the middle of a folder scan). You can modify a config and (re)run the plug-in manually. Any config change will immediately be taken into account.

#### `parserconfig` file structure

Configuration files consist of a serie of matchers for each of the supported scene attribute, all of which are optional. 

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
| regex         | string    | true     | A regular expression (regex). Regex can be easily learned, previewed and tested via [https://regex101.com/](https://regex101.com/)           |
| scopeDirname  | string    | false    | Whether the regex is applied to the scene's path (directories excluding the trailing path separator) or to the scene's file name (excluding the ending dot and the extension). If omitted or false, the file name is used.          |
| matchesToUse  | number[]  | false     | If your regexp returns more than one match, use this parameter to control which match is used in the result. If omitted, the first (or only) match is used. Match indexes start at 1. Use 0 to use all matches.           |
| groupsToUse   | number[]  | flase     | If each match is divided in groups (you used brackets in your regex), use this attribute to filter which groups to use in the result. If omitted, the first group is used. Group indexes start at 1. Use 0 to use all groups.          |
| splitter      | string    | false     | Can be used as an option to further split the matched string into an array of strings (the most frequent use case being a list of actors or labels).           |

#### `parserconfig` examples

The full config structure has several options. In most cases only a fraction of them is needed and the same regex structure is reusable. Once you get your first config setup, it becomes quite straightforward.

Before diving into an example, let's assume the following directory and file structure:

`/movies/movie series/Movie Name 17/Studio name ~ first1 last1, first2 last2 ~ Scene title ~ 2017-12-31.mp4`

A common naming convention is used for all files under "movies" => the  `parserconfig` file is placed in `'/movies'`.

We want to identify the following patterns:
- The deepest folder is the `movie name`
- The file name has different sections, all separated by the same `' ~ '` delimiter. We can therefore use the same regex to match the `studio`, the `actors` and the scene's `name`.
- The `release date` is matched automatically. There is nothing to configure for that.

We can use two regex:
- `(.+?)(?: ~ |$)` that breaks a string into matches for each part delimited by the `' ~ '` separator:
  - Get the studio: match at index 1
  - Get the scene name: match at index 3
  - Get the list of actors: match at index 2, further split into individual actor by using a `","` splitter on the match.
- `(?![\\s\\S]*\/)(.*)$` that matches everything from the last separator to the end of the string. By setting `scopeDirname: true`, the pattern is applied on the full path, which is perfect to get the movie name (that in our example is always the deepest directory in the path). 

Some useful regex can be (replace `DELIM` with your delimiter of choice):
- `(.+?)(?:DELIM|$)`: break a string into a match for each part of the string delimited by the given separator. Can be used on path to split folders with `'/'`as delimiter or on file name to split the file components according to your separator of choice.
- `(?<=DELIM).+?(?=DELIM)`: match everything between two separators (that can be different from each other).
- `(?![\\s\\S]*DELIM)(.*)$`: match everything after the last delimiter of its kind (until end of the string).

`parserconfig.json` (remember: to be placed in your library)
```json
{
  "studioMatcher": {
    "regex": "(.+?)(?: ~ |$)",
    "matchesToUse": [1]
  },
  "nameMatcher": {
    "regex": "(.+?)(?: ~ |$)",
    "matchesToUse": [3]
  },
  "actorsMatcher": {
    "regex": "(.+?)(?: ~ |$)",
    "matchesToUse": [2], 
    "splitter": ","
  },
  "movieMatcher": {
    "scopeDirname": true,
    "regex": "(?![\\s\\S]*\/)(.*)$",
  }
}
```

`parserconfig.yaml` (remember: to be placed in your library)
```yaml
---
studioMatcher:
  regex: "(.+?)(?: ~ |$)"
  matchesToUse:
  - 1
nameMatcher:
  regex: "(.+?)(?: ~ |$)"
  matchesToUse:
  - 3
actorsMatcher:
  regex: "(.+?)(?: ~ |$)"
  matchesToUse:
  - 2
  splitter: ","
movieMatcher:
  scopeDirname: true
  regex: "(?![\\s\\S]*\/)(.*)$"
```
