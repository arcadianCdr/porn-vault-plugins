import { MovieContext, MovieOutput } from "../../types/movie";
import { Context } from "../../types/plugin";

interface MyContext extends MovieContext {
  args: {
    //@todo: Implement whitelist & blacklist
    whitelist?: string[];
    blacklist?: string[];
    dry?: boolean;
  };
}

async function searchForMovie(
  { $cheerio, $axios }: { $cheerio: Context["$cheerio"]; $axios: Context["$axios"] },
  name: string
): Promise<string | false> {
  const url = `https://www.adultempire.com/allsearch/search?q=${name}`;
  const html = (await $axios.get(url)).data;
  const $ = $cheerio.load(html);

  const firstResult = $(".boxcover").toArray()[0];
  const href = $(firstResult).attr("href");

  if (!href) {
    return false;
  }
  return "https://adultempire.com" + href;
}

export default async function (ctx: MyContext): Promise<MovieOutput> {
  const { args, $moment, $axios, $cheerio, $logger, $formatMessage, movieName, $createImage } = ctx;

  const name = movieName
    .replace(/[#&]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  $logger.info(`Scraping movie covers for '${name}', dry mode: ${args?.dry || false}...`);

  const url = movieName.startsWith("http") ? movieName : await searchForMovie(ctx, name);

  if (url) {
    const movieUrl = url;
    const html = (await $axios.get(movieUrl)).data;
    const $ = $cheerio.load(html);

    const desc = $(".m-b-0.text-dark.synopsis").text();
    let release: number | undefined = undefined;

    const movieName = $(`.title-rating-section .col-sm-6 h1`)
      .text()
      .replace(/[\t\n]+/g, " ")
      .replace(/ {2,}/, " ")
      .replace(/- On Sale!.*/i, "")
      .trim();

    $(".col-sm-4.m-b-2 li").each(function (i, elm) {
      const grabrvars = $(elm).text().split(":");
      if (grabrvars[0].includes("Released")) {
        release = $moment(grabrvars[1].trim().replace(" ", "-"), "MMM-DD-YYYY").valueOf();
      }
    });

    const studioName = $(`.title-rating-section .item-info > a`).eq(0).text().trim();

    const frontCover = $("#front-cover img").toArray()[0];
    const frontCoverSrc = $(frontCover).attr("src") || "";
    const backCoverSrc = frontCoverSrc.replace("h.jpg", "bh.jpg");

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
      const backCoverImg = await $createImage(backCoverSrc, `${movieName} (back cover)`);

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
