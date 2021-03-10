'use strict';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

function default_1(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const { args, $axios, $cheerio, $logger, $formatMessage, actorName, $createImage } = ctx;
        const name = actorName
            .replace(/#/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();
        $logger.info(`Scraping actor info for '${name}', dry mode: ${(args === null || args === void 0 ? void 0 : args.dry) || false}...`);
        const url = `https://www.adultempire.com/allsearch/search?q=${name}`;
        const html = (yield $axios.get(url)).data;
        const $ = $cheerio.load(html);
        const firstResult = $(`a.boxcover[label="Performer"]`).toArray()[0];
        const href = $(firstResult).attr("href");
        if (href) {
            const actorUrl = `https://adultempire.com${href}`;
            const html = (yield $axios.get(actorUrl)).data;
            const $ = $cheerio.load(html);
            let avatar;
            const firstImageResult = $(`a.fancy`).toArray()[0];
            const avatarUrl = $(firstImageResult).attr("href");
            if (avatarUrl) {
                avatar = yield $createImage(avatarUrl, `${actorName} (avatar)`);
            }
            let hero;
            const secondImageResult = $(`a.fancy`).toArray()[1];
            const heroUrl = $(secondImageResult).attr("href");
            if (heroUrl) {
                hero = yield $createImage(heroUrl, `${actorName} (hero image)`);
            }
            let description;
            const descEl = $("#content .row aside");
            if (descEl) {
                description = descEl.text().trim();
            }
            let aliases = [];
            const aliasEl = $("#content .row .col-sm-5 .m-b-1");
            if (aliasEl) {
                const text = aliasEl.text();
                aliases = text
                    .replace("Alias: ", "")
                    .split(",")
                    .map((s) => s.trim());
            }
            const result = { avatar, $ae_avatar: avatarUrl, hero, $ae_hero: heroUrl, aliases, description };
            if (args === null || args === void 0 ? void 0 : args.dry) {
                $logger.info(`Would have returned ${$formatMessage(result)}`);
                return {};
            }
            else {
                return result;
            }
        }
        return {};
    });
}
var _default = default_1;

var actor = /*#__PURE__*/Object.defineProperty({
	default: _default
}, '__esModule', {value: true});

var __awaiter$1 = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

function searchForMovie({ $cheerio, $axios }, name) {
    return __awaiter$1(this, void 0, void 0, function* () {
        const url = `https://www.adultempire.com/allsearch/search?q=${name}`;
        const html = (yield $axios.get(url)).data;
        const $ = $cheerio.load(html);
        const firstResult = $(".boxcover").toArray()[0];
        const href = $(firstResult).attr("href");
        if (!href) {
            return false;
        }
        return `https://adultempire.com${href}`;
    });
}
function default_1$1(ctx) {
    return __awaiter$1(this, void 0, void 0, function* () {
        const { args, $moment, $axios, $cheerio, $logger, $formatMessage, movieName, $createImage } = ctx;
        const name = movieName
            .replace(/[#&]/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();
        $logger.info(`Scraping movie covers for '${name}', dry mode: ${(args === null || args === void 0 ? void 0 : args.dry) || false}...`);
        const url = movieName.startsWith("http") ? movieName : yield searchForMovie(ctx, name);
        if (url) {
            const movieUrl = url;
            const html = (yield $axios.get(movieUrl)).data;
            const $ = $cheerio.load(html);
            const desc = $(".m-b-0.text-dark.synopsis").text();
            let release;
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
            if ((args === null || args === void 0 ? void 0 : args.dry) === true) {
                $logger.info(`Would have returned ${$formatMessage({
                    name: movieName,
                    movieUrl,
                    frontCoverSrc,
                    backCoverSrc,
                    studioName,
                    desc,
                    release,
                })}`);
            }
            else {
                const frontCoverImg = yield $createImage(frontCoverSrc, `${movieName} (front cover)`);
                const backCoverImg = yield $createImage(backCoverSrc, `${movieName} (back cover)`);
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
    });
}
var _default$1 = default_1$1;

var movie = /*#__PURE__*/Object.defineProperty({
	default: _default$1
}, '__esModule', {value: true});

var __awaiter$2 = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

const actor_1 = __importDefault(actor);
const movie_1 = __importDefault(movie);
var main = (ctx) => __awaiter$2(void 0, void 0, void 0, function* () {
    if (ctx.movieName) {
        return movie_1.default(ctx);
    }
    if (ctx.actorName) {
        return actor_1.default(ctx);
    }
    ctx.$throw("Uh oh. You shouldn't use the plugin for this type of event");
});

module.exports = main;
