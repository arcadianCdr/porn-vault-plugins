import { promises as $fsPromises } from "fs";
import { SceneContext, SceneOutput } from "../../types/scene";
import {
  getAndValidateFieldArgs,
  getTemplateFieldsResolvers,
  getTemplateFieldValue,
  getTemplateMatcher,
} from "./template";
import { toNormalizedSafeFilename } from "./utils";

// TODO: add custom fields support in templates
// TODO: add blacklist to exclude some file patterns from the rename operations
// TODO: nice to have: add support for undos (rename log journal that can be rolled back?)
// TODO: nice to have: add support for path rename (file move) - TBD

export interface IReplacementCharacter {
  original: string;
  replacement: string;
}

export interface MySceneContext extends SceneContext {
  args: {
    dry?: boolean;
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

  const fieldResolvers = getTemplateFieldsResolvers(ctx);
  const matches = template.matchAll(getTemplateMatcher());

  for (const match of matches) {
    // Finds the resolver for the matched field and retreive its field arguments
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

    if (fieldValue) {
      const groupOutput = `${match.groups?.prefix}${fieldValue}${match.groups?.suffix}`;
      result += groupOutput;
      $logger.debug(`Group output for field <${resolver.name}>: '${groupOutput}'`);
    } else {
      $logger.debug(`Got no value for field <${resolver.name}>: the whole group is skipped.`);
    }
  }

  if (result) {
    return toNormalizedSafeFilename(ctx, result);
  } else {
    $logger.warn(
      `Could not generate a new filename based on template: '${template}'. All the template fields were without value.`
    );
  }
}

enum ConflictAction {
  OVERWRITE = "overwrite",
  RENAME = "rename",
  SKIP = "skip",
}

module.exports = async (ctx: MySceneContext): Promise<SceneOutput> => {
  const { args, scenePath, $formatMessage, $fs, $logger, $path, $throw } = ctx;

  if (!["sceneCreated", "sceneCustom"].includes(ctx.event)) {
    $throw("Uh oh. You shouldn't use the plugin for this type of event");
  }

  $logger.verbose(`Starting fileorganizer for scene: '${scenePath}'`);

  // Check args and set defaults if needed
  if (!args.fileStructureTemplate || !getTemplateMatcher().test(args.fileStructureTemplate)) {
    $throw(`invalid teamplate: '${args.fileStructureTemplate}'. Please correct and retry.`);
  }
  args.dateFormat ??= args.dateFormat = "YYYY-MM-DD";
  // What looks like a colon is actually the mathematical "ratio" chacacter that is allowed in filenames.
  args.characterReplacement ??= [{ original: ":", replacement: "∶" }];
  args.multiValuesSeparator ??= ", ";
  args.nameConflictHandling ??= ConflictAction.RENAME;
  args.normalizeAccents ??= false;
  args.normalizeMultipleSpaces ??= true;
  if (!(<any>Object).values(ConflictAction).includes(args.nameConflictHandling)) {
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
    if (args.nameConflictHandling === ConflictAction.SKIP) return {};
    let counter: number = 1;
    while (args.nameConflictHandling === ConflictAction.RENAME && $fs.existsSync(newScenePath)) {
      newScenePath = $path.format({
        dir: parsed.dir,
        name: `${newFileName}(${counter++})`,
        ext: parsed.ext,
      });
    }
    // Nothing to do for ConflictAction.OVERWRITE as $fs.rename overwrites by default
  }

  // Performm the rename operation
  try {
    await $fsPromises.rename(scenePath, newScenePath);
  } catch (err) {
    $logger.error(`Could not rename "${scenePath}" to "${newScenePath}": ${$formatMessage(err)}`);
    return {};
  }

  $logger.info(`Renamed "${scenePath}" to "${newScenePath}"`);
  return { path: newScenePath };
};
