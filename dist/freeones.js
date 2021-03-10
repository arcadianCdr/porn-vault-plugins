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
function cmToFt(cm) {
    cm *= 0.033;
    return Math.round((cm + Number.EPSILON) * 100) / 100;
}
function kgToLbs(kg) {
    kg *= 2.2;
    return Math.round((kg + Number.EPSILON) * 100) / 100;
}
function search({ $axios }, query, sort) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://www.freeones.com/partial/subject`;
        return (yield $axios.get(url, {
            params: {
                q: query,
                s: sort,
            },
        })).data;
    });
}
function getFirstSearchResult(ctx, query) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchHtml = yield search(ctx, query, ctx.args.searchResultsSort || "relevance");
        const $ = ctx.$cheerio.load(searchHtml);
        const el = $(".grid-item.teaser-subject>a");
        return el;
    });
}
class Measurements {
    static fromString(str) {
        const [bra, waist, hip] = str.split("-");
        if (bra && waist && hip) {
            const measurements = new Measurements();
            measurements.bust = parseInt(bra);
            measurements.cup = bra.replace(measurements.bust, "");
            measurements.waist = Number(waist);
            measurements.hip = Number(hip);
            return measurements;
        }
        return null;
    }
    toString() {
        return `${this.braSize()}-${this.waist}-${this.hip}`;
    }
    braSize() {
        return `${this.bust}${this.cup}`;
    }
}
var main = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const { $createImage, args, $axios, $moment, $cheerio, $throw, $logger, $formatMessage, actorName, } = ctx;
    if (!actorName)
        $throw("Uh oh. You shouldn't use the plugin for this type of event");
    $logger.info(`Scraping freeones date for ${actorName}, dry mode: ${args.dry || false}...`);
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
    const searchResultsSort = args.searchResultsSort;
    if (!searchResultsSort) {
        $logger.verbose("searchResultsSort preference not set. Using default 'relevance' value...");
    }
    else {
        $logger.verbose(`Search results will be ordered by key: ${searchResultsSort}.`);
    }
    const useImperial = args.useImperial;
    if (!useImperial) {
        $logger.verbose("Imperial preference not set. Using metric values...");
    }
    else {
        $logger.verbose("Imperial preference indicated. Using imperial values...");
    }
    const useAvatarAsThumbnail = args.useAvatarAsThumbnail;
    if (!useAvatarAsThumbnail) {
        $logger.verbose("Will not use the Avatar as the Actor Thumbnail...");
    }
    else {
        $logger.verbose("Will use the Avatar as the Actor Thumbnail...");
    }
    let firstResult;
    try {
        firstResult = yield getFirstSearchResult(ctx, actorName);
    }
    catch (error) {
        $throw(error.message);
        return {};
    }
    if (!firstResult)
        $throw(`${actorName} not found!`);
    const href = firstResult.attr("href");
    let html;
    try {
        html = (yield $axios.get(`https://freeones.com${href}/profile`)).data;
    }
    catch (error) {
        $throw(error.message);
        return {};
    }
    const $ = $cheerio.load(html || "");
    function getNationality() {
        if (isBlacklisted("nationality"))
            return {};
        $logger.verbose("Getting nationality...");
        const selector = $('[data-test="section-personal-information"] a[href*="countryCode%5D"]');
        if (!selector.length) {
            $logger.verbose("Nationality not found");
            return {};
        }
        const nationality = ($(selector).attr("href") || "").split("=").slice(-1)[0];
        if (!nationality) {
            return {};
        }
        return {
            nationality,
        };
    }
    function getHeight() {
        if (isBlacklisted("height"))
            return {};
        $logger.verbose("Getting height...");
        const selector = $('[data-test="link_height"] .text-underline-always');
        if (!selector)
            return {};
        const rawHeight = $(selector).text();
        const rawHeightMatch = rawHeight.match(/\d+cm/);
        const cm = rawHeightMatch ? rawHeightMatch[0] : null;
        if (!cm)
            return {};
        const height = parseInt(cm.replace("cm", ""));
        if (!useImperial)
            return { height };
        return { height: cmToFt(height) };
    }
    function getWeight() {
        if (isBlacklisted("weight"))
            return {};
        $logger.verbose("Getting weight...");
        const selector = $('[data-test="link_weight"] .text-underline-always');
        if (!selector)
            return {};
        const rawWeight = $(selector).text();
        const rawWeightMatch = rawWeight.match(/\d+kg/);
        const kg = rawWeightMatch ? rawWeightMatch[0] : null;
        if (!kg)
            return {};
        const weight = parseInt(kg.replace("kg", ""));
        if (!useImperial)
            return { weight };
        return { weight: kgToLbs(weight) };
    }
    function computeZodiac(timestamp) {
        const inputDate = $moment(timestamp);
        if (!inputDate.isValid())
            return;
        const day = inputDate.date();
        const month = inputDate.month();
        const signSwitchDay = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 22, 22];
        const signAtMonthStart = [
            "Capricorn",
            "Aquarius",
            "Pisces",
            "Aries",
            "Taurus",
            "Gemini",
            "Cancer",
            "Leo",
            "Virgo",
            "Libra",
            "Scorpio",
            "Sagittarius",
        ];
        const isBeforeSwithchDay = day <= signSwitchDay[month];
        return signAtMonthStart[isBeforeSwithchDay ? month : (month + 1) % 12];
    }
    function getZodiac() {
        if (isBlacklisted("zodiac"))
            return {};
        const bornOn = getAge().bornOn;
        if (!bornOn) {
            $logger.verbose("No birth date found => zodiac will be empty.");
            return {};
        }
        const computedZodiac = computeZodiac(bornOn.valueOf());
        $logger.verbose(`Computed zodiac sign for: ${new Date(bornOn).toLocaleDateString()}: ${computedZodiac}`);
        return { zodiac: computedZodiac };
    }
    function getBirthplace() {
        if (isBlacklisted("birthplace"))
            return {};
        $logger.verbose("Getting birthplace...");
        const selector = $('[data-test="section-personal-information"] a[href*="placeOfBirth"]');
        const cityName = selector.length
            ? ($(selector).attr("href") || "").split("=").slice(-1)[0]
            : null;
        if (!cityName) {
            $logger.verbose("No birthplace found");
            return {};
        }
        else {
            const stateSelector = $('[data-test="section-personal-information"] a[href*="province"]');
            const stateName = stateSelector.length
                ? ($(stateSelector).attr("href") || "").split("=").slice(-1)[0]
                : null;
            if (!stateName) {
                $logger.verbose("No birth province found, just city!");
                return { birthplace: cityName };
            }
            else {
                const bplace = cityName + ", " + stateName.split("-")[0].trim();
                return { birthplace: bplace };
            }
        }
    }
    function scrapeText(prop, selector) {
        if (isBlacklisted(prop))
            return {};
        $logger.verbose(`Getting ${prop}...`);
        const el = $(selector);
        if (!el)
            return {};
        return { [prop]: el.text() };
    }
    function getAvatar() {
        return __awaiter(this, void 0, void 0, function* () {
            if (args.dry)
                return {};
            if (isBlacklisted("avatar") && !useAvatarAsThumbnail) {
                return {};
            }
            $logger.verbose("Getting avatar (and/or thumbnail)...");
            const imgEl = $(`.dashboard-header img.img-fluid`);
            if (!imgEl)
                return {};
            const url = $(imgEl).attr("src");
            if (!url)
                return {};
            const imgId = yield $createImage(url, `${actorName} (avatar)`);
            const result = {};
            if (!isBlacklisted("avatar")) {
                result.avatar = imgId;
            }
            if (useAvatarAsThumbnail) {
                result.thumbnail = imgId;
            }
            return result;
        });
    }
    function getAge() {
        if (isBlacklisted("bornOn"))
            return {};
        $logger.verbose("Getting age...");
        const aTag = $('[data-test="section-personal-information"] a');
        if (!aTag)
            return {};
        const href = $(aTag).attr("href") || "";
        const yyyymmdd = href.match(/\d\d\d\d-\d\d-\d\d/);
        if (yyyymmdd && yyyymmdd.length) {
            const date = yyyymmdd[0];
            const timestamp = $moment(date, "YYYY-MM-DD").valueOf();
            return {
                bornOn: timestamp,
            };
        }
        else {
            $logger.verbose("Could not find actor birth date.");
            return {};
        }
    }
    function getAlias() {
        if (isBlacklisted("aliases"))
            return {};
        $logger.verbose("Getting aliases...");
        const aliasSel = $('[data-test="section-alias"] p[data-test*="p_aliases"]');
        const aliasText = aliasSel.text();
        const aliasName = aliasText && !/unknown/.test(aliasText) ? aliasText.trim() : null;
        if (!aliasName)
            return {};
        const aliases = aliasName.split(/,\s*/g);
        return { aliases };
    }
    function scrapeMeasurements() {
        const measurementParts = [];
        $('[data-test="p-measurements"] .text-underline-always').each(function (i, element) {
            measurementParts[i] = $(this).text();
        });
        const measurements = measurementParts.join("-");
        return Measurements.fromString(measurements);
    }
    const measurements = scrapeMeasurements();
    function getMeasurements() {
        if (isBlacklisted("measurements"))
            return {};
        $logger.verbose("Getting measurements...");
        return measurements ? { measurements: measurements.toString() } : {};
    }
    function getWaistSize() {
        if (isBlacklisted("measurements"))
            return {};
        $logger.verbose("Getting waist size...");
        return measurements ? { "waist size": measurements.waist } : {};
    }
    function getHipSize() {
        if (isBlacklisted("measurements"))
            return {};
        $logger.verbose("Getting hip size...");
        return measurements ? { "hip size": measurements.hip } : {};
    }
    function getBraSize() {
        if (isBlacklisted("measurements"))
            return {};
        $logger.verbose("Getting bra/cup/bust size...");
        return measurements
            ? {
                "cup size": measurements.cup,
                "bra size": measurements.braSize(),
                "bust size": measurements.bust,
            }
            : {};
    }
    function getGender() {
        if (isBlacklisted("gender"))
            return {};
        return { sex: "Female", gender: "Female" };
    }
    function getTattoos() {
        if (isBlacklisted("tattoos"))
            return {};
        let tattooResult = scrapeText("tattoos", '[cdata-test="p_has_tattoos"]');
        if (!tattooResult.tattoos) {
            tattooResult = scrapeText("tattoos", '[data-test="p_has_tattoos"]');
        }
        const tattooText = tattooResult.tattoos ? tattooResult.tattoos.trim() : "";
        if (!tattooText || /No Tattoos/i.test(tattooText)) {
            return {};
        }
        if (args.tattoosType === "array") {
            return { tattoos: tattooText.split(";").map((s) => s.trim()) };
        }
        return { tattoos: tattooText };
    }
    function getPiercings() {
        var _a;
        if (isBlacklisted("piercings"))
            return {};
        const res = scrapeText("piercings", '[data-test="p_has_piercings"]');
        const piercingText = (_a = res.piercings) === null || _a === void 0 ? void 0 : _a.trim();
        if (!piercingText || /No Piercings/i.test(piercingText)) {
            return {};
        }
        if (args.piercingsType === "array") {
            return { piercings: piercingText.split(";").map((s) => s.trim()) };
        }
        return { piercings: piercingText };
    }
    const custom = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, scrapeText("hair color", '[data-test="link_hair_color"] .text-underline-always')), scrapeText("eye color", '[data-test="link_eye_color"] .text-underline-always')), scrapeText("ethnicity", '[data-test="link_ethnicity"] .text-underline-always')), getHeight()), getWeight()), getMeasurements()), getWaistSize()), getHipSize()), getBraSize()), getBirthplace()), getZodiac()), getGender()), getTattoos()), getPiercings());
    if (custom.tattoos === "Unknown") {
        delete custom.tattoos;
    }
    const data = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, getNationality()), getAge()), getAlias()), (yield getAvatar())), { custom });
    if (!isBlacklisted("labels")) {
        data.labels = [];
        if (custom["hair color"]) {
            data.labels.push(`${custom["hair color"]} Hair`);
        }
        if (custom["eye color"]) {
            data.labels.push(`${custom["eye color"]} Eyes`);
        }
        if (custom.ethnicity) {
            data.labels.push(custom.ethnicity);
        }
        if (custom.gender) {
            data.labels.push("Female");
        }
        if (custom.piercings) {
            data.labels.push("Piercings");
        }
        if (custom.tattoos) {
            data.labels.push("Tattoos");
        }
    }
    if (args.dry === true) {
        $logger.info(`Would have returned: ${$formatMessage(data)}`);
        return {};
    }
    return data;
});

module.exports = main;
