import { Context } from "../../types/plugin";
    
module.exports = async (ctx: Context /* adjust based on events */): Promise<any /* adjust based on output */> => {
  // TODO: implement
  ctx.$log("Hello world from iafd");
  return {};
};
  