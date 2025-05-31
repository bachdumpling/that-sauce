import { type SchemaTypeDefinition } from "sanity";
import { authPage } from "./authPage";
import { navigation } from "./navigation";
import { footer } from "./footer";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [authPage, navigation, footer],
};
