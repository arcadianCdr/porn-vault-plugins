import { Label } from "./label";
import { Context, CustomFieldsOutput } from "./plugin";

export interface Actor {
  _id: string;
  name: string;
  aliases: string[];
  addedOn: Date;
  bornOn: number | null;
  thumbnail: string | null;
  altThumbnail: string | null;
  hero?: string | null;
  avatar?: string | null;
  favorite: boolean;
  bookmark: number | null;
  rating: number;
  customFields: Record<string, boolean | string | number | string[] | null>;
  description?: string | null;
  nationality?: string | null;
}

export interface FullActorOutput extends CustomFieldsOutput {
  name: string;
  description: string;
  bornOn: number;
  addedOn: number;
  rating: number;
  favorite: boolean;
  bookmark: number;
  nationality: string;
  aliases: string[];
  labels: string[];
  thumbnail: string;
  altThumbnail: string;
  avatar: string;
  hero: string;
}

export type ActorOutput = Partial<FullActorOutput>;

export interface ActorContext extends Context<ActorOutput> {
  actor: Actor;
  actorName: string;
  // Server functions to lazy load extra actor data
  $getLabels: () => Promise<Label[]>;
  $getAverageRating: () => Promise<number>;
}
