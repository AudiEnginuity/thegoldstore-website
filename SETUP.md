# Setup Guide — The Gold Store website

This site is plain HTML/CSS/JS, so it will run anywhere. The steps below get you:
1. Free hosting on Netlify
2. Your GoDaddy domain pointed at it (you keep the domain, just change where it "points")
3. A login dashboard at `yoursite.com/admin` for publishing blog posts yourself, for free
4. Live gold/silver/platinum prices in the ticker
5. Visitor analytics

Total cost: $0 beyond what you already pay GoDaddy for the domain name itself.

---

## 1. Put the code in a GitHub repository
Already done — repo is `AudiEnginuity/thegoldstore-website`.

## 2. Deploy on Netlify (free)
Already done — site is live and auto-deploys on every push.

## 3. Turn on the free CMS login (Netlify Identity + Git Gateway)
If you haven't done this part yet:
1. In your Netlify site, go to **Site configuration → Identity → Enable Identity**.
2. Under Identity settings, set registration to **Invite only** (so random people can't sign up).
3. Go to **Identity → Services → Git Gateway** and enable it. This is what lets the dashboard
   save your blog posts back to GitHub without you ever touching GitHub directly.
4. Under **Identity → Invite users**, invite your own email address (and anyone else you want to
   be able to post). Each person gets an email — they click it, set a password, and they're in.
   This is the entire access-control system: only people you've personally invited can log in
   to `/admin` at all.

## 4. Point your GoDaddy domain at Netlify
1. In Netlify, go to **Domain management → Add a domain** and enter thegoldstore.net.
2. Netlify will show you exact DNS records to add (usually one A record and one CNAME for `www`).
3. Log into GoDaddy → your domain → DNS management, and add the records Netlify showed you.
4. DNS changes can take anywhere from a few minutes to a few hours to fully take effect.

## 5. Publish a blog post (with a photo)
1. Visit `thegoldstore.net/admin` and log in.
2. Click **Blog Posts → New Blog Post**.
3. Fill in title, date, category, and summary.
4. Click into **Post Photo** and upload an image right from the dashboard — it gets committed
   into the site automatically. It'll show up as the thumbnail on the blog list and homepage,
   and as a hero image at the top of the post itself.
5. Write the body, then click **Publish**.
6. Refresh `/blog.html` — your new post (with photo) appears automatically. No redeploy needed.

---

## 6. Make the price ticker live (Metals.Dev — free, no credit card)
The ticker currently shows clearly-labeled **sample** prices until this step is done.

1. Go to **metals.dev** and create a free account. No credit card required.
2. On your Metals.Dev dashboard, copy your **API Key**.
3. In Netlify, go to **Site configuration → Environment variables → Add a variable**.
   - Key: `METALS_API_KEY`
   - Value: paste the key from Metals.Dev
4. Go to **Deploys → Trigger deploy → Deploy site** so the new variable takes effect.
5. That's it — `netlify/functions/spot-prices.js` (already in this project) securely fetches
   gold/silver/platinum prices using that key server-side, so the key itself never appears
   anywhere in the browser or your public code. The ticker will automatically switch from
   "Sample Spot" to "Live" once this is working.

Behind the scenes: Metals.Dev's free plan caps out at 100 requests/month, and each refresh needs
3 requests (one per metal). To guarantee we never get close to that limit no matter how much
traffic the site gets, prices are stored in Netlify's persistent storage (Blobs) with a
timestamp — the function only calls Metals.Dev again once that stored copy is more than 24 hours
old. Every visitor in between just gets the stored price, with zero calls to Metals.Dev. That
caps real usage at roughly 3 requests x 30 refreshes/month ≈ 90/month — under the limit with
real margin to spare, and prices still update daily.

## 7. Turn on Google Analytics
1. Go to **analytics.google.com** and create a free account + property for thegoldstore.net
   (choose "Web" as the platform).
2. Google will give you a **Measurement ID** that looks like `G-ABC123XYZ`.
3. Open `index.html` and `blog.html` in your repo — near the top of each, find the two spots
   that say `G-XXXXXXXXXX` and replace both with your real Measurement ID in each file.
4. Commit and push. Give it a few minutes, then check Google Analytics' "Realtime" report while
   you visit the site yourself to confirm it's tracking.

---

## Notes on what's already handled
- **Blog posts get their own real page automatically.** Every time you publish a post, a small
  script (`scripts/build-blog.js`) runs during deploy and generates a standalone page for it at
  `/blog/<slug>.html`, complete with its own title, meta description, social preview image, and
  structured data that helps Google and AI search engines (ChatGPT, Perplexity, Google AI
  Overviews) understand and cite the content properly. You never touch this script — it just runs.
- **robots.txt** and **sitemap.xml** are included and auto-updated on every deploy so search
  engines can find and index the site, including every individual blog post.
- **Mobile sizing** for the logo (header, footer, hero) has been tuned for phone-sized screens,
  separately from the larger desktop sizing.
- **Netlify's build command is no longer blank** — it now runs `node scripts/build-blog.js` to
  generate the blog pages above. If you ever see build settings mentioning this, that's expected
  and correct, not an error.

## Questions or something not working?
Bring the exact error message or a screenshot back to this conversation and I'll help you
troubleshoot the specific step.
