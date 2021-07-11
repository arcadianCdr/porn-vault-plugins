const plugin = require("../main");
const { expect } = require("chai");
const { createPluginRunner } = require("../../../context");

const runPlugin = createPluginRunner("freeones", plugin);

function search(args = {}) {
  return runPlugin({
    actorName: "Angel Tess",
    args,
  });
}

describe("freeones", () => {
  it("Should fail: search 'Angel Tess', with fuzzy name cross-check activated", async () => {
    let hasError = false;
    try {
      const result = await search({
        dry: false,
        blacklist: [],
        useImperial: false,
        useAvatarAsThumbnail: false,
        fuzzyActorCheck: true,
      });
    } catch (error) {
      hasError = true;
    }
    expect(hasError).to.be.true;
  });
});
