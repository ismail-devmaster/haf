import { css } from "lit";
import { extractVars } from "../../../common/style/derived-css-vars";

/*
 * Core color tokens are the foundational color values used throughout the design system.
 * These tokens represent raw, brand-independent colors such as grayscale shades, base hues, and accent tones.
 * Core tokens shouldn't be tied to any specific UI purpose or role. Instead, they serve as building blocks from which semantic tokens are derived.
 * Changes to core tokens will cascade into semantic tokens that reference them, enabling flexible theming and consistent design language.
 * Please note that these core tokens are not intended to be used directly in components or styles.
 */
export const coreColorStyles = css`
  html {
    /* pure */
    --ha-color-black: #000000;
    --ha-color-white: #ffffff;

    /* primary */
    --ha-color-primary-05: #001533;
    --ha-color-primary-10: #042159;
    --ha-color-primary-20: #0842a0;
    --ha-color-primary-30: #0a4cba;
    --ha-color-primary-40: #0b57d0;
    --ha-color-primary-50: #1a73e8;
    --ha-color-primary-60: #4285f4;
    --ha-color-primary-70: #7baaf7;
    --ha-color-primary-80: #a8c7fa;
    --ha-color-primary-90: #d3e3fd;
    --ha-color-primary-95: #eaf1ff;

    /* neutral */
    --ha-color-neutral-05: #111314;
    --ha-color-neutral-10: #1f1f1f;
    --ha-color-neutral-20: #2e3132;
    --ha-color-neutral-30: #444746;
    --ha-color-neutral-40: #5e6061;
    --ha-color-neutral-50: #747775;
    --ha-color-neutral-60: #8e918f;
    --ha-color-neutral-70: #c4c7c5;
    --ha-color-neutral-80: #e1e2e4;
    --ha-color-neutral-90: #f2f3f3;
    --ha-color-neutral-95: #fafdfd;

    /* orange */
    --ha-color-orange-05: #280700;
    --ha-color-orange-10: #3b0f00;
    --ha-color-orange-20: #5e1c00;
    --ha-color-orange-30: #7e2900;
    --ha-color-orange-40: #9d3800;
    --ha-color-orange-50: #c94e00;
    --ha-color-orange-60: #f36d00;
    --ha-color-orange-70: #ff9342;
    --ha-color-orange-80: #ffbb89;
    --ha-color-orange-90: #ffe0c8;
    --ha-color-orange-95: #fff0e4;

    /* red */
    --ha-color-red-05: #310001;
    --ha-color-red-10: #410002;
    --ha-color-red-20: #680005;
    --ha-color-red-30: #93000a;
    --ha-color-red-40: #b3261e;
    --ha-color-red-50: #dc362e;
    --ha-color-red-60: #e46962;
    --ha-color-red-70: #ec928e;
    --ha-color-red-80: #f2b8b5;
    --ha-color-red-90: #f9dedc;
    --ha-color-red-95: #fceeee;

    /* green */
    --ha-color-green-05: #002107;
    --ha-color-green-10: #003912;
    --ha-color-green-20: #00521c;
    --ha-color-green-30: #006e28;
    --ha-color-green-40: #146c2e;
    --ha-color-green-50: #1e873b;
    --ha-color-green-60: #3ca253;
    --ha-color-green-70: #5dbb70;
    --ha-color-green-80: #81c995;
    --ha-color-green-90: #bde9c9;
    --ha-color-green-95: #def6e4;
  }
`;

export const coreColorVariables = extractVars(coreColorStyles);
