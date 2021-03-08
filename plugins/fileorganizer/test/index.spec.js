const { createPluginRunner } = require("../../../context");
const plugin = require("../main");
const { expect } = require("chai");

const runPlugin = createPluginRunner("fileorganizer", plugin);

describe("fileorganizer", () => {
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

  describe("Normal behavior...", () => {
    it("Should rename with a mix of initial data and plug-in piped data, while ignoring non relevant or duplicate data", async () => {
      const result = await runPlugin({
        event: "sceneCustom",
        scene: {
          name: "Initial scene name",
          releaseDate: new Date(2015, 10, 20).valueOf(),
        },
        sceneName: "Should be ignored",
        scenePath: "/parent/Irrelevant.mp4",
        data: {
          actors: ["Last1 First1", "Last2 First2"],
          releaseDate: new Date(2020, 10, 20).valueOf(),
        },
        args: {
          fileStructureTemplate:
            "{<studio>}{ ~ <releasedate>}{ ~ <ACTORS>}{ ~ <nAme>}{ (<movies2>)}",
          isMochaTesting: true,
        },
        $getActors: async () => [{ name: "Tobe Ignored" }, { name: "Tobe Ignored" }],
        $getMovies: async () => [{ name: "InitialMovie1" }, { name: "InitialMovie2" }],
        $getStudio: async () => {
          return { name: "InitialStudio" };
        },
      });
      expect(result.path).to.equal(
        "/parent/InitialStudio ~ 2020-11-20 ~ Last1 First1, Last2 First2 ~ Initial scene name (InitialMovie2).mp4"
      );
    });
    it("Should use all supported template fields from piped data", async () => {
      const result = await runPlugin({
        event: "sceneCustom",
        name: "NAME",
        releaseDate: new Date(2018, 10, 20).valueOf(),
        rating: 7,
        scene: {
          meta: {
            duration: 1024,
            dimensions: { width: 4096, height: 2160 },
          },
        },
        sceneName: "Should be ignored",
        scenePath: "/dir/Irrelevant.mp4",
        data: {
          name: "_NAME",
          actors: ["_ACTORS"],
          studio: "_STUDIO",
          releaseDate: new Date(2020, 10, 20).valueOf(),
          rating: 8,
          movie: "_MOVIE",
          labels: ["_LABELS"],
        },
        args: {
          fileStructureTemplate:
            "{n.<name> }{d.<releaseDate> }{r.<rating> }{h.<videoHeight>p }{w.<videoWidth> }{d.<videoDuration> }{a.<actors> }{s.<studio> }{m.<movies> }{l.<labels>}",
          isMochaTesting: true,
        },
        $getActors: async () => [{ name: "ACT1" }, { name: "ACT2" }],
        $getMovies: async () => [{ name: "MOV1" }, { name: "MOV2" }],
        $getLabels: async () => [{ name: "LAB1" }, { name: "LAB2" }],
        $getStudio: async () => {
          return { name: "STUDIO" };
        },
      });
      expect(result.path).to.equal(
        "/dir/n._NAME d.2020-11-20 r.8 h.2160p w.4096 d.17∶04 a._ACTORS s._STUDIO m._MOVIE l._LABELS.mp4"
      );
    });
    it("Should use all supported template fields from the scene's initial data (via server functions)", async () => {
      const result = await runPlugin({
        event: "sceneCustom",
        scene: {
          name: "NAME",
          releaseDate: new Date(2018, 10, 23).valueOf(),
          rating: 7,
          meta: {
            duration: 1024,
            dimensions: { width: 4096, height: 2160 },
          },
        },
        sceneName: "Should be ignored",
        scenePath: "/dir/Irrelevant.mp4",
        args: {
          fileStructureTemplate:
            "{n.<name> }{d.<releaseDate> }{r.<rating> }{h.<videoHeight>p }{w.<videoWidth> }{d.<videoDuration> }{a.<actors> }{s.<studio> }{m.<movies> }{l.<labels>}",
          isMochaTesting: true,
        },
        $getActors: async () => [{ name: "ACT1" }, { name: "ACT2" }],
        $getMovies: async () => [{ name: "MOV1" }, { name: "MOV2" }],
        $getLabels: async () => [{ name: "LAB1" }, { name: "LAB2" }],
        $getStudio: async () => {
          return { name: "STUDIO" };
        },
      });
      expect(result.path).to.equal(
        "/dir/n.NAME d.2018-11-23 r.7 h.2160p w.4096 d.17∶04 a.ACT1, ACT2 s.STUDIO m.MOV1, MOV2 l.LAB1, LAB2.mp4"
      );
    });
    it("Should not rename when a mandatory field has no value", async () => {
      const result = await runPlugin({
        event: "sceneCustom",
        scene: {
          name: "Initial scene name",
        },
        sceneName: "Should be ignored",
        scenePath: "/parent/Irrelevant.mp4",
        args: {
          fileStructureTemplate: "{<studio!>}{ ~ <name>}",
          isMochaTesting: true,
        },
        $getStudio: async () => {},
      });
      expect(result.path).to.be.undefined;
    });
  });

  describe("Name normalize & sanitize...", () => {
    it("Should remove all illegal characters and use custom replacements from args...", async () => {
      const result = await runPlugin({
        event: "sceneCustom",
        scene: {
          name:
            'Dirty  scene? ...not the kind if "dirty" you\'re thinking about, Chloé! :+) / ? < >  : * |',
        },
        scenePath: "/parent/dir/Irrelevant.mp4",
        args: {
          fileStructureTemplate: "{<name>}",
          normalizeAccents: true,
          normalizeMultipleSpaces: true,
          characterReplacement: [
            { original: ":", replacement: " - " },
            { original: "|", replacement: "," },
          ],
          isMochaTesting: true,
        },
      });
      expect(result.path).to.equal(
        "/parent/dir/Dirty scene ...not the kind if dirty you're thinking about, Chloe! - +) ,.mp4"
      );
    });
    it("Should remove illegal characters, but not normalize...", async () => {
      const result = await runPlugin({
        event: "sceneCustom",
        scene: {
          name:
            "Yëëp, what <b>a   strânge</b> filename! These look like illegal chars, but are allowed ∶",
        },
        scenePath: "/dir/Irrelevant.mp4",
        args: {
          fileStructureTemplate: "{<name>}",
          normalizeAccents: false,
          normalizeMultipleSpaces: false,
          isMochaTesting: true,
        },
      });
      expect(result.path).to.equal(
        "/dir/Yëëp, what ba   strângeb filename! These look like illegal chars, but are allowed ∶.mp4"
      );
    });
  });

  describe("Name conflicts handling...", () => {
    it("Should rename with counter suffix...", async () => {
      const result = await runPlugin({
        event: "sceneCustom",
        scene: {
          name: "dummy",
        },
        scenePath: "./plugins/fileorganizer/test/fixtures/irrelevant.txt",
        args: {
          fileStructureTemplate: "{<name>}",
          nameConflictHandling: "rename",
          isMochaTesting: true,
        },
      });
      expect(result.path).to.equal("./plugins/fileorganizer/test/fixtures/dummy(2).txt");
    });
    it("Should skip rename...", async () => {
      const result = await runPlugin({
        event: "sceneCustom",
        scene: {
          name: "dummy",
        },
        scenePath: "./plugins/fileorganizer/test/fixtures/irrelevant.txt",
        args: {
          fileStructureTemplate: "{<name>}",
          nameConflictHandling: "skip",
          isMochaTesting: true,
        },
      });
      expect(result.path).to.be.undefined;
    });
    it("Should overwrite...", async () => {
      const result = await runPlugin({
        event: "sceneCustom",
        scene: {
          name: "dummy",
        },
        scenePath: "./plugins/fileorganizer/test/fixtures/irrelevant.txt",
        args: {
          fileStructureTemplate: "{<name>}",
          nameConflictHandling: "overwrite",
          isMochaTesting: true,
        },
      });
      expect(result.path).to.equal("./plugins/fileorganizer/test/fixtures/dummy.txt");
    });
  });

  describe("Invalid arguments...", () => {
    it("Should not rename if an unknown field is used in template...", async () => {
      const result = await runPlugin({
        event: "sceneCustom",
        scene: {
          name: "a simple scene name",
        },
        scenePath: "/dir/a simple scene name.mp4",
        args: {
          fileStructureTemplate: "{<naaame>}",
          isMochaTesting: true,
        },
      });
      expect(result.path).to.be.undefined;
    });
    it("Should not rename if an unknown field argument is used in template...", async () => {
      const result = await runPlugin({
        event: "sceneCustom",
        scene: {
          name: "a simple scene name",
        },
        scenePath: "/dir/a simple scene name.mp4",
        args: {
          fileStructureTemplate: "{<name?>}",
          isMochaTesting: true,
        },
      });
      expect(result.path).to.be.undefined;
    });
  });
});
