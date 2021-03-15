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

function lowercase(str) {
    return str.toLowerCase();
}
function searchForMovie({ $cheerio, $axios }, name) {
    return __awaiter(this, void 0, void 0, function* () {
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
function default_1(ctx) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        const { args, $axios, $cheerio, data, $moment, sceneName, $logger, $throw } = ctx;
        if (!["sceneCreated", "sceneCustom"].includes(ctx.event)) {
            $throw("Uh oh. You shouldn't use the plugin for this type of event");
        }
        const searchName = (_a = data.name) !== null && _a !== void 0 ? _a : sceneName;
        const searchActors = (_b = data.actors) !== null && _b !== void 0 ? _b : (_c = (yield ctx.$getActors())) === null || _c === void 0 ? void 0 : _c.map((a) => a.name);
        const searchMovie = (_d = data.movie) !== null && _d !== void 0 ? _d : (_f = (_e = (yield ctx.$getMovies())) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.name;
        if (!searchMovie && (!searchName || !searchActors.length)) {
            $throw("Not enough data to perform the search. moviescene requires at least a 'movie', and either a 'name' (containing the scene number) or some 'actors' " +
                "to identify which scene of the movie to use. Other plugins can help you scrape these data from the web or from your filenames (like fileparser).");
        }
        const blacklist = (args.blacklist || []).map(lowercase);
        if (!args.blacklist)
            $logger.verbose("No blacklist defined, returning everything...");
        if (blacklist.length)
            $logger.verbose(`Blacklist defined, will ignore: ${blacklist.join(", ")}`);
        const whitelist = (args.whitelist || []).map(lowercase);
        if (whitelist.length) {
            $logger.verbose(`Whitelist defined, will only return: ${whitelist.join(", ")}...`);
        }
        function isBlacklisted(prop) {
            if (whitelist.length) {
                return !whitelist.includes(lowercase(prop));
            }
            return blacklist.includes(lowercase(prop));
        }
        $logger.info(`Scraping scene from movie '${searchMovie}' based on name: '${sceneName}' and/or actors: '${searchActors.join()}'`);
        let url = false;
        const movieName = searchMovie
            .replace(/[#&]/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();
        url = yield searchForMovie(ctx, movieName);
        if (!url) {
            $logger.warn("Unable to identify a scene number. No results to grab.");
            return {};
        }
        const html = (yield $axios.get(url)).data;
        const $ = $cheerio.load(html);
        function getMovie() {
            if (isBlacklisted("movie"))
                return {};
            const scrapedMovie = $(`.title-rating-section .col-sm-6 h1`)
                .text()
                .replace(/[\t\n]+/g, " ")
                .replace(/ {2,}/, " ")
                .replace(/- On Sale!.*/i, "")
                .trim();
            $logger.debug(`Found movie: '${scrapedMovie}'`);
            return { movie: scrapedMovie };
        }
        function getName() {
            if (isBlacklisted("name"))
                return {};
            let scrapedName = $(".col-sm-6 > .m-b-1").eq(sceneIndex).text().trim();
            if (args.useMovieAsName && /Scene \d+/.exec(scrapedName)) {
                scrapedName = `${movieName} - ${scrapedName}`;
            }
            return { name: scrapedName };
        }
        function getActors() {
            if (isBlacklisted("actors"))
                return {};
            const foundActors = [];
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
        function getStudio() {
            if (isBlacklisted("studio"))
                return {};
            const foundStudio = $(`.title-rating-section .item-info > a`).eq(0).text().trim();
            return { studio: foundStudio };
        }
        function getReleaseDate() {
            if (isBlacklisted("releaseDate"))
                return {};
            let date;
            $(".col-sm-4.m-b-2 li").each(function (i, elm) {
                const grabrvars = $(elm).text().split(":");
                if (grabrvars[0].includes("Released")) {
                    date = $moment(grabrvars[1].trim().replace(" ", "-"), "MMM-DD-YYYY").valueOf();
                }
            });
            return { releaseDate: date };
        }
        let sceneIndexMatchedFromName = -1;
        const matchedSceneNumber = /\d{1,2}/.exec(searchName);
        if (matchedSceneNumber) {
            sceneIndexMatchedFromName = Number(matchedSceneNumber[0]) - 1;
            $logger.verbose(`Based on scene name matching, the scene index is: ${sceneIndexMatchedFromName}`);
        }
        let sceneIndexBestActorsMatch = -1;
        if (searchActors && searchActors.length > 0) {
            let foundActors;
            let bestActorsMatchCount = 0;
            let currentActorMatchesCount;
            $(".col-sm-6.text-right.text-left-xs.m-b-1").each(function (i, elm) {
                foundActors = [];
                currentActorMatchesCount = 0;
                $(elm)
                    .find("a")
                    .each(function (index, elem) {
                    const actor = $(elem).text();
                    foundActors.push(actor);
                    if (searchActors.includes(actor))
                        currentActorMatchesCount++;
                });
                if (currentActorMatchesCount > bestActorsMatchCount) {
                    bestActorsMatchCount = currentActorMatchesCount;
                    sceneIndexBestActorsMatch = i;
                }
            });
            $logger.verbose(`Based on best actors matching, the scene index is: ${sceneIndexBestActorsMatch}`);
        }
        const sceneIndex = sceneIndexMatchedFromName > -1 ? sceneIndexMatchedFromName : sceneIndexBestActorsMatch;
        if (sceneIndex < 0) {
            $logger.warn(`Unable to match a scene within the movie.`);
            return {};
        }
        $logger.info(`Found scene: index ${sceneIndex}`);
        const sceneOutput = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, getMovie), getName()), getActors()), getStudio()), getReleaseDate());
        if (args.dry === true) {
            $logger.info(`dry mode. Would have returned: ${JSON.stringify(sceneOutput)}`);
            return {};
        }
        else {
            return sceneOutput;
        }
    });
}
var _default = default_1;

var scene = /*#__PURE__*/Object.defineProperty({
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
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

const scene_1 = __importDefault(scene);
var main = (ctx) => __awaiter$1(void 0, void 0, void 0, function* () {
    if (ctx.scenePath) {
        return scene_1.default(ctx);
    }
    ctx.$throw("Uh oh. You shouldn't use the plugin for this type of event");
});

module.exports = main;
