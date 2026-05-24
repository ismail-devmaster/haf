import { css } from "lit";
import { extractVars } from "../../common/style/derived-css-vars";

/**
 * Semantic styles use core styles to define higher level variables like box shadows.
 * Here we define all styles except colors
 */
export const semanticStyles = css`
  html {
    --ha-box-shadow-s: 0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04);
    --ha-box-shadow-m: 0 4px 12px 0 rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
    --ha-box-shadow-l: 0 8px 24px 0 rgba(0, 0, 0, 0.08), 0 4px 8px -4px rgba(0, 0, 0, 0.04);
  }
`;

export const darkSemanticStyles = css`
  html {
    --ha-box-shadow-s: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.2);
    --ha-box-shadow-m: 0 4px 12px 0 rgba(0, 0, 0, 0.35), 0 2px 4px -2px rgba(0, 0, 0, 0.25);
    --ha-box-shadow-l: 0 8px 24px 0 rgba(0, 0, 0, 0.4), 0 4px 8px -4px rgba(0, 0, 0, 0.3);
  }
`;

export const darkSemanticVariables = extractVars(darkSemanticStyles);
