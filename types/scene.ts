import { Actor } from "./actor";
import { Label } from "./label";
import { Movie } from "./movie";
import { Context, CustomFieldsOutput } from "./plugin";
import { Studio } from "./studio";
import { SceneView } from "./watch";

export interface IDimensions {
  width: number;
  height: number;
}

export interface SceneMeta {
  size: number | null;
  duration: number | null;
  dimensions: IDimensions | null;
  fps: number | null;
}

export interface Scene {
  _id: string;
  hash: string | null;
  name: string;
  description: string | null;
  addedOn: Date;
  releaseDate: number | null;
  thumbnail: string | null;
  preview: string | null;
  favorite: boolean;
  bookmark: number | null;
  rating: number;
  customFields: Record<string, boolean | string | number | string[] | null>;
  path: string | null;
  streamLinks: string[];
  watches?: number[]; // backwards compatibility, array of timestamps of watches
  meta: SceneMeta;
  studio: string | null;
  processed?: boolean;
}
export interface FullSceneOutput extends CustomFieldsOutput {
  name: string;
  path: string;
  description: string;
  releaseDate: number;
  addedOn: number;
  views: number[];
  watches: number[];
  rating: number;
  favorite: boolean;
  bookmark: number;
  thumbnail: string;
  actors: string[];
  labels: string[];
  studio: string;
  movie: string;
}

export type SceneOutput = Partial<FullSceneOutput>;

export interface SceneContext extends Context<SceneOutput> {
  scene: Scene;
  sceneName: string;
  scenePath: string;
  // Server functions to lazy load extra scene data
  $getActors: () => Promise<Actor[]>;
  $getLabels: () => Promise<Label[]>;
  $getWatches: () => Promise<SceneView[]>;
  $getStudio: () => Promise<Studio>;
  $getMovies: () => Promise<Movie[]>;
}
