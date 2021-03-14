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
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { args, $axios, $cheerio, data, $moment, sceneName, scenePath, $logger, $throw } = ctx;
        if (!scenePath)
            $throw("Uh oh. You shouldn't use the plugin for this type of event");
        const searchName = (_a = data.name) !== null && _a !== void 0 ? _a : sceneName;
        const searchActors = data.actors;
        const searchMovie = data.movie;
        let name;
        let movie;
        let studio;
        let actors;
        let releaseDate;
        let url = false;
        let movieName = "";
        $logger.warn(`Piped data: ${JSON.stringify(ctx.data, null, "\t")}`);
        $logger.info(`Scraping scene: ${sceneName} with input data: scene name: '${searchName}', movie: '${searchMovie}', actors: ${JSON.stringify(searchActors)}`);
        if (searchMovie) {
            movieName = searchMovie
                .replace(/[#&]/g, "")
                .replace(/\s{2,}/g, " ")
                .trim();
            url = yield searchForMovie(ctx, movieName);
        }
        else {
            $logger.warn("No movie in the piped data. No results to grab.");
        }
        if (!url) {
            $logger.warn("Unable to identify a scene number. No results to grab.");
        }
        else {
            const html = (yield $axios.get(url)).data;
            const $ = $cheerio.load(html);
            movie = $(`.title-rating-section .col-sm-6 h1`)
                .text()
                .replace(/[\t\n]+/g, " ")
                .replace(/ {2,}/, " ")
                .replace(/- On Sale!.*/i, "")
                .trim();
            $logger.verbose(`Looking up scene number for found movie: '${movie}'`);
            let sceneIndexMatchedFromName;
            const matchedSceneNumber = /\d{1,2}/.exec(searchName);
            if (matchedSceneNumber) {
                sceneIndexMatchedFromName = Number(matchedSceneNumber[0]) - 1;
                $logger.verbose(`Based on scene name matching, the scene index is: ${sceneIndexMatchedFromName}`);
            }
            let sceneIndexBestActorsMatch;
            if (searchActors && searchActors.length > 0) {
                let actorsFound;
                let bestActorsMatchCount = 0;
                let currentActorMatchesCount;
                $(".col-sm-6.text-right.text-left-xs.m-b-1").each(function (i, elm) {
                    actorsFound = [];
                    currentActorMatchesCount = 0;
                    $(elm)
                        .find("a")
                        .each(function (index, elem) {
                        const actor = $(elem).text();
                        actorsFound.push(actor);
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
            const sceneIndex = sceneIndexMatchedFromName !== null && sceneIndexMatchedFromName !== void 0 ? sceneIndexMatchedFromName : sceneIndexBestActorsMatch;
            if (sceneIndex !== undefined && sceneIndex > -1) {
                name = $(".col-sm-6 > .m-b-1").eq(sceneIndex).text().trim();
                if (/Scene \d+/.exec(name)) {
                    name = `${movieName} - ${name}`;
                }
                $logger.info(`Found scene: ${name} based on movie '${movie}' and scene index: ${sceneIndex}`);
                const actorsFound = [];
                $(".col-sm-6.text-right.text-left-xs.m-b-1 > div")
                    .eq(sceneIndex)
                    .each(function (i, elm) {
                    $(elm)
                        .find("a")
                        .each(function (index, elem) {
                        actorsFound.push($(elem).text());
                    });
                });
                if (actorsFound.length > 0)
                    actors = actorsFound;
                studio = $(`.title-rating-section .item-info > a`).eq(0).text().trim();
                $(".col-sm-4.m-b-2 li").each(function (i, elm) {
                    const grabrvars = $(elm).text().split(":");
                    if (grabrvars[0].includes("Released")) {
                        releaseDate = $moment(grabrvars[1].trim().replace(" ", "-"), "MMM-DD-YYYY").valueOf();
                    }
                });
            }
        }
        const sceneOutput = {
            name,
            releaseDate,
            actors,
            studio,
            movie,
        };
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
