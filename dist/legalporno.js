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

function extractShootId(originalTitle) {
    const sceneIdMatch = originalTitle.match(/(AB|AF|GP|SZ|IV|GIO|RS|TW|MA|FM|SAL|NR|AA|GL|BZ|FS|KS|OTS|NF|NT|AX|RV|CM|BTG|MS|YE|VK|SAA|SF|ALS|QE|SA|BRB|SHN|NRX|MSV|PF)\d+/i);
    const shootId = sceneIdMatch ? sceneIdMatch[0] : null;
    return shootId;
}
function directSearch(ctx, sceneId) {
    return __awaiter(this, void 0, void 0, function* () {
        ctx.$logger.verbose(`Getting scene: ${sceneId}`);
        const res = yield ctx.$axios.get(`https://www.analvids.com/search`, {
            params: {
                query: sceneId,
            },
        });
        const url = res.request.res.responseUrl;
        if (url.includes("/watch")) {
            return url;
        }
        return null;
    });
}
function autocompleteSearch(ctx, sceneId) {
    return __awaiter(this, void 0, void 0, function* () {
        ctx.$logger.verbose(`Searching for scenes using query: ${sceneId}`);
        const { terms } = (yield ctx.$axios.get("https://www.analvids.com/api/autocomplete/search", {
            params: {
                q: sceneId,
            },
        })).data;
        const term = terms.find(({ name }) => name.toLowerCase().includes(sceneId.toLowerCase()));
        return (term === null || term === void 0 ? void 0 : term.url) || null;
    });
}
function getSceneUrl(ctx, sceneId) {
    return __awaiter(this, void 0, void 0, function* () {
        const directUrl = yield directSearch(ctx, sceneId);
        if (directUrl) {
            return directUrl;
        }
        const searchUrl = yield autocompleteSearch(ctx, sceneId);
        return searchUrl;
    });
}
var main = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { $logger, sceneName, event } = ctx;
    const args = ctx.args;
    if (!sceneName) {
        $logger.warn(`Invalid event: ${event}`);
        return {};
    }
    $logger.verbose(`Extracting shoot ID from scene name: ${sceneName}`);
    const shootId = extractShootId(sceneName);
    if (shootId) {
        const cleanShootId = shootId.trim();
        $logger.info("Extracted scene ID: " + cleanShootId);
        const result = {
            custom: {
                "Shoot ID": cleanShootId,
                "Scene ID": cleanShootId,
            },
        };
        if (args.useSceneId) {
            result.name = cleanShootId;
            $logger.verbose("Setting name to shoot ID");
        }
        if (args.deep === false) {
            $logger.verbose("Not getting deep info");
        }
        else {
            const sceneUrl = yield getSceneUrl(ctx, cleanShootId);
            if (!sceneUrl) {
                $logger.warn(`Scene not found for shoot ID: ${cleanShootId}`);
            }
            else {
                $logger.verbose(`Getting more scene info (deep: true): ${sceneUrl}`);
                const html = (yield ctx.$axios.get(sceneUrl)).data;
                const $ = ctx.$cheerio.load(html, { normalizeWhitespace: true });
                if (!args.useSceneId) {
                    const originalTitle = $("h1.watchpage-title").text().trim();
                    result.name = originalTitle;
                }
                result.releaseDate = ctx.$moment
                    .utc($('span[title="Release date"] a').text(), "YYYY-MM-DD")
                    .valueOf();
                const [actorsElement, tagsElement, descriptionElement] = $(".scene-description__row").toArray();
                result.description =
                    ((_b = (_a = $('meta[name="description"]')) === null || _a === void 0 ? void 0 : _a.attr("content")) === null || _b === void 0 ? void 0 : _b.trim()) ||
                        (descriptionElement && $(descriptionElement).find("dd").text().trim());
                result.actors = $(actorsElement)
                    .find('a[href*="com/model"]')
                    .map((_, actorElement) => $(actorElement).text())
                    .toArray()
                    .sort();
                result.labels = $(tagsElement)
                    .find("a")
                    .map((_, tagElement) => $(tagElement).text())
                    .toArray()
                    .sort();
                result.studio = $(".watchpage-studioname").first().text().trim();
            }
        }
        if (args.dry) {
            $logger.warn(`Would have returned ${ctx.$formatMessage(result)}`);
            return {};
        }
        return result;
    }
    $logger.info("No scene ID found");
    return {};
});

module.exports = main;
