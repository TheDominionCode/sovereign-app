// Minimal allowlist HTML sanitizer for Daily Reset content. This text is
// authored by AI or by Nataly (the single admin) and later rendered with
// dangerouslySetInnerHTML in public/os.html — so it's trusted-author, not
// trusted-input, but we still strip anything outside a tiny formatting
// allowlist as cheap defense-in-depth (no script/style/attrs can ever land
// in the DB, regardless of what the model or a pasted edit produces).

const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "ul", "ol", "li", "p", "br"]);

export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return "";

  let out = input
    // Drop script/style blocks entirely, including their contents.
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    // Drop HTML comments.
    .replace(/<!--[\s\S]*?-->/g, "");

  // Strip every tag down to a bare allowlisted form (no attributes), or
  // remove it entirely (keeping inner text) if it's not on the allowlist.
  out = out.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, rawTag: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    const isClosing = match.startsWith("</");
    if (tag === "br") return "<br>";
    return isClosing ? `</${tag}>` : `<${tag}>`;
  });

  return out.trim();
}
