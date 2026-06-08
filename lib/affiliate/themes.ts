// Color theme presets for /affiliate/community. The admin picks one from
// /admin/community → it gets saved in the community_settings table and the
// next render of the public feed page reads it back and applies the colors
// via inline styles. Names are stable; add more by appending to this map.
//
// Each theme is a complete palette covering: page background, primary text,
// muted/italic text, accent (links, dates, accents), card background, card
// border, post body text. That way new components can pull from one source
// without hardcoded colors leaking back in.

export type CommunityTheme = {
  label: string;
  background: string;
  text: string;
  muted: string;
  accent: string;
  card: string;
  border: string;
  reactionActive: string;
};

export const COMMUNITY_THEMES = {
  sand: {
    label: "Sand (default)",
    background: "#f5efe6",
    text: "#1a1816",
    muted: "#6b6258",
    accent: "#856a3f",
    card: "#ffffff",
    border: "#d9cdb8",
    reactionActive: "#856a3f",
  },
  sage: {
    label: "Sage",
    background: "#f4f7ee",
    text: "#1a1816",
    muted: "#5b6b52",
    accent: "#5b7351",
    card: "#ffffff",
    border: "#d3e0c5",
    reactionActive: "#5b7351",
  },
  rose: {
    label: "Rose",
    background: "#fdf3f3",
    text: "#2c1f1f",
    muted: "#7c5c5c",
    accent: "#a85959",
    card: "#ffffff",
    border: "#f1d6d6",
    reactionActive: "#a85959",
  },
  ink: {
    label: "Ink",
    background: "#1a1816",
    text: "#f5efe6",
    muted: "#9b8f7c",
    accent: "#c9a961",
    card: "#252320",
    border: "#3a342d",
    reactionActive: "#c9a961",
  },
} as const satisfies Record<string, CommunityTheme>;

export type CommunityThemeName = keyof typeof COMMUNITY_THEMES;

export function getThemeOrDefault(name: string | null | undefined): CommunityTheme {
  if (name && (name as CommunityThemeName) in COMMUNITY_THEMES) {
    return COMMUNITY_THEMES[name as CommunityThemeName];
  }
  return COMMUNITY_THEMES.sand;
}
