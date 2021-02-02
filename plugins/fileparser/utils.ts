import { Context } from "../../types/plugin";
import { IFileParserConfigElem, MySceneContext } from "./types";

// Parses the input to find a date. The date separator can be ".", " ", "-", "_" or "/".
export const dateToTimestamp = (ctx: Context, textToParse: string): number | undefined => {
  const { $logger, $moment } = ctx;

  if (!textToParse || textToParse === "") return;

  // '_' replacement are needed for proper boundaries detection by the regex
  const dateStr = textToParse.replace(/_/g, "-");

  const yyyymmdd = /(\b(?:19|20)\d\d)[- \/\.](\b1[012]|0[1-9])[- \/\.](\b3[01]|[12]\d|0[1-9])/.exec(
    dateStr
  );
  const ddmmyyyy = /(\b3[01]|[12]\d|0[1-9])[- \/\.](\b1[012]|0[1-9])[- \/\.](\b(?:19|20)\d\d)/.exec(
    dateStr
  );
  const yymmdd = /(\b\d\d)[- \/\.](\b1[012]|0[1-9])[- \/\.](\b3[01]|[12]\d|0[1-9])/.exec(dateStr);
  const ddmmyy = /(\b3[01]|[12]\d|0[1-9])[- \/\.](\b1[012]|0[1-9])[- \/\.](\b\d\d)/.exec(dateStr);
  const yyyymm = /\b((?:19|20)\d\d)[- \/\.](\b1[012]|0[1-9])/.exec(dateStr);
  const mmyyyy = /(\b1[012]|0[1-9])[- \/\.](\b(?:19|20)\d\d)/.exec(dateStr);
  const yyyy = /(\b(?:19|20)\d\d)/.exec(dateStr);

  $logger.verbose(`Converting date ${JSON.stringify(dateStr)} to timestamp`);

  if (yyyymmdd && yyyymmdd.length) {
    const date = yyyymmdd[0].replace(/[- \/\.]/g, "-");

    $logger.verbose("\tSUCCESS: Found => yyyymmdd");

    return $moment(date, "YYYY-MM-DD").valueOf();
  }
  if (ddmmyyyy && ddmmyyyy.length) {
    const date = ddmmyyyy[0].replace(/[- \/\.]/g, "-");

    $logger.verbose("\tSUCCESS: Found => ddmmyyyy");

    return $moment(date, "DD-MM-YYYY").valueOf();
  }
  if (yymmdd && yymmdd.length) {
    const date = yymmdd[0].replace(/[- \/\.]/g, "-");

    $logger.verbose("\tSUCCESS: Found => yymmdd");

    return $moment(date, "YY-MM-DD").valueOf();
  }
  if (ddmmyy && ddmmyy.length) {
    const date = ddmmyy[0].replace(/[- \/\.]/g, "-");

    $logger.verbose("\tSUCCESS: Found => ddmmyy");

    return $moment(date, "DD-MM-YY").valueOf();
  }
  if (yyyymm && yyyymm.length) {
    const date = yyyymm[0].replace(/[- \/\.]/g, "-");

    $logger.verbose("\tSUCCESS: Found => yyyymm");

    return $moment(date, "YYYY-MM").valueOf();
  }
  if (mmyyyy && mmyyyy.length) {
    const date = mmyyyy[0].replace(/[- \/\.]/g, "-");

    $logger.verbose("\tSUCCESS: Found => mmyyyy");

    return $moment(date, "MM-YYYY").valueOf();
  }
  if (yyyy && yyyy.length) {
    const date = yyyy[0];

    $logger.verbose("\tSUCCESS: Found => yyyy");

    return $moment(date, "YYYY").valueOf();
  }

  $logger.verbose("\tFAILED: Could not find a date");
  return;
};

export function matchElement(
  ctx: MySceneContext,
  matcher: IFileParserConfigElem
): string[] | undefined {
  const { $logger, $path, sceneName, scenePath} = ctx;

  if (!matcher) return;

  let selectedGroups: string;
  let matchedResult: string[] = [];

  let toMatch = matcher.scopeDirname ? $path.dirname(scenePath) : sceneName;
  const regex = new RegExp(matcher.regex, matcher.regexFlags || "gm");
  const matchesIterable = toMatch.matchAll(regex);

  if (!matchesIterable) {
    $logger.info(`No matches in ${toMatch} with regex /${regex}/`);
    return;
  }

  const matches = Array.from(matchesIterable);

  matches.forEach((match, i) => {
    if (matcher.matchesToUse && !matcher.matchesToUse?.includes(i)) {
      $logger.verbose(`Skipping match not to be used: [${i}] ${JSON.stringify(match)}`);
      return;
    }

    if (matcher.groupsToUse) {
      selectedGroups = "";

      $logger.verbose(
        `Extracting requested group(s) ${matcher.groupsToUse} from match: ${JSON.stringify(match)}`
      );
      match.forEach((val, j) => {
        if (matcher.groupsToUse?.includes(j)) {
          selectedGroups += match[j];
        }
      });

      addResults(matchedResult, selectedGroups, matcher.splitter);
    } else {
      $logger.verbose(`Usng the full match: '${match[0]}'`);
      addResults(matchedResult, match[0], matcher.splitter);
    }
  });

  $logger.verbose(`Final matched result: "${JSON.stringify(matchedResult)}"`);
  return matchedResult;
}

function addResults(array: string[], text: string, splitter: string | undefined) {
  if (splitter) {
    const splitted = text.split(splitter).map((s) => s.trim());
    array.push(...splitted);
  } else {
    array.push(text.trim());
  }
}
