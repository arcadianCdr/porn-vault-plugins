import moment from "moment";
const { createPluginRunner } = require("../../../context");
const plugin = require("../main");
const { expect } = require("chai");

const runPlugin = createPluginRunner("moviescene", plugin);

describe("moviescene", () => {
  it("Should fail", async () => {
    let errord = false;
    try {
      await runPlugin();
    } catch (error) {
      expect(error.message).to.equal("Uh oh. You shouldn't use the plugin for this type of event");
      errord = true;
    }
    expect(errord).to.be.true;
  });

  describe("Scenes", () => {
    it("Should fetch scene details based on scene name (where scene number can be found)", async () => {
      const result = await runPlugin({
        sceneName: "Fly Girls - s06",
        scenePath: "/Fly Girls - s06.mp4",
        data: { movie: "Fly Girls" },
        args: {},
      });
      expect(result).to.be.an("object");
      expect(result.name).to.equal("Fly Girls - Scene 6");
      expect(result.actors).to.be.undefined;
      expect(result.releaseDate).to.equal(moment("2010-02-16", "YYYY-MM-DD").valueOf());
      expect(result.studio).to.equal("Digital Playground");
    });
    it("Should fetch scene details based on actors match", async () => {
      const result = await runPlugin({
        sceneName: "Big Wet Asses 12 Eva",
        scenePath: "/Big Wet Asses 12 Eva.mp4",
        data: { movie: "Big Wet Asses 12", actors: ["Eva Angelina"] },
        args: {},
      });
      expect(result).to.be.an("object");
      expect(result.name).to.equal("Eva Does Anal!");
      expect(result.actors).to.be.an("array").to.have.lengthOf(2);
      expect(result.actors).to.include("Eva Angelina");
      expect(result.actors).to.include("Michael Stefano");
      expect(result.releaseDate).to.equal(moment("2007-11-20", "YYYY-MM-DD").valueOf());
      expect(result.studio).to.equal("Elegant Angel");
    });
  });
});
