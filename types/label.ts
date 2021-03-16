export interface Label {
  _id: string;
  name: string;
  aliases: string[];
  addedOn: Date;
  thumbnail: string | null;
  color?: string | null;
}
