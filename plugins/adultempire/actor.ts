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
  const { args, $axios, $cheerio, $logger, $formatMessage, actorName, $createImage } = ctx;

  const name = actorName
    .replace(/#/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  $logger.info(`Scraping actor info for '${name}', dry mode: ${args?.dry || false}...`);

  const blacklist = (args.blacklist || []).map(lowercase);
  if (!args.blacklist) $logger.verbose("No blacklist defined, returning everything...");
  if (blacklist.length) $logger.verbose(`Blacklist defined, will ignore: ${blacklist.join(", ")}`);

  const whitelist = (args.whitelist || []).map(lowercase);
  if (whitelist.length)
    $logger.verbose(`Whitelist defined, will only return: ${whitelist.join(", ")}...`);

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

    let avatar: string | undefined;
    let avatarUrl;

    if (!isBlacklisted("avatar")) {
      const firstImageResult = $(`a.fancy`).toArray()[0];
      avatarUrl = $(firstImageResult).attr("href");

      if (avatarUrl) {
        avatar = await $createImage(avatarUrl, `${actorName} (avatar)`);
      }
    } 

    let hero;
    let heroUrl;

    if (!isBlacklisted("hero")) {
      const secondImageResult = $(`a.fancy`).toArray()[1];
      heroUrl = $(secondImageResult).attr("href");

      if (heroUrl) {
        hero = await $createImage(heroUrl, `${actorName} (hero image)`);
      }
    }

    let description;

    if (!isBlacklisted("description")) {
      const descEl = $(".text-md");
      if (descEl) {
        description = descEl.children().remove("div").end().text().replace("Biography Text ©Adult DVD Empire","").trim();
      }
    }

    let thumbnail;

    const thirdImageResult = $(`.performer-image-container img`).toArray()[0];
    const thumbnailUrl = $(thirdImageResult).attr("src");

    if (thumbnailUrl) {
      thumbnail = await $createImage(thumbnailUrl, `${actorName} (thumbnail)`);
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

    let rating;

    if (!isBlacklisted("rating")) {
      const ratingResult = $(`.performer-info-control strong`).toArray()[0];

      if (ratingResult) {
        const ratingValue = parseFloat($(ratingResult).text().slice(0,-2));
        if (typeof ratingValue === "number" && ratingValue >= 0 && ratingValue <= 5) {
          //Converts decimal 0-5 AdultEmpire rating to integer 0-10 scale, also correcting distribution biais
          //(AdultEmpire artificially favors the higher end of the scale).
          rating = Math.round((ratingValue ** 4) / 62.5);
          $logger.debug(`Converted AdultEmpire rating ${ratingValue} to ${rating}`);
        }
      }
    }

    const result = {
      thumbnail,
      avatar,
      $ae_avatar: avatarUrl,
      hero,
      $ae_hero: heroUrl,
      aliases,
      rating,
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
