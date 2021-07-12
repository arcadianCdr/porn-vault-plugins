import $cheerio from "cheerio";

import { MovieContext, MovieOutput } from "../../types/movie";
import { Context } from "../../types/plugin";
import levenshtein from "../PromisedScene/levenshtein";

interface MyContext extends MovieContext {
  args: {
    whitelist?: string[];
    blacklist?: string[];
    dry?: boolean;
    fuzzyMovieCheck: boolean;
  };
}

function lowercase(str: string): string {
  return str.toLowerCase();
}

async function searchForMovie(
  { $axios }: { $axios: Context["$axios"] },
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

async function urlAvailable({ $axios }: MyContext, url: string) {
  const { status } = await $axios.head(url, {
    validateStatus: () => true,
  });
  return status < 400;
}

export default async function (ctx: MyContext): Promise<MovieOutput> {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { args, $moment, $axios, $logger, $formatMessage, movieName, $createImage, $throw } = ctx;

  function isFuzzyMatch(found: string[], searched): boolean {
    $logger.debug(
      `Attempting a fuzzy (levenshtein) match for ${searched} in ${$formatMessage(found)}`
    );
    let finalScore = searched.length;
    found.forEach((item) => {
      const score = levenshtein(searched.replace(" ", ""), item.replace(" ", ""));
      if (score < finalScore) {
        finalScore = score;
      }
    });

    // Levenshtein tolerance varies with string length
    if (finalScore < searched.length / 6) {
      $logger.debug(`Positive levenshtein match with a score of : ${finalScore}.`);
      return true;
    }

    return false;
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

  const name = movieName
    .replace(/[#&]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  $logger.info(`Scraping movie covers for '${name}', dry mode: ${args?.dry || false}...`);

  const url = movieName.startsWith("http") ? movieName : await searchForMovie(ctx, name);

  if (url) {
    const movieUrl = url;
    const html = (await $axios.get<string>(movieUrl)).data;
    const $ = $cheerio.load(html);

    if (args.fuzzyMovieCheck) {
      // Attempts a fuzzy (levenshtein) match between searched and found actor (or aliases).
      const foundName: string = $(`.title-rating-section .col-sm-6 h1`)
        .text()
        .replace(/[\t\n]+/g, " ")
        .replace(/ {2,}/, " ")
        .replace(/- On Sale!.*/i, "")
        .trim();
      const found: string[] = [foundName];
      if (!isFuzzyMatch(found, name)) {
        $throw(
          `Stopped scraping. The adultempire movie name is not a good match (failed fuzzy (levenshtein) match attempt). found: ${$formatMessage(
            found
          )}, expected: '${name}'`
        );
      }
    }

    let desc: string | undefined;
    if (!isBlacklisted("description")) {
      desc = $(".m-b-0.text-dark.synopsis").text();
    }

    let movieName: string | undefined;
    if (!isBlacklisted("name")) {
      movieName = $(`.title-rating-section .col-sm-6 h1`)
        .text()
        .replace(/[\t\n]+/g, " ")
        .replace(/ {2,}/, " ")
        .replace(/- On Sale!.*/i, "")
        .trim();
    }

    let release: number | undefined;
    if (!isBlacklisted("releaseDate")) {
      $(".col-sm-4.m-b-2 li").each(function (i, elm) {
        const grabrvars = $(elm).text().split(":");
        if (grabrvars[0].includes("Released")) {
          release = $moment(grabrvars[1].trim().replace(" ", "-"), "MMM-DD-YYYY").valueOf();
        }
      });
    }

    let studioName: string | undefined;
    if (!isBlacklisted("studio")) {
      studioName = $(`.title-rating-section .item-info > a`).eq(0).text().trim();
    }

    const frontCover = $("#front-cover img").toArray()[0];
    const frontCoverSrc = $(frontCover).attr("src") || "";
    let backCoverSrc: string | null = frontCoverSrc.replace("h.jpg", "bh.jpg");

    if (!(await urlAvailable(ctx, backCoverSrc))) {
      backCoverSrc = null;
    }

    if (args?.dry === true) {
      $logger.info(
        `Would have returned ${$formatMessage({
          name: movieName,
          movieUrl,
          frontCoverSrc,
          backCoverSrc,
          studioName,
          desc,
          release,
        })}`
      );
    } else {
      const frontCoverImg = await $createImage(frontCoverSrc, `${movieName} (front cover)`);

      let backCoverImg: string | undefined;
      if (backCoverSrc) {
        backCoverImg = await $createImage(backCoverSrc, `${movieName} (back cover)`);
      }

      return {
        name: movieName,
        frontCover: frontCoverImg,
        backCover: backCoverImg,
        description: desc,
        releaseDate: release,
        studio: studioName,
      };
    }
  }

  return {};
}
