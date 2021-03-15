import { Context } from "../../types/plugin";
import { SceneContext, SceneOutput } from "../../types/scene";

interface MySceneContext extends SceneContext {
  args: {
    dry?: boolean;
    whitelist?: string[];
    blacklist?: string[];
    useMovieAsName?: boolean;
  };
}

function lowercase(str: string): string {
  return str.toLowerCase();
}

async function searchForMovie(
  { $cheerio, $axios }: { $cheerio: Context["$cheerio"]; $axios: Context["$axios"] },
  name: string
): Promise<string | false> {
  const url = `https://www.adultempire.com/allsearch/search?q=${name}`;
  const html = (await $axios.get<string>(url)).data;
  const $ = $cheerio.load(html);

  const firstResult = $(".boxcover").toArray()[0];
  const href = $(firstResult).attr("href");

  if (!href) {
    return false;
  }
  return `https://adultempire.com${href}`;
}

export default async function (ctx: MySceneContext): Promise<SceneOutput> {
  const { args, $axios, $cheerio, data, $moment, sceneName, $logger, $throw } = ctx;

  if (!["sceneCreated", "sceneCustom"].includes(ctx.event)) {
    $throw("Uh oh. You shouldn't use the plugin for this type of event");
  }

  // Use initial or piped data for the matching
  const searchName: string | undefined = data.name ?? sceneName;
  const searchActors: string[] = data.actors ?? (await ctx.$getActors())?.map((a) => a.name);
  const searchMovie: string | undefined = data.movie ?? (await ctx.$getMovies())?.[0]?.name;

  if (!searchMovie && (!searchName || !searchActors.length)) {
    $throw(
      "Not enough data to perform the search. moviescene requires at least a 'movie', and either a 'name' (containing the scene number) or some 'actors' " +
        "to identify which scene of the movie to use. Other plugins can help you scrape these data from the web or from your filenames (like fileparser)."
    );
  }

  const blacklist = (args.blacklist || []).map(lowercase);
  if (!args.blacklist) $logger.verbose("No blacklist defined, returning everything...");
  if (blacklist.length) $logger.verbose(`Blacklist defined, will ignore: ${blacklist.join(", ")}`);

  const whitelist = (args.whitelist || []).map(lowercase);
  if (whitelist.length) {
    $logger.verbose(`Whitelist defined, will only return: ${whitelist.join(", ")}...`);
  }

  function isBlacklisted(prop): boolean {
    if (whitelist.length) {
      return !whitelist.includes(lowercase(prop));
    }
    return blacklist.includes(lowercase(prop));
  }

  $logger.info(
    `Scraping scene from movie '${searchMovie}' based on name: '${sceneName}' and/or actors: '${searchActors.join()}'`
  );

  // let releaseDate: number | undefined;
  let url: string | false = false;
  const movieName: string = searchMovie
    .replace(/[#&]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  url = await searchForMovie(ctx, movieName);

  if (!url) {
    $logger.warn("Unable to identify a scene number. No results to grab.");
    return {};
  }
  const html = (await $axios.get<string>(url)).data;
  const $ = $cheerio.load(html);

  function getMovie(): Partial<{ movie: string }> {
    if (isBlacklisted("movie")) return {};

    const scrapedMovie = $(`.title-rating-section .col-sm-6 h1`)
      .text()
      .replace(/[\t\n]+/g, " ")
      .replace(/ {2,}/, " ")
      .replace(/- On Sale!.*/i, "")
      .trim();
    $logger.debug(`Found movie: '${scrapedMovie}'`);

    return { movie: scrapedMovie };
  }

  function getName(): Partial<{ name: string }> {
    if (isBlacklisted("name")) return {};

    let scrapedName = $(".col-sm-6 > .m-b-1").eq(sceneIndex).text().trim();
    if (args.useMovieAsName && /Scene \d+/.exec(scrapedName)) {
      scrapedName = `${movieName} - ${scrapedName}`;
    }

    return { name: scrapedName };
  }

  function getActors(): Partial<{ actors: string[] }> {
    if (isBlacklisted("actors")) return {};

    const foundActors: string[] = [];
    $(".col-sm-6.text-right.text-left-xs.m-b-1 > div")
      .eq(sceneIndex)
      .each(function (i, elm) {
        $(elm)
          .find("a")
          .each(function (index, elem) {
            foundActors.push($(elem).text());
          });
      });
    if (foundActors.length > 0) {
      return { actors: foundActors };
    }
    return {};
  }

  function getStudio(): Partial<{ studio: string }> {
    if (isBlacklisted("studio")) return {};

    const foundStudio = $(`.title-rating-section .item-info > a`).eq(0).text().trim();
    return { studio: foundStudio };
  }

  function getReleaseDate(): Partial<{ releaseDate: number }> {
    if (isBlacklisted("releaseDate")) return {};

    let date: number | undefined;
    $(".col-sm-4.m-b-2 li").each(function (i, elm) {
      const grabrvars = $(elm).text().split(":");
      if (grabrvars[0].includes("Released")) {
        date = $moment(grabrvars[1].trim().replace(" ", "-"), "MMM-DD-YYYY").valueOf();
      }
    });
    return { releaseDate: date };
  }

  // Finds the index of the best matching scene based scene number matching in the scene's name
  // (assumes cleaned-up scene names where the only digits represents the scene number)
  let sceneIndexMatchedFromName: number = -1;
  const matchedSceneNumber = /\d{1,2}/.exec(searchName);
  if (matchedSceneNumber) {
    sceneIndexMatchedFromName = Number(matchedSceneNumber[0]) - 1;
    $logger.verbose(
      `Based on scene name matching, the scene index is: ${sceneIndexMatchedFromName}`
    );
  }

  // Find the index of the best matching scene based on actor matching score (largest intersection between pv & web actors wins)
  let sceneIndexBestActorsMatch: number = -1;
  if (searchActors && searchActors.length > 0) {
    let foundActors: string[];
    let bestActorsMatchCount: number = 0;
    let currentActorMatchesCount: number;
    $(".col-sm-6.text-right.text-left-xs.m-b-1").each(function (i, elm) {
      foundActors = [];
      currentActorMatchesCount = 0;
      $(elm)
        .find("a")
        .each(function (index, elem) {
          const actor = $(elem).text();
          foundActors.push(actor);
          if (searchActors.includes(actor)) currentActorMatchesCount++;
        });
      if (currentActorMatchesCount > bestActorsMatchCount) {
        bestActorsMatchCount = currentActorMatchesCount;
        sceneIndexBestActorsMatch = i;
      }
    });
    $logger.verbose(
      `Based on best actors matching, the scene index is: ${sceneIndexBestActorsMatch}`
    );
  }

  // Scene index matched on name/number takes precedence on actor match
  const sceneIndex =
    sceneIndexMatchedFromName > -1 ? sceneIndexMatchedFromName : sceneIndexBestActorsMatch;

  if (sceneIndex < 0) {
    $logger.warn(`Unable to match a scene within the movie.`);
    return {};
  }
  $logger.info(`Found scene: index ${sceneIndex}`);

  const sceneOutput: SceneOutput = {
    ...getMovie,
    ...getName(),
    ...getActors(),
    ...getStudio(),
    ...getReleaseDate(),
  };

  if (args.dry === true) {
    $logger.info(`dry mode. Would have returned: ${JSON.stringify(sceneOutput)}`);
    return {};
  } else {
    return sceneOutput;
  }
}
