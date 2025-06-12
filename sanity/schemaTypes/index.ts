import { type SchemaTypeDefinition } from "sanity";
import { authPage } from "./authPage";
import { navigation } from "./navigation";
import { footer } from "./footer";
import { landingPage } from "./landingPage";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [authPage, navigation, footer, landingPage],
};
