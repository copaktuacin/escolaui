/**
 * applyTheme — applies a school's primaryColor to CSS custom properties
 * on document.documentElement so the entire UI reflects the active school's brand.
 */

/** Parse "#RRGGBB" or "#RGB" into [r, g, b] in [0, 255]. */
function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    const r = Number.parseInt(clean[0] + clean[0], 16);
    const g = Number.parseInt(clean[1] + clean[1], 16);
    const b = Number.parseInt(clean[2] + clean[2], 16);
    return [r, g, b];
  }
  if (clean.length === 6) {
    const r = Number.parseInt(clean.slice(0, 2), 16);
    const g = Number.parseInt(clean.slice(2, 4), 16);
    const b = Number.parseInt(clean.slice(4, 6), 16);
    return [r, g, b];
  }
  return null;
}

/** Convert [r, g, b] back to "#RRGGBB". */
function rgbToHex(r: number, g: number, b: number): string {
  const parts = [r, g, b]
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
  return `#${parts}`;
}

/**
 * Relative luminance per WCAG 2.1.
 * Returns a value in [0, 1] where 0 = black, 1 = white.
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Lighten or darken [r, g, b] by a factor (positive = lighter, negative = darker). */
function adjustBrightness(
  r: number,
  g: number,
  b: number,
  factor: number,
): [number, number, number] {
  return [r + factor, g + factor, b + factor];
}

/**
 * Apply a school's brand color to CSS custom properties.
 * Falls back gracefully if the color string is invalid.
 */
export function applyTheme(primaryColor: string | undefined): void {
  const fallback = "#0B5AAE";
  const color = primaryColor ?? fallback;
  const rgb = hexToRgb(color) ?? hexToRgb(fallback)!;
  const [r, g, b] = rgb;

  // --color-primary
  const primary = rgbToHex(r, g, b);

  // --color-primary-hover: ~10% darker (subtract ~25 from each channel)
  const hoverRgb = adjustBrightness(r, g, b, -25);
  const primaryHover = rgbToHex(...hoverRgb);

  // --color-primary-light: rgba with 0.15 opacity for backgrounds
  const primaryLight = `rgba(${r},${g},${b},0.15)`;

  // --color-primary-foreground: white for dark colors, dark for light ones
  const lum = relativeLuminance(r, g, b);
  const primaryForeground = lum > 0.35 ? "#111111" : "#ffffff";

  const root = document.documentElement;
  root.style.setProperty("--color-primary", primary);
  root.style.setProperty("--color-primary-hover", primaryHover);
  root.style.setProperty("--color-primary-light", primaryLight);
  root.style.setProperty("--color-primary-foreground", primaryForeground);
  root.style.setProperty("--school-accent", primary);
}
