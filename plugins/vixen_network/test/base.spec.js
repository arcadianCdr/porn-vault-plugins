const plugin = require("../main");
const { expect } = require("chai");
const { createPluginRunner } = require("../../../context");

const runPlugin = createPluginRunner("vixen_network", plugin);

const indulgeUsResult = {
  name: "Indulge Us",
  releaseDate: 1609957800000,
  description:
    "Two tushies are better than one! Double your pleasure with European tag team Agatha and Ginebra, as they squeeze their derrieres into tight jeans for a tease then climb into bed for a fiery anal threesome.",
  actors: ["Agatha Vega", "Ginebra Bellucci"],
  custom: {
    director: "Alex Eikster",
  },
  labels: [
    "anal",
    "ass to mouth",
    "blowjob",
    "brunette",
    "cowgirl",
    "cum shot",
    "gape",
    "lingerie",
    "missionary",
    "pussy licking",
    "pussy to mouth",
    "reverse cowgirl",
    "riding",
    "sex toy",
    "threesome",
  ],
};

const fixture = [
  ["Agatha Vega, Ginebra Bellucci Indulge Us Tushy Raw [facial, threesome].mp4", indulgeUsResult],
  ["Agatha Vega, Ginebra Bellucci Indulge Us TushyRaw [facial, threesome].mp4", indulgeUsResult],
  ["Agatha Vega, Ginebra Bellucci Indulge Us Tushyraw [facial, threesome].mp4", indulgeUsResult],
  [
    "Avery Cristy Jill Kassidy Wild And Wet Vixen.avi",
    {
      name: "Wild And Wet",
      releaseDate: 1604079000000,
      description:
        "Double your trouble with Avery and Jill - two naughty girls who will stop at nothing to get a man’s attention. Nobody needs to know, and when these ladies pounce, you won’t know what hit you.",
      actors: ["Avery Cristy", "Jill Kassidy", "Michael Stefano"],
      custom: {
        director: "Laurent Sky",
      },
      labels: [
        "69",
        "ball sucking",
        "blonde",
        "blowjob",
        "cum in mouth",
        "cum swapping",
        "deep throat",
        "doggystyle",
        "double blowjob",
        "face sitting",
        "facial",
        "ffm",
        "hairy pussy",
        "handjob",
        "lingerie",
        "missionary",
        "oil",
        "pussy licking",
        "riding",
        "rimming",
        "shaved",
        "small tits",
        "threesome",
      ],
    },
  ],
];

describe("VIXEN network", () => {
  for (const [path, expected] of fixture) {
    it(`Should work for ${path}`, async () => {
      const result = await runPlugin({
        event: "sceneCreated",
        sceneName: "?????????????",
        scene: {
          name: "?????????????",
          path,
        },
      });
      expect(result.name).to.equal(expected.name);
      expect(result.releaseDate).to.equal(expected.releaseDate);
      expect(result.description).to.equal(expected.description);
      expect(result.actors).to.deep.equal(expected.actors);
      expect(result.custom).to.deep.equal(expected.custom);
      expect(result.labels).to.deep.equal(expected.labels);
      expect(result.$thumbnail).to.be.a("string").that.contains("TRIPPLE");
      expect(result.thumbnail).to.be.undefined;
      expect(result.$markers).to.have.length(0);
    });
  }
});
