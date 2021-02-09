import { ActorContext, ActorOutput } from "../../types/actor";
import { MovieContext, MovieOutput } from "../../types/movie";

import actorHandler from "./actor";
import movieHandler from "./movie";

module.exports = async (
  ctx: (MovieContext | ActorContext) & { args: { dry?: boolean } }
): Promise<ActorOutput | MovieOutput | undefined> => {
  if ((ctx as MovieContext).movieName) {
    return movieHandler(ctx as MovieContext & { args: any });
  }
  if ((ctx as ActorContext).actorName) {
    return actorHandler(ctx as ActorContext & { args: any });
  }
  ctx.$throw("Uh oh. You shouldn't use the plugin for this type of event");
};
