// Fallback / sample blog posts.
// Once the CMS is connected to a GitHub repo (see admin/config.yml and SETUP.md),
// blog.html will try to load real posts from that repo first and only use this
// sample data if the repo isn't reachable yet (e.g. during local preview).
const SAMPLE_POSTS = [
  {
    slug: "selling-gold-in-greenville",
    title: "Selling Gold in Greenville: What To Expect",
    date: "2025-10-05",
    tag: "gold",
    readTime: "3 min",
    excerpt: "First time selling gold? Here's how our expert testing and transparent pricing make it easy.",
    body: "First time selling gold? Here's how our expert testing and transparent pricing make it easy.\n\nWhen you walk in, we start by testing the karat and weight of every piece using professional equipment. From there we price against real-time market rates, so the offer you see reflects what the market is doing that day — not a lowball guess.\n\nNo appointment is ever required, and most visits take less than fifteen minutes from walking in to walking out with cash."
  },
  {
    slug: "silver-coins-vs-bullion",
    title: "Silver Coins vs. Bullion: What We Look For",
    date: "2025-10-04",
    tag: "silver",
    readTime: "2 min",
    excerpt: "From American Eagles to bars and rounds — learn how we evaluate silver for the best offer.",
    body: "From American Eagles to bars and rounds, we evaluate silver a little differently than jewelry.\n\nWe check authenticity, purity, and condition on every coin or bar. Collectible coins may carry a premium above melt value depending on rarity and condition, while bullion rounds and bars are priced primarily on weight and purity.\n\nBring your coins or bullion by any time during business hours — no appointment needed."
  }
];

if (typeof module !== "undefined") { module.exports = SAMPLE_POSTS; }

// ---------------------------------------------------------------
// Shared logic for pulling real published posts from GitHub.
// Used by both the homepage teaser (main.js) and the blog page (blog.js).
// Once the CMS is connected (see SETUP.md), set GITHUB_REPO below
// (e.g. "yourusername/thegoldstore") and posts published from /admin
// will appear on the site automatically — no rebuild or redeploy step.
// ---------------------------------------------------------------
const GITHUB_REPO = "AudiEnginuity/thegoldstore-website";
const POSTS_PATH = "content/blog";

async function fetchPostsFromGitHub() {
  if (!GITHUB_REPO) return null;
  try {
    const listRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${POSTS_PATH}`);
    if (!listRes.ok) return null;
    const files = await listRes.json();
    const mdFiles = files.filter(f => f.name.endsWith('.md'));
    const posts = await Promise.all(mdFiles.map(async f => {
      const raw = await (await fetch(f.download_url)).text();
      return parseFrontmatter(raw, f.name.replace(/\.md$/, ''));
    }));
    return posts.filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (e) {
    return null;
  }
}

// Minimal frontmatter parser for:
// ---
// title: "..."
// date: 2026-01-01
// tag: gold
// excerpt: "..."
// image: /assets/uploads/photo.jpg
// ---
// body markdown...
function parseFrontmatter(raw, slug) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  const [, fm, body] = match;
  const data = { slug, body: body.trim() };
  fm.split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    val = val.replace(/^["']|["']$/g, '');
    data[key] = val;
  });
  data.readTime = data.readTime || Math.max(1, Math.round(body.split(/\s+/).length / 200)) + ' min';
  return data;
}

