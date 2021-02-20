import { Context } from "../../types/plugin";
import { SceneContext, SceneOutput } from "../../types/scene";

interface MySceneContext extends SceneContext {
  args: {
    dry?: boolean;
  };
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
  const { args, $axios, $cheerio, data, $moment, sceneName, scenePath, $logger, $throw } = ctx;

  if (!scenePath) $throw("Uh oh. You shouldn't use the plugin for this type of event");

  $logger.info(`Scraping scene: ${sceneName} with input data: ${data}`);

  const searchActors: string[] | undefined = data.actors;
  const searchMovie: string | undefined = data.movie;

  let name: string | undefined;
  let movie: string | undefined;
  let studio: string | undefined;
  let actors: string[] | undefined;
  let releaseDate: number | undefined;

  if (searchMovie) {
    const movieName = searchMovie
      .replace(/[#&]/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    const url = await searchForMovie(ctx, movieName);

    if (url) {
      const html = (await $axios.get<string>(url)).data;
      const $ = $cheerio.load(html);

      movie = $(`.title-rating-section .col-sm-6 h1`)
        .text()
        .replace(/[\t\n]+/g, " ")
        .replace(/ {2,}/, " ")
        .replace(/- On Sale!.*/i, "")
        .trim();

      $logger.verbose(
        `Looking up scene number for movie '${movie}' based on scene name: ${sceneName} and actors: ${JSON.stringify(
          searchActors
        )}`
      );

      // Find the index of the best matching scene based scene number matching in the scene's name (assumes cleaned-up scene names where the only digits represents the scene number)
      let sceneIndexMatchedFromName: number | undefined;
      const matchedSceneNumber = sceneName.match(/\d{1,2}/);
      if (matchedSceneNumber) {
        sceneIndexMatchedFromName = Number(matchedSceneNumber[0]) - 1;
        $logger.verbose(
          `Based on scene name matching, the scene index is: ${sceneIndexMatchedFromName}`
        );
      }

      // Find the index of the best matching scene based on actor matching score (largest intersection between pv & web actors wins)
      let sceneIndexBestActorsMatch: number | undefined;
      if (searchActors && searchActors.length > 0) {
        let actorsFound: string[];
        let bestActorsMatchCount: number = 0;
        let currentActorMatchesCount: number;
        $(".col-sm-6.text-right.text-left-xs.m-b-1").each(function (i, elm) {
          actorsFound = [];
          currentActorMatchesCount = 0;
          $(elm)
            .find("a")
            .each(function (index, elem) {
              const actor = $(elem).text();
              actorsFound.push(actor);
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

      // Scrapes scene details based on matched scene index (actor match always takes precedence on number match from the name)
      const sceneIndex = sceneIndexBestActorsMatch ?? sceneIndexMatchedFromName;
      if (sceneIndex !== undefined && sceneIndex > -1) {
        name = $(".col-sm-6 > .m-b-1").eq(sceneIndex).text().trim();
        if (name.match(/Scene \d+/)) {
          name = `${movieName} - ${name}`;
        }
        $logger.info(
          `Found scene: ${sceneName} based on movie '${movie}' and scene number: ${sceneIndex + 1}`
        );

        const actorsFound: string[] = [];
        $(".col-sm-6.text-right.text-left-xs.m-b-1 > div")
          .eq(sceneIndex)
          .each(function (i, elm) {
            $(elm)
              .find("a")
              .each(function (index, elem) {
                actorsFound.push($(elem).text());
              });
          });
        if (actorsFound.length > 0) actors = actorsFound;

        studio = $(`.title-rating-section .item-info > a`).eq(0).text().trim();

        $(".col-sm-4.m-b-2 li").each(function (i, elm) {
          const grabrvars = $(elm).text().split(":");
          if (grabrvars[0].includes("Released")) {
            releaseDate = $moment(grabrvars[1].trim().replace(" ", "-"), "MMM-DD-YYYY").valueOf();
          }
        });
      } else {
        $logger.warn("Unable to identify a scene number. No results to grab.");
      }
    }
  }

  const sceneOutput: SceneOutput = {
    name,
    releaseDate,
    actors,
    studio,
    movie,
  };

  if (args.dry === true) {
    $logger.info(`dry mode. Would have returned: ${sceneOutput}`);
    return {};
  } else {
    return sceneOutput;
  }
}
