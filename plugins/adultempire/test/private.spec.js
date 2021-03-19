const plugin = require("../main");
const { expect } = require("chai");
const { createPluginRunner } = require("../../../context");

const runPlugin = createPluginRunner("adultEmpire", plugin);

describe("adultempire", () => {
  describe("Movies", () => {
    it("Should ignore missing back cover", async () => {
      const result = await runPlugin({
        movieName: "https://www.adultempire.com/3119633/spoiled-rich-girls-porn-videos.html",
        args: {},
      });
      expect(result).to.be.an("object");
      expect(result.name).to.equal("Spoiled Rich Girls");
      expect(result.frontCover).to.be.a("string");
      expect(result.backCover).to.be.undefined;
    });
  });
});
