'use strict';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn) {
  var module = { exports: {} };
	return fn(module, module.exports), module.exports;
}

var utils = createCommonjsModule(function (module, exports) {
var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.entries = exports.executeScape = exports.scanFolder = exports.validateArgs = void 0;
const validateArgs = (ctx) => {
    const baseScrapeDefinition = ctx.$zod.object({
        path: ctx.$zod.string().refine((val) => val && val.trim().length, "The path cannot be empty"),
        searchTerms: ctx.$zod.array(ctx.$zod.string()).optional(),
        blacklistTerms: ctx.$zod.array(ctx.$zod.string()).optional(),
        max: ctx.$zod.number().optional(),
        mustMatchInFilename: ctx.$zod.boolean().optional(),
    });
    const ActorConf = baseScrapeDefinition.extend({
        prop: ctx.$zod.enum(["thumbnail", "altThumbnail", "avatar", "hero", "extra"]),
    });
    const SceneConf = baseScrapeDefinition.extend({
        prop: ctx.$zod.enum(["thumbnail", "extra"]),
    });
    const MovieConf = baseScrapeDefinition.extend({
        prop: ctx.$zod.enum(["backCover", "frontCover", "spineCover", "extra"]),
    });
    const StudioConf = baseScrapeDefinition.extend({
        prop: ctx.$zod.enum(["thumbnail", "extra"]),
    });
    const ArgsSchema = ctx.$zod.object({
        dry: ctx.$zod.boolean().optional(),
        actors: ctx.$zod.array(ActorConf).optional(),
        scenes: ctx.$zod.array(SceneConf).optional(),
        movies: ctx.$zod.array(MovieConf).optional(),
        studios: ctx.$zod.array(StudioConf).optional(),
    });
    try {
        ArgsSchema.parse(ctx.args);
    }
    catch (err) {
        return err;
    }
    return true;
};
exports.validateArgs = validateArgs;
const IMAGE_EXTENSIONS = [".jpg", ".png", ".jpeg", ".gif"];
function scanFolder(ctx, query, scrapeDefinition) {
    return __awaiter(this, void 0, void 0, function* () {
        const queryPath = ctx.$path.resolve(scrapeDefinition.path);
        ctx.$logger.info(`Trying to find "${scrapeDefinition.prop}" pictures of "${query}" in "${queryPath}"`);
        if (scrapeDefinition.prop === "extra" && scrapeDefinition.max === 0) {
            ctx.$logger.verbose(`"max" is 0, will not search`);
            return {};
        }
        const foundImagePaths = [];
        yield ctx.$walk({
            dir: queryPath,
            extensions: IMAGE_EXTENSIONS,
            exclude: [],
            cb: (imagePath) => __awaiter(this, void 0, void 0, function* () {
                const itemsToMatch = [query, ...(scrapeDefinition.searchTerms || [])].map((el) => ({
                    _id: `${scrapeDefinition.prop} ${el}`,
                    name: el,
                }));
                const blacklistedItems = (scrapeDefinition.blacklistTerms || []).map((str) => ({
                    _id: str,
                    name: str,
                }));
                const pathToMatch = scrapeDefinition.mustMatchInFilename
                    ? ctx.$path.basename(imagePath)
                    : imagePath;
                const isMatch = ctx.$matcher.filterMatchingItems(itemsToMatch, pathToMatch, (el) => [el.name]).length ===
                    itemsToMatch.length &&
                    !ctx.$matcher.filterMatchingItems(blacklistedItems, pathToMatch, (el) => [el.name]).length;
                if (!isMatch) {
                    return;
                }
                foundImagePaths.push(imagePath);
                if (scrapeDefinition.prop !== "extra" ||
                    (scrapeDefinition.max &&
                        scrapeDefinition.max > 0 &&
                        foundImagePaths.length >= scrapeDefinition.max)) {
                    return true;
                }
            }),
        });
        if (!foundImagePaths.length) {
            ctx.$logger.verbose(`No "${scrapeDefinition.prop}" pictures of "${query}" in "${queryPath}"`);
            return {};
        }
        ctx.$logger.verbose(`Found ${foundImagePaths.length} "${scrapeDefinition.prop}" picture(s) for "${query}": ${JSON.stringify(foundImagePaths)}`);
        return {
            [scrapeDefinition.prop]: scrapeDefinition.prop === "extra" ? foundImagePaths : foundImagePaths[0],
        };
    });
}
exports.scanFolder = scanFolder;
function executeScape(ctx, query, scrapeDefinitions) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = { extra: [] };
        const scrapePromises = scrapeDefinitions.map((definition) => scanFolder(ctx, query, definition)
            .then((scanRes) => {
            const image = scanRes[definition.prop];
            if (definition.prop !== "extra" && image && typeof image === "string") {
                result[definition.prop] = image;
            }
            else if (scanRes.extra) {
                result.extra.push(...scanRes.extra);
            }
        })
            .catch((err) => {
            ctx.$logger.error(ctx.$formatMessage(err));
            ctx.$logger.error(`scrape "${definition.prop}" in "${definition.path}" failed`);
            return {};
        }));
        yield Promise.all(scrapePromises);
        return result;
    });
}
exports.executeScape = executeScape;
exports.entries = Object.entries;
});

var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


const eventScrapers = [
    {
        events: ["actorCreated", "actorCustom"],
        queryProp: "actorName",
        definitionObj: "actors",
    },
    {
        events: ["sceneCreated", "sceneCustom"],
        queryProp: "sceneName",
        definitionObj: "scenes",
    },
    {
        events: ["movieCreated", "movieCustom"],
        queryProp: "movieName",
        definitionObj: "movies",
    },
    {
        events: ["studioCreated", "studioCustom"],
        queryProp: "studioName",
        definitionObj: "studios",
    },
];
var main = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const eventScraperDefinition = eventScrapers.find((scraper) => scraper.events.includes(ctx.event));
    if (!eventScraperDefinition) {
        ctx.$throw(`Uh oh. You shouldn't use the plugin for this type of event "${ctx.event}", cannot run plugin`);
        return {};
    }
    const res = utils.validateArgs(ctx);
    if (res !== true) {
        ctx.$logger.error(`"args" schema is incorrect`);
        ctx.$throw(res);
        return {};
    }
    const query = ctx[eventScraperDefinition.queryProp];
    if (!query) {
        ctx.$throw(`Did not receive name to search for. Expected a string from ${eventScraperDefinition.queryProp}`);
        return {};
    }
    const scrapeDefs = ctx.args[eventScraperDefinition.definitionObj];
    if (!scrapeDefs || !Array.isArray(scrapeDefs) || !scrapeDefs.length) {
        ctx.$throw(`Arguments did not contain object with paths to search for. Expected "args.${eventScraperDefinition.definitionObj}"`);
        return {};
    }
    const scrapeResult = yield utils.executeScape(ctx, query, scrapeDefs);
    if ((_a = ctx.args) === null || _a === void 0 ? void 0 : _a.dry) {
        ctx.$logger.info(`Is 'dry' mode, would've returned: ${ctx.$formatMessage(scrapeResult)}`);
        return {};
    }
    const finalResult = {};
    for (const [prop, image] of utils.entries(scrapeResult)) {
        if (prop !== "extra" && typeof image === "string") {
            finalResult[prop] = yield ctx.$createLocalImage(image, `${query} (${prop})`, true);
        }
        else if (Array.isArray(image)) {
            for (const extraImage of image) {
                yield ctx.$createLocalImage(extraImage, `${query} (extra)`, false);
            }
        }
    }
    return finalResult;
});

module.exports = main;
