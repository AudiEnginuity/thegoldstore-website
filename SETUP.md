# Setup Guide — The Gold Store website

This site is plain HTML/CSS/JS, so it will run anywhere. The steps below get you:
1. Free hosting on Netlify
2. Your GoDaddy domain pointed at it (you keep the domain, just change where it "points")
3. A login dashboard at `yoursite.com/admin` for publishing blog posts yourself, for free

Total cost: $0 beyond what you already pay GoDaddy for the domain name itself.

---

## 1. Put the code in a GitHub repository
1. Create a free account at github.com if you don't have one.
2. Create a new repository (e.g. `thegoldstore-website`). Keep it **public** — it only contains
   website content, nothing private, and a public repo is what lets the blog page read posts directly.
3. Upload all the files from this project into that repository (GitHub's "Add file → Upload files"
   works fine for this, no command line required).

## 2. Deploy on Netlify (free)
1. Create a free account at netlify.com — you can sign up directly with your GitHub account.
2. Click **Add new site → Import an existing project**, choose GitHub, and select your repo.
3. Leave build settings blank (there's nothing to build) and click **Deploy**.
4. Netlify gives you a temporary address like `random-name-123.netlify.app` — that's your live site.

## 3. Turn on the free CMS login (Netlify Identity + Git Gateway)
1. In your new Netlify site, go to **Site configuration → Identity → Enable Identity**.
2. Under Identity settings, set registration to **Invite only** (so random people can't sign up).
3. Go to **Identity → Services → Git Gateway** and enable it. This is what lets the dashboard
   save your blog posts back to GitHub without you ever touching GitHub directly.
4. Under **Identity → Invite users**, invite your own email address. You'll get an email —
   click it, set a password, and you're in.

## 4. Point your GoDaddy domain at Netlify
1. In Netlify, go to **Domain management → Add a domain** and enter thegoldstore.net.
2. Netlify will show you exact DNS records to add (usually one A record and one CNAME for `www`).
3. Log into GoDaddy → your domain → DNS management, and add the records Netlify showed you.
   You do not need to move the domain itself — it can stay registered at GoDaddy.
4. DNS changes can take anywhere from a few minutes to a few hours to fully take effect.

## 5. Publish your first blog post
1. Visit `thegoldstore.net/admin` (or the temporary Netlify address + `/admin` before DNS is live).
2. Log in with the account you set up in step 3.
3. Click **Blog Posts → New Blog Post**, fill in the title, date, category, summary, and body,
   then click **Publish**.
4. Refresh `/blog.html` — your new post appears automatically. No redeploy needed.

## 6. One code update needed for the blog to read live posts
Open `assets/blog.js` and set:
```js
const GITHUB_REPO = "yourusername/thegoldstore-website"; // your actual repo name
```
This tells the blog page where to fetch published posts from. Until this is set, the blog page
shows the two sample posts included in this project.

---

## Optional: make the price ticker live
The ticker currently shows clearly-labeled **sample** prices. To show real spot prices:
1. Sign up for a free API key at a provider like goldapi.io (500 free requests/month).
2. Rather than calling that API directly from the browser (which would expose your key), add a
   small free Netlify Function that fetches the price server-side and caches it for a few hours —
   ask me and I can write that function for you once you have a key.
3. Update `TICKER_API_URL` in `assets/main.js` to point at that function.

---

## Questions or something not working?
Bring the exact error message or a screenshot back to this conversation and I'll help you
troubleshoot the specific step.
