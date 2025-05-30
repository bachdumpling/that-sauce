import { type SchemaTypeDefinition } from "sanity";
import { authPage } from "./authPage";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [authPage],
};
