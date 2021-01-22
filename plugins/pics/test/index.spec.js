const plugin = require("../main");
const { expect } = require("chai");
const {
  actorFixtures,
  movieFixtures,
  studioFixtures,
  sceneFixtures,
  basicFixtures,
  actorCreateImageFixtures,
} = require("./fixtures/main.fixtures");
const { createPluginRunner } = require("../../../context");

const runPlugin = createPluginRunner("pics", plugin);

describe("pics", () => {
  describe("basic", () => {
    // eslint-disable-next-line mocha/no-setup-in-describe
    basicFixtures.forEach((fixture, fixtureIndex) => {
      it(`${fixtureIndex} ${fixture.name}`, async () => {
        let errored = false;

        try {
          await runPlugin({
            ...fixture.runContext,
          });
        } catch (err) {
          if (fixture.errorMessage) {
            expect(err.message.includes(fixture.errorMessage)).to.be.true;
          }
          errored = true;
          if (!fixture.errored) {
            console.error(err);
          }
        }

        expect(errored).to.equal(Boolean(fixture.errored));
      });
    });
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  ["actorCreated", "actorCustom"].forEach((event) => {
    describe(event, () => {
      // eslint-disable-next-line mocha/no-setup-in-describe
      actorFixtures.forEach((fixture, fixtureIndex) => {
        it(`${fixtureIndex} ${fixture.name}`, async () => {
          let errored = false;
          let result;

          try {
            result = await runPlugin({
              ...fixture.runContext,
              event,
            });
          } catch (err) {
            if (fixture.errorMessage) {
              expect(err.message.includes(fixture.errorMessage)).to.be.true;
            }
            errored = true;
            if (!fixture.errored) {
              console.error(err);
            }
          }

          expect(errored).to.equal(Boolean(fixture.errored));

          if (fixture.result) {
            expect(result).to.be.an("object");
            expect(result).to.deep.equal(fixture.result);
          }
        });
      });

      // eslint-disable-next-line mocha/no-setup-in-describe
      actorCreateImageFixtures.forEach((fixture, fixtureIndex) => {
        it(`${fixtureIndex} ${fixture.name}`, async () => {
          let errored = false;
          let createImageCallCount = 0;
          let result;

          try {
            result = await runPlugin({
              ...fixture.runContext,
              $createLocalImage: () => {
                createImageCallCount++;
              },
              event,
            });
          } catch (err) {
            if (fixture.errorMessage) {
              expect(err.message.includes(fixture.errorMessage)).to.be.true;
            }
            errored = true;
            if (!fixture.errored) {
              console.error(err);
            }
          }

          expect(errored).to.equal(Boolean(fixture.errored));

          if (fixture.result) {
            expect(result).to.be.an("object");
            expect(result).to.deep.equal(fixture.result);
          }
          expect(createImageCallCount).to.equal(fixture.createImageCallCount);
        });
      });
    });
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  ["sceneCreated", "sceneCustom"].forEach((event) => {
    describe(event, () => {
      // eslint-disable-next-line mocha/no-setup-in-describe
      sceneFixtures.forEach((fixture, fixtureIndex) => {
        it(`${fixtureIndex} ${fixture.name}`, async () => {
          let errored = false;
          let result;

          try {
            result = await runPlugin({
              ...fixture.runContext,
              event,
            });
          } catch (err) {
            if (fixture.errorMessage) {
              expect(err.message.includes(fixture.errorMessage)).to.be.true;
            }
            errored = true;
            if (!fixture.errored) {
              console.error(err);
            }
          }

          expect(errored).to.equal(Boolean(fixture.errored));

          if (fixture.result) {
            expect(result).to.be.an("object");
            expect(result).to.deep.equal(fixture.result);
          }
        });
      });
    });
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  ["movieCreated"].forEach((event) => {
    describe(event, () => {
      // eslint-disable-next-line mocha/no-setup-in-describe
      movieFixtures.forEach((fixture, fixtureIndex) => {
        it(`${fixtureIndex} ${fixture.name}`, async () => {
          let errored = false;
          let result;

          try {
            result = await runPlugin({
              ...fixture.runContext,
              event,
            });
          } catch (err) {
            if (fixture.errorMessage) {
              expect(err.message.includes(fixture.errorMessage)).to.be.true;
            }
            errored = true;
            if (!fixture.errored) {
              console.error(err);
            }
          }

          expect(errored).to.equal(Boolean(fixture.errored));

          if (fixture.result) {
            expect(result).to.be.an("object");
            expect(result).to.deep.equal(fixture.result);
          }
        });
      });
    });
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  ["studioCreated", "studioCustom"].forEach((event) => {
    describe(event, () => {
      // eslint-disable-next-line mocha/no-setup-in-describe
      studioFixtures.forEach((fixture, fixtureIndex) => {
        it(`${fixtureIndex} ${fixture.name}`, async () => {
          let errored = false;
          let result;

          try {
            result = await runPlugin({
              ...fixture.runContext,
              event,
            });
          } catch (err) {
            if (fixture.errorMessage) {
              expect(err.message.includes(fixture.errorMessage)).to.be.true;
            }
            errored = true;
            if (!fixture.errored) {
              console.error(err);
            }
          }

          expect(errored).to.equal(Boolean(fixture.errored));

          if (fixture.result) {
            expect(result).to.be.an("object");
            expect(result).to.deep.equal(fixture.result);
          }
        });
      });
    });
  });
});
