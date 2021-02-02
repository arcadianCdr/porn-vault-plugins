import { MySceneContext } from "./types";
import { SceneOutput } from "../../types/scene";
import { dateToTimestamp, matchElement } from "./utils";
import { findAndLoadSceneConfig } from "./config";

module.exports = async (ctx: MySceneContext): Promise<SceneOutput> => {
  const { args, sceneName, scenePath, $logger, $throw } = ctx;

  if (!sceneName) $throw("Uh oh. You shouldn't use the plugin for this type of event");

  $logger.verbose(`Parsing scene: ${scenePath}`);

  const cfg = await findAndLoadSceneConfig(ctx);
  if (!cfg)
    $logger.warn(
      `No configuration found in the scene directory or a parent => only 'release date' will be parsed.`
    );

  function parseReleaseDate(): Partial<{ releaseDate: number }> {
    if (args.parseDate == false) return {};

    $logger.verbose("Parsing release date...");
    const dateFromName = dateToTimestamp(ctx, sceneName);

    if (dateFromName) {
      $logger.verbose(`Found date in scene name: ${new Date(dateFromName).toLocaleDateString()}`);
      return { releaseDate: dateFromName };
    }

    $logger.verbose("Could not find a date.");
    return {};
  }

  function parseName(): Partial<{ name: string }> {
    if (!cfg || !cfg.nameMatcher) return {};

    $logger.verbose("Parsing name...");

    const matched = matchElement(ctx, cfg.nameMatcher);

    if (matched) {
      $logger.verbose(`Matched name: ${matched}`);
      return { name: matched.toString().trim() };
    } else {
      $logger.verbose(`Found no name.`);
      return {};
    }
  }

  function parseStudio(): Partial<{ studio: string }> {
    if (!cfg || !cfg.studioMatcher) return {};

    $logger.verbose("Parsing studio...");

    const matched = matchElement(ctx, cfg.studioMatcher);

    if (matched) {
      $logger.verbose(`Matched studio: ${matched}`);
      return { studio: matched.toString().trim() };
    } else {
      $logger.verbose(`Found no studio.`);
      return {};
    }
  }

  function parseActors(): Partial<{ actors: string[] }> {
    if (!cfg || !cfg.actorsMatcher) return {};

    $logger.verbose("Parsing actors...");

    const matched = matchElement(ctx, cfg.actorsMatcher);

    if (matched) {
      $logger.verbose(`Matched actor(s): ${matched}`);
      return { actors: matched };
    } else {
      $logger.verbose(`Found no actor.`);
      return {};
    }
  }

  function parseMovie(): Partial<{ movie: string }> {
    if (!cfg || !cfg.movieMatcher) return {};

    $logger.verbose("Parsing movie...");

    const matched = matchElement(ctx, cfg.movieMatcher);

    if (matched) {
      $logger.verbose(`Matched movie: ${matched}`);
      return { movie: matched.toString().trim() };
    } else {
      $logger.verbose(`Found no movie.`);
      return {};
    }
  }

  function parseLabels(): Partial<{ labels: string[] }> {
    if (!cfg || !cfg.labelsMatcher) return {};

    $logger.verbose("Parsing labels...");

    const matched = matchElement(ctx, cfg.labelsMatcher);

    if (matched) {
      $logger.verbose(`Matched label(s): ${matched}`);
      return { labels: matched };
    } else {
      $logger.verbose(`Found no label.`);
      return {};
    }
  }

  const sceneOutput: SceneOutput = {
    ...parseReleaseDate(),
    ...parseStudio(),
    ...parseName(),
    ...parseActors(),
    ...parseMovie(),
    ...parseLabels(),
  };

  if (args.dry === true) {
    $logger.info(`dry mode. Would have returned: ${sceneOutput}`);
    return {};
  } else {
    return sceneOutput;
  }
};
