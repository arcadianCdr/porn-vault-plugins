On IAFD, everything is considered a 'movie'. Standalone scenes are just single-scene titles, while actual movies are multi-scene titles. IAFD is therefore particularly well suited to scrape older scene's data that are part of a movie (DVD, BluRay,...).

In order to work on multi-scene movies, the plugin needs to identify the correct scene in the movie. This can be done in two ways:
- Adding the scene in PV and linking it to a movie prior to running the iafd plugin (configure iafd on the 'sceneCustom' event)
- Use iafd plugin in conjunction with a plugin that can identity the 'movie' name and the 'scene name' and/or the 'actors' from the file name. Plugins like fileparser can do that by matching patterns in the filename (configure both fileparser and iafd on the 'sceneCreated' event)

Either way, the iafd plugin will identify the correct scene in a multi-scene title by either:
- Identifying a number in the scene name (for instance 'Scene 1', 'S01',...). For this to work, make sure your scene name does not contain more than one number.
- Identifying matching actors between porn-vault's database and IAFD.