import { DarkSpacesTheme } from "../schemas/DarkSpacesTheme";
import { LightSpacesTheme } from "../schemas/LightSpacesTheme";

// const themeMap = {
//   light: LightSpacesTheme,
//   dark: DarkSpacesTheme,
// };

export const themeCreator = (theme) => {
  return LightSpacesTheme;
};
