import { ActorContext } from "../../types/actor";
import { SceneContext } from "../../types/scene";
import { StudioContext } from "../../types/studio";

interface MyContext {
  args: {
    whitelist?: string[];
    blacklist?: string[];
  };
}

const lower = (s: string): string => s.toLowerCase();

module.exports = ({ args, data }: (ActorContext | SceneContext | StudioContext) & MyContext) => {
  const whitelist = (args.whitelist || []).map(lower);
  const blacklist = (args.blacklist || []).map(lower);

  if (!data.labels) {
    return {};
  }

  if (!whitelist.length && !blacklist.length) {
    return {};
  }

  return {
    labels: data.labels.filter((label) => {
      const lowercased = lower(label);
      if (whitelist.length && !whitelist.includes(label)) {
        return false;
      }
      return blacklist.every((blacklisted) => blacklisted !== lowercased);
    }),
  };
};
