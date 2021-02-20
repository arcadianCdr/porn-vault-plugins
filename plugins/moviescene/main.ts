import { SceneContext, SceneOutput } from "../../types/scene";

import sceneHandler from "./scene";

module.exports = async (
  ctx: SceneContext & { args: { dry?: boolean } }
): Promise<SceneOutput | undefined> => {
  if ((ctx as SceneContext).sceneName) {
    return sceneHandler(ctx as SceneContext & { args: any });
  }
  ctx.$throw("Uh oh. You shouldn't use the plugin for this type of event");
};
