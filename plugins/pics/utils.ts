import { Context, MatchSource } from "../../types/plugin";
import { ScrapeDefinition } from "./types";

export const validateArgs = (ctx: Context): true | Error => {
  // WARNING: the zod schema should always match the interface exported from types.ts

  const baseScrapeDefinition = ctx.$zod.object({
    path: ctx.$zod.string().refine((val) => val && val.trim().length, "The path cannot be empty"),
    searchTerms: ctx.$zod.array(ctx.$zod.string()).optional(),
    blacklistTerms: ctx.$zod.array(ctx.$zod.string()).optional(),
    max: ctx.$zod.number().optional(),
    mustMatchInFilename: ctx.$zod.boolean().optional(),
  });

  const ActorConf = baseScrapeDefinition.extend({
    prop: ctx.$zod.enum(["thumbnail", "altThumbnail", "avatar", "hero", "extra"]),
  });

  const SceneConf = baseScrapeDefinition.extend({
    prop: ctx.$zod.enum(["thumbnail", "extra"]),
  });

  const MovieConf = baseScrapeDefinition.extend({
    prop: ctx.$zod.enum(["backCover", "frontCover", "spineCover", "extra"]),
  });

  const StudioConf = baseScrapeDefinition.extend({
    prop: ctx.$zod.enum(["thumbnail", "extra"]),
  });

  const ArgsSchema = ctx.$zod.object({
    dry: ctx.$zod.boolean().optional(),
    actors: ctx.$zod.array(ActorConf).optional(),
    scenes: ctx.$zod.array(SceneConf).optional(),
    movies: ctx.$zod.array(MovieConf).optional(),
    studios: ctx.$zod.array(StudioConf).optional(),
  });

  try {
    ArgsSchema.parse(ctx.args);
  } catch (err) {
    return err as Error;
  }
  return true;
};

export type ScrapeResult = Partial<
  {
    [key in Exclude<ScrapeDefinition["prop"], "extra">]: string;
  }
> & { extra: string[] };

type SingleScrapeResult = {
  [key in Exclude<ScrapeDefinition["prop"], "extra">]: string;
} & { extra: string[] };

const IMAGE_EXTENSIONS = [".jpg", ".png", ".jpeg", ".gif"];

export async function scanFolder(
  ctx: Context,
  query: string,
  scrapeDefinition: ScrapeDefinition
): Promise<Partial<SingleScrapeResult>> {
  const queryPath = ctx.$path.resolve(scrapeDefinition.path);

  ctx.$logger.info(
    `Trying to find "${scrapeDefinition.prop}" pictures of "${query}" in "${queryPath}"`
  );

  if (scrapeDefinition.prop === "extra" && scrapeDefinition.max === 0) {
    ctx.$logger.verbose(`"max" is 0, will not search`);
    return {};
  }

  const foundImagePaths: string[] = [];

  await ctx.$walk({
    dir: queryPath,
    extensions: IMAGE_EXTENSIONS,
    exclude: [],
    cb: async (imagePath) => {
      // The file is a match if both the query and all searchTerms are found
      // while no blacklisted terms are found
      const itemsToMatch: MatchSource[] = [query, ...(scrapeDefinition.searchTerms || [])].map(
        (el) => ({
          _id: `${scrapeDefinition.prop} ${el}`,
          name: el,
        })
      );
      const blacklistedItems: MatchSource[] = (scrapeDefinition.blacklistTerms || []).map(
        (str) => ({
          _id: str,
          name: str,
        })
      );

      const pathToMatch = scrapeDefinition.mustMatchInFilename
        ? ctx.$path.basename(imagePath)
        : imagePath;

      const isMatch =
        ctx.$matcher.filterMatchingItems(itemsToMatch, pathToMatch, (el) => [el.name]).length ===
          itemsToMatch.length &&
        !ctx.$matcher.filterMatchingItems(blacklistedItems, pathToMatch, (el) => [el.name]).length;
      if (!isMatch) {
        return;
      }

      foundImagePaths.push(imagePath);
      if (
        scrapeDefinition.prop !== "extra" ||
        (scrapeDefinition.max &&
          scrapeDefinition.max > 0 &&
          foundImagePaths.length >= scrapeDefinition.max)
      ) {
        // Returning a truthy value will stop the walk
        return true;
      }
    },
  });

  if (!foundImagePaths.length) {
    ctx.$logger.verbose(`No "${scrapeDefinition.prop}" pictures of "${query}" in "${queryPath}"`);
    return {};
  }

  ctx.$logger.verbose(
    `Found ${foundImagePaths.length} "${
      scrapeDefinition.prop
    }" picture(s) for "${query}": ${JSON.stringify(foundImagePaths)}`
  );

  return {
    [scrapeDefinition.prop]:
      scrapeDefinition.prop === "extra" ? foundImagePaths : foundImagePaths[0],
  };
}

/**
 *
 * @param ctx - plugin context
 * @param query - the item name to search for
 * @param scrapeDefinitions - definition of scrape props
 */
export async function executeScape(
  ctx: Context,
  query: string,
  scrapeDefinitions: ScrapeDefinition[]
): Promise<ScrapeResult> {
  const result: ScrapeResult = { extra: [] };

  const scrapePromises = scrapeDefinitions.map((definition) =>
    scanFolder(ctx, query, definition)
      .then((scanRes) => {
        const image = scanRes[definition.prop];
        if (definition.prop !== "extra" && image && typeof image === "string") {
          result[definition.prop] = image;
        } else if (scanRes.extra) {
          result.extra.push(...scanRes.extra);
        }
      })
      .catch((err) => {
        ctx.$logger.error(ctx.$formatMessage(err));
        ctx.$logger.error(`scrape "${definition.prop}" in "${definition.path}" failed`);
        return {};
      })
  );

  await Promise.all(scrapePromises);

  return result;
}

export const entries = Object.entries as <T>(o: T) => [Extract<keyof T, string>, T[keyof T]][];
