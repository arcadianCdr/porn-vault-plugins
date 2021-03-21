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
function normalize(name) {
    return name.replace(/(.*)([#V]|Vol|Volume)\W*(\d+)/gi, "$1$3").replace(/\s{2,}/gm, " ");
}
function searchForMovie(ctx, name) {
    return __awaiter(this, void 0, void 0, function* () {
        const { $axios, $cheerio } = ctx;
        const url = `https://www.iafd.com/results.asp?searchtype=comprehensive&searchstring=${name}`;
        const html = (yield $axios.get(url)).data;
        const $ = $cheerio.load(html);
        const firstResult = $(".pop-execute").toArray()[0];
        const href = $(firstResult).attr("href");
        if (!href) {
            return false;
        }
        return `https://www.iafd.com${href}`;
    });
}
function searchForScene(ctx, searchSceneName, searchActors, scenesActors) {
    const { $logger } = ctx;
    if (scenesActors.length === 1) {
        return 0;
    }
    const indexFromName = matchSceneFromName(ctx, searchSceneName);
    $logger.debug(`Based on scene name matching, the scene index is: ${indexFromName}`);
    const indexFromActors = matchSceneFromActors(searchActors, scenesActors);
    $logger.debug(`Based on best actors matching, the scene index is: ${indexFromActors}`);
    return indexFromName > -1 ? indexFromName : indexFromActors;
}
function matchSceneFromName(ctx, name) {
    var _a;
    let indexFromName = -1;
    const nameMatch = Array.from(name.matchAll(new RegExp(ctx.args.sceneIndexMatchingRegex || "(.*)(Scene|S)\\W*(?<index>\\d{1,2})(.*)", "gim")));
    if (nameMatch.length === 1) {
        indexFromName = Number((_a = nameMatch[0].groups) === null || _a === void 0 ? void 0 : _a.index);
        indexFromName = isNaN(indexFromName) ? -1 : indexFromName - 1;
    }
    return indexFromName;
}
function matchSceneFromActors(searchActors, scenesActors) {
    if (!searchActors || !searchActors.length) {
        return -1;
    }
    let indexFromActors = -1;
    let matchCount = 0;
    scenesActors.forEach(function (item, i) {
        const sceneActors = item.split(", ");
        const isActorsMatch = searchActors.every((searchActor) => sceneActors.filter((sceneActor) => searchActor.localeCompare(sceneActor, undefined, { sensitivity: "base" }) === 0).length > 0);
        if (isActorsMatch) {
            matchCount++;
            indexFromActors = i;
        }
    });
    if (matchCount > 1) {
        return -2;
    }
    return indexFromActors;
}
var main = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { args, data, $axios, $cheerio, $formatMessage, $moment, sceneName, $logger, $throw } = ctx;
    if (!["sceneCreated", "sceneCustom"].includes(ctx.event)) {
        $throw("Uh oh. You shouldn't use the plugin for this type of event");
    }
    (_a = args.keepInitialSceneNameForMovies) !== null && _a !== void 0 ? _a : (args.keepInitialSceneNameForMovies = true);
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
    function getMovieInternal() {
        const scrapedMovie = $(".col-sm-12 h1")
            .text()
            .replace(/\(\d{4}\)/g, "")
            .trim();
        return scrapedMovie;
    }
    function getMovie() {
        if (isBlacklisted("movie"))
            return {};
        if (scenesActors.length > 1) {
            return { movie: getMovieInternal() };
        }
        return {};
    }
    function getName() {
        const movie = getMovieInternal();
        if (scenesActors.length === 1) {
            return { name: movie };
        }
        let scrapedName = $(scenesBreakdown[sceneIndex])
            .text()
            .replace(/\. (.*)$/, "")
            .trim();
        scrapedName = args.keepInitialSceneNameForMovies ? data.name || sceneName : scrapedName;
        if (args.addMovieNameInSceneName && movie.length && scrapedName.length < 10) {
            scrapedName = `${movie} - ${scrapedName}`;
        }
        return { name: scrapedName };
    }
    function getDescription() {
        if (isBlacklisted("description") || scenesActors.length > 1)
            return {};
        const scrapedDesc = $("#synopsis.panel.panel-default > .padded-panel").text().trim();
        return { description: scrapedDesc };
    }
    function getActors() {
        if (isBlacklisted("actors"))
            return {};
        const foundActors = scenesActors[sceneIndex].split(", ");
        if (foundActors.length) {
            return { actors: foundActors };
        }
        return {};
    }
    function getStudio() {
        if (isBlacklisted("studio"))
            return {};
        const foundStudio = $("p.biodata > a[href*='/studio.rme']").text().trim();
        $logger.debug(`Found studio: '${foundStudio}'`);
        return { studio: foundStudio };
    }
    function getReleaseDate() {
        if (isBlacklisted("releaseDate"))
            return {};
        let date;
        const scrapedReleaseDate = $("p.bioheading:contains('Release Date')").next().text().trim();
        if (scrapedReleaseDate !== "No Data") {
            date = $moment(scrapedReleaseDate, "MMM DD, YYYY").valueOf();
        }
        else {
            const scrapedReleaseYear = $(".col-sm-12 h1")
                .text()
                .replace(/^(.*)\(((?:19|20)\d\d)\)$/g, "$2")
                .trim();
            date = $moment(scrapedReleaseYear, "YYYY").valueOf();
        }
        $logger.debug(`Found release date: '${date || ""}'`);
        return { releaseDate: date };
    }
    function getLabels() {
        var _a;
        if (isBlacklisted("labels"))
            return {};
        const foundLabels = [];
        const actors = ((_a = getActors()) === null || _a === void 0 ? void 0 : _a.actors) || [];
        actors.forEach(function (actor) {
            const actorLabels = $(`.castbox:contains('${actor}') > p`)
                .children()
                .remove()
                .end()
                .text()
                .trim()
                .split(" ");
            foundLabels.push(...actorLabels.filter((l) => l.length > 0 && foundLabels.indexOf(l) < 0));
        });
        return { labels: foundLabels };
    }
    const searchSceneName = data.name || sceneName;
    const searchActors = data.actors || ((_b = (yield ctx.$getActors())) === null || _b === void 0 ? void 0 : _b.map((a) => a.name));
    const searchMovie = data.movie || ((_d = (_c = (yield ctx.$getMovies())) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.name);
    const searchName = searchMovie || searchSceneName;
    $logger.info(`Scraping iafd based on name: '${searchName}'`);
    let url = false;
    url = yield searchForMovie(ctx, normalize(searchName));
    if (!url) {
        $logger.warn("Search aborted: unable to fins any results from iafd.");
        return {};
    }
    const html = (yield $axios.get(url)).data;
    const $ = $cheerio.load(html);
    const scenesDiv = $("#sceneinfo.panel.panel-default");
    const scenesBreakdown = $("li.w, li.g", scenesDiv).toArray();
    const scenesActors = scenesBreakdown.map((s) => $(s)
        .children()
        .remove()
        .end()
        .text()
        .replace(/^Scene \d+\. /, "")
        .trim());
    if (scenesActors.length > 1 && !searchMovie) {
        $logger.warn(`Aborting search. IAFD returned a multi-scene result, but no movie is present in porn-vault for '${sceneName}'. ` +
            `Look into the plugin documentation how to match multi-scene results.`);
        return {};
    }
    const sceneIndex = searchForScene(ctx, searchSceneName, searchActors, scenesActors);
    $logger.verbose(`identified scene index ${sceneIndex} out of ${scenesActors.length} scenes returned for '${searchName}'`);
    if (sceneIndex < 0) {
        $logger.warn(`Unable to match a scene. Returning with empty results.`);
        return {};
    }
    let result;
    if (sceneIndex >= scenesActors.length) {
        result = Object.assign(Object.assign(Object.assign(Object.assign({}, getMovie()), getName()), getStudio()), getReleaseDate());
    }
    else {
        result = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, getMovie()), getName()), getDescription()), getActors()), getStudio()), getReleaseDate()), getLabels());
    }
    $logger.info(`Found scene name: '${result.name}', starring: '${(_e = result.actors) === null || _e === void 0 ? void 0 : _e.join(", ")}'`);
    if (args.dry === true) {
        $logger.info(`dry mode. Would have returned: ${$formatMessage(result)}`);
        return {};
    }
    return result;
});

module.exports = main;
