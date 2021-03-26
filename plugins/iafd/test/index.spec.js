import moment from "moment";
const { createPluginRunner } = require("../../../context");
const plugin = require("../main");
const { expect } = require("chai");

const runPlugin = createPluginRunner("iafd", plugin);

describe("iafd", function () {
  this.timeout(15000);

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

  describe("Scene identification...", () => {
    it("Should match single-scene result with just the scene name...", async () => {
      const result = await runPlugin({
        event: "sceneCreated",
        $getMovies: async () => [],
        $getActors: async () => [],
        sceneName: "Sexy doctor takes advantage of male nurse",
        args: {},
      });
      expect(result).to.be.an("object");
      expect(result.name).to.equal("Sexy Doctor Takes Advantage Of Male Nurse");
    });
    it("Should match multi-scene results with a movie name and a scene name containing an index...", async () => {
      const result = await runPlugin({
        event: "sceneCreated",
        $getMovies: async () => [{ name: "Anal Craving MILFs 8" }],
        $getActors: async () => [],
        sceneName: "S03",
        args: {},
      });
      expect(result).to.be.an("object");
      expect(result.name).to.equal("S03");
    });
    it("Should match multi-scene results with a movie name and matching actors for one of the scenes...", async () => {
      const result = await runPlugin({
        event: "sceneCreated",
        $getMovies: async () => [{ name: "Anal Craving MILFs 8" }],
        $getActors: async () => [{ name: "LaSirena69" }, { name: "Mark Wood" }],
        sceneName: "Scene Three",
        args: { keepInitialSceneNameForMovies: false },
      });
      expect(result).to.be.an("object");
      expect(result.name).to.equal("Scene 3");
    });
    it("Should match multi-scene results with a movie name and a scene name containing an ambiguous index...", async () => {
      const result = await runPlugin({
        event: "sceneCreated",
        $getMovies: async () => [{ name: "Anal Craving MILFs 8" }],
        $getActors: async () => [],
        sceneName: "S01 filmed on the 4th of July",
      });
      expect(result).to.be.an("object");
      expect(result.name).to.equal("S01 filmed on the 4th of July");
      expect(result.actors).to.be.a("Array");
      expect(result.actors).to.contain("Sarah Jessie");
    });
    it("Should NOT match multi-scene results with just the scene name...", async () => {
      const result = await runPlugin({
        event: "sceneCreated",
        $getMovies: async () => [],
        $getActors: async () => [],
        sceneName: "Anal Craving MILFs 8",
        args: {},
      });
      expect(result).to.be.an("object");
      expect(result).to.be.empty;
    });
    it("Should NOT match multi-scene results with just the movie name...", async () => {
      const result = await runPlugin({
        event: "sceneCreated",
        $getMovies: async () => [],
        $getActors: async () => [],
        sceneName: "Nothing helping the match here...",
        data: { movie: "Anal Craving MILFs 8" },
        args: {},
      });
      expect(result).to.be.an("object");
      expect(result).to.be.empty;
    });
    it("Should NOT match multi-scene results when more than one scene matches the searched actor(s)...", async () => {
      const result = await runPlugin({
        event: "sceneCreated",
        sceneName: "Unknown",
        data: {
          movie: "Ultimate Fuck Toy: Kennedy Leigh",
          actors: ["Kennedy Leigh", "Jules Jordan"],
        },
        args: {},
      });
      expect(result).to.be.empty;
    });
  });

  describe("Scene scraping...", () => {
    it("Should scrape all details of a single-scene result...", async () => {
      const result = await runPlugin({
        event: "sceneCreated",
        $getMovies: async () => [],
        $getActors: async () => [],
        sceneName: "Sexy doctor takes advantage of male nurse",
        args: {},
      });
      expect(result).to.be.an("object");
      expect(result.name).to.equal("Sexy Doctor Takes Advantage Of Male Nurse");
      expect(result.actors).to.be.a("Array");
      expect(result.actors).to.contain("Andy San Dimas");
      expect(result.actors).to.contain("Keiran Lee");
      expect(result.releaseDate).to.equal(moment("2011", "YYYY").valueOf());
      expect(result.description).to.equal(
        "Andy is a doctor and she has been having fun teasing and bossing around Keiran, who is a male nurse. A doctor at the hospital humiliates Keiran and this pisses off Andy, so, to get even with the doctor, she rejects him and starts coming on ..."
      );
      expect(result.labels).to.be.a("Array");
      expect(result.labels).to.contain("Facial");
      expect(result.labels).to.contain("Swallow");
      expect(result.movie).to.be.undefined;
      expect(result.studio).to.equal("doctoradventures.com");
    });
    it("Should scrape all details from a multi-scene title...", async () => {
      const result = await runPlugin({
        event: "sceneCreated",
        sceneName: "Unknown",
        data: {
          movie: "Anal Craving MILFs 8",
          actors: ["LaSirena69"],
        },
        args: { keepInitialSceneNameForMovies: false },
      });
      expect(result).to.be.an("object");
      expect(result.name).to.equal("Scene 3");
      expect(result.actors).to.be.a("Array");
      expect(result.actors).to.contain("LaSirena69");
      expect(result.actors).to.contain("Mark Wood");
      expect(result.releaseDate).to.equal(moment("2020-02-12", "YYYY-MM-DD").valueOf());
      expect(result.description).to.be.undefined;
      expect(result.labels).to.be.a("Array");
      expect(result.labels).to.contain("Anal");
      expect(result.labels).to.contain("Facial");
      expect(result.labels).to.contain("Bald");
      expect(result.labels).to.contain("Swallow");
      expect(result.labels).to.contain("A2M");
      expect(result.movie).to.equal("Anal Craving MILFs 8");
      expect(result.studio).to.equal("LeWood");
    });
    it("Should use args an initial data via server functions (actors only)...", async () => {
      const result = await runPlugin({
        event: "sceneCreated",
        sceneName: "Unknown",
        $getMovies: async () => [{ name: "Anal Craving MILFs 8" }],
        $getActors: async () => [{ name: "LaSirena69" }],
        args: {
          addMovieNameInSceneName: true,
          keepInitialSceneNameForMovies: false,
          blacklist: ["studio", "labels", "actors", "releaseDate", "movie"],
        },
      });
      expect(result).to.be.an("object");
      expect(result.name).to.equal("Anal Craving MILFs 8 - Scene 3");
      expect(result.actors).to.be.undefined;
      expect(result.releaseDate).to.be.undefined;
      expect(result.description).to.be.undefined;
      expect(result.labels).to.be.undefined;
      expect(result.movie).to.be.undefined;
      expect(result.studio).to.be.undefined;
    });
    it("Should scrape partial details from a multi-scene title when the scene index is higher than what IAFD references (out of bounds)...", async () => {
      const result = await runPlugin({
        event: "sceneCreated",
        $getActors: async () => [],
        sceneName: "Scene 10",
        data: {
          movie: "Anal Craving MILFs 8",
        },
        args: {
          addMovieNameInSceneName: true,
        },
      });
      expect(result).to.be.an("object");
      expect(result.name).to.equal("Anal Craving MILFs 8 - Scene 10");
      expect(result.actors).to.be.undefined;
      expect(result.releaseDate).to.equal(moment("2020-02-12", "YYYY-MM-DD").valueOf());
      expect(result.description).to.be.undefined;
      expect(result.labels).to.be.undefined;
      expect(result.movie).to.equal("Anal Craving MILFs 8");
      expect(result.studio).to.equal("LeWood");
    });
  });
});
