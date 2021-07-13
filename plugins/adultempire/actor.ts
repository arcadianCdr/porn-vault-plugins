import $cheerio from "cheerio";

import { ActorContext, ActorOutput } from "../../types/actor";

interface MyContext extends ActorContext {
  args: {
    whitelist?: string[];
    blacklist?: string[];
    dry?: boolean;
  };
}

function lowercase(str: string): string {
  return str.toLowerCase();
}

export default async function (ctx: MyContext): Promise<ActorOutput> {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { args, $axios, $logger, $formatMessage, actorName, $createImage } = ctx;

  const name = actorName
    .replace(/#/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  $logger.info(`Scraping actor info for '${name}', dry mode: ${args?.dry || false}...`);

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

  const url = `https://www.adultempire.com/allsearch/search?q=${name}`;
  const html = (await $axios.get(url)).data;
  const $ = $cheerio.load(html);

  const firstResult = $(`a.boxcover[label="Performer"]`).toArray()[0];
  const href = $(firstResult).attr("href");

  if (href) {
    const actorUrl = `https://adultempire.com${href}`;
    const html = (await $axios.get<string>(actorUrl)).data;
    const $ = $cheerio.load(html);

    const images = $(`a.fancy`).toArray();

    let thumbnail: string | undefined;
    let thumbnailUrl: string | undefined;
    if (!isBlacklisted("thumbnail")) {
      const firstImageResult = images[0];
      thumbnailUrl = $(firstImageResult).attr("href");

      if (thumbnailUrl) {
        thumbnail = await $createImage(thumbnailUrl, `${actorName} (thumbnail)`);
      }
    }

    let hero: string | undefined;
    let heroUrl: string | undefined;
    if (!isBlacklisted("hero")) {
      const secondImageResult = images[1];
      heroUrl = $(secondImageResult).attr("href");

      if (heroUrl) {
        hero = await $createImage(heroUrl, `${actorName} (hero image)`);
      }
    }

    let description;
    if (!isBlacklisted("description")) {
      const descEl = $(".text-md");
      if (descEl) {
        description = descEl.children().remove("div").end().text().trim();
      }
    }

    let aliases: string[] = [];
    if (!isBlacklisted("aliases")) {
      const aliasEl = $("#content .row .col-sm-5 .m-b-1");

      if (aliasEl) {
        const text = aliasEl.text();
        aliases = text
          .replace("Alias: ", "")
          .split(",")
          .map((s) => s.trim());
      }
    }

    const result = {
      thumbnail,
      $ae_thumbnail: thumbnailUrl,
      hero,
      $ae_hero: heroUrl,
      aliases,
      description,
    };

    if (args?.dry) {
      $logger.info(`Would have returned ${$formatMessage(result)}`);
      return {};
    } else {
      return result;
    }
  }

  return {};
}
