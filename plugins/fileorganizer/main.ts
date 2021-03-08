import { SceneContext, SceneOutput } from "../../types/scene";
import {
  getAndValidateFieldArgs,
  getTemplateFieldsResolvers,
  getTemplateFieldValue,
  getTemplateMatcher,
} from "./template";
import { toNormalizedSafeFilename } from "./utils";

// @todo: add custom fields support in templates
// @todo: add blacklist to exclude some file patterns from the rename operations
// @todo: nice to have: add support for undos (rename log journal that can be rolled back?)
// @todo: nice to have: add support for path rename (file move) - TBD

export interface IReplacementCharacter {
  original: string;
  replacement: string;
}

export interface MySceneContext extends SceneContext {
  args: {
    dry?: boolean;
    isMochaTesting?: boolean;
    fileStructureTemplate: string;
    dateFormat?: string;
    multiValuesSeparator?: string;
    nameConflictHandling?: string;
    normalizeAccents?: boolean;
    normalizeMultipleSpaces?: boolean;
    characterReplacement?: IReplacementCharacter[];
  };
}

async function filenameMaker(ctx: MySceneContext, template: string): Promise<string | undefined> {
  const { $logger } = ctx;
  let result: string = "";

  const matches = template.matchAll(getTemplateMatcher());

  for (const match of matches) {
    // Finds the resolver for the matched field and retreive its field arguments
    const fieldResolvers = getTemplateFieldsResolvers(ctx);
    const resolver = fieldResolvers.find(
      (item) => item.name.toLowerCase() === match.groups?.field?.toLowerCase()
    );
    const fieldArgs = getAndValidateFieldArgs(match.groups?.args);

    if (!resolver || !fieldArgs.isValid) {
      $logger.error(
        `Unsuported field ${match.groups?.field} (or its arguments) in template ${template}`
      );
      return;
    }

    const fieldValue: string | undefined = await getTemplateFieldValue(
      ctx,
      resolver,
      fieldArgs.index
    );

    if (fieldArgs.isMandatory && !fieldValue) {
      $logger.info(`Skipping rename (the mandatory field ${resolver.name} has no value)`);
      return;
    }

    if (fieldValue) result += `${match.groups?.prefix}${fieldValue}${match.groups?.suffix}`;
  }

  if (result) {
    return toNormalizedSafeFilename(ctx, result);
  } else {
    $logger.warn(
      `Could not generate a new filename based on template: '${template}'. The template structure is probably incorrect.`
    );
  }
}

module.exports = async (ctx: MySceneContext): Promise<SceneOutput> => {
  const { args, scenePath, $formatMessage, $fs, $logger, $path, $throw } = ctx;
  const CONFLICT_OVERWRITE = "overwrite";
  const CONFLICT_RENAME = "rename";
  const CONFLICT_SKIP = "skip";
  const CONFLICT_SUPPORTED = [CONFLICT_RENAME, CONFLICT_SKIP, CONFLICT_OVERWRITE];

  if (!scenePath) $throw("Uh oh. You shouldn't use the plugin for this type of event");

  $logger.verbose(`Starting fileorganizer to rename scene: ${scenePath}...`);

  // Check args and set defaults if needed
  if (args.dateFormat === undefined) args.dateFormat = "YYYY-MM-DD";
  if (args.characterReplacement === undefined) {
    args.characterReplacement = [{ original: ":", replacement: "∶" }];
  }
  if (args.multiValuesSeparator === undefined) args.multiValuesSeparator = ", ";
  if (args.nameConflictHandling === undefined) args.nameConflictHandling = CONFLICT_RENAME;
  if (args.normalizeAccents === undefined) args.normalizeAccents = false;
  if (args.normalizeMultipleSpaces === undefined) args.normalizeMultipleSpaces = true;
  if (!CONFLICT_SUPPORTED.includes(args.nameConflictHandling)) {
    $throw(
      `Unsupported 'nameConflictHandling' argument value: ${args.nameConflictHandling}. Please adapt your config and retry.`
    );
  }

  // Builds the new file name
  const newFileName: string | undefined = await filenameMaker(ctx, args.fileStructureTemplate);
  if (!newFileName) return {};
  if (newFileName.length > 255) {
    $logger.warn(
      `Skipping rename (the new filename is greater than 255 characters): "${newFileName}"`
    );
    return {};
  }

  // Builds the new file path
  const parsed = $path.parse(scenePath);
  let newScenePath = $path.format({ dir: parsed.dir, name: newFileName, ext: parsed.ext });

  if (newScenePath === scenePath) {
    $logger.verbose(
      `Skipping rename (the filename already match the desired template): "${scenePath}"`
    );
    return {};
  }

  if (args.dry) {
    $logger.info(`Dry mode. Would have renamed "${scenePath}" to "${newScenePath}"`);
    return {};
  }

  // Manage name conflicts
  if ($fs.existsSync(newScenePath)) {
    if (args.nameConflictHandling === CONFLICT_SKIP) return {};
    let counter: number = 1;
    while (args.nameConflictHandling === CONFLICT_RENAME && $fs.existsSync(newScenePath)) {
      newScenePath = $path.format({
        dir: parsed.dir,
        name: `${newFileName}(${counter++})`,
        ext: parsed.ext,
      });
    }
  }

  // Performm the rename operation
  try {
    if (!args.isMochaTesting) $fs.renameSync(scenePath, newScenePath);
  } catch (err) {
    $logger.error(`Could not rename "${scenePath}" to "${newScenePath}": ${$formatMessage(err)}`);
    return {};
  }

  $logger.info(`Renamed "${scenePath}" to "${newScenePath}"`);
  return { path: newScenePath };
};
