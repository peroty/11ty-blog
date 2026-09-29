// Drafts Script action: Publish Quote
// Credentials are entered in Drafts, never in this script.
(function () {
  const kind = "quote";
  const repository = "peroty/11ty-blog";
  const branch = "main";
  const folder = kind === "link" ? "link-posts" : "quotes";
  const filename = draft.uuid.toLowerCase() + ".md";
  const api = "https://api.github.com/repos/" + repository + "/contents/src/" + folder + "/" + filename;
  const lines = draft.content.trim().split("\n");
  const urlIndex = lines.findIndex(line => /^https?:\/\/\S+$/.test(line.trim()));
  const p = Prompt.create();
  p.title = kind === "link" ? "Publish Link" : "Publish Quote";
  p.message = "Nothing leaves Drafts until you confirm Publish on the review screen.";
  if (kind === "link") {
    p.addTextField("title", "Title", urlIndex > 0 ? lines[0].replace(/^#+\s*/, "") : "");
    p.addTextField("url", "Link URL", urlIndex >= 0 ? lines[urlIndex].trim() : "", {autocorrect: false});
    p.addTextView("body", "Commentary (Markdown)", urlIndex >= 0 ? lines.slice(urlIndex + 1).join("\n").trim() : draft.content, {height: 240});
  } else {
    p.addTextView("body", "Quote (Markdown)", draft.content.trim(), {height: 240});
    p.addTextField("author", "Author", "");
    p.addTextField("url", "Source URL (optional)", "", {autocorrect: false});
  }
  p.addTextField("tags", "Tags (comma separated)", "");
  p.addButton("Review");
  if (!p.show()) { context.cancel(); return; }
  const fields = p.fieldValues;
  const body = fields.body.trim();
  const url = fields.url.trim();
  const title = kind === "link" ? fields.title.trim() : "";
  if (!body || (kind === "link" && (!title || !url)) || (url && !/^https?:\/\/[^\s]+$/i.test(url))) {
    context.fail("Add the required title, URL and body. URLs must start with https:// or http://.");
    return;
  }
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const date = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
  const quote = value => JSON.stringify(value);
  const metadata = [];
  if (kind === "link") metadata.push("title: " + quote(title));
  metadata.push("date: " + quote(date));
  metadata.push("layout: " + quote(kind === "link" ? "layouts/link.njk" : "layouts/quote.njk"));
  if (kind === "link") metadata.push("linkUrl: " + quote(url));
  else {
    if (fields.author.trim()) metadata.push("quoteAuthor: " + quote(fields.author.trim()));
    if (url) metadata.push("quoteSourceUrl: " + quote(url));
  }
  const tags = [...new Set(fields.tags.split(",").map(t => t.trim()).filter(Boolean))];
  if (tags.length) metadata.push("tags: " + JSON.stringify(tags));
  const markdown = "---\n" + metadata.join("\n") + "\n---\n\n" + body + "\n";
  const review = Prompt.create();
  review.title = "Review before publishing";
  review.message = "This will create a public entry in " + repository + ". GitHub Pages rebuilds automatically. Cancel to keep it private in Drafts.\n\n" + markdown;
  review.addButton("Publish");
  if (!review.show()) { context.cancel(); return; }
  const credential = Credential.create("peroty-blog-github", "Fine-grained GitHub token for peroty/11ty-blog. Contents: Read and write only.");
  credential.addPasswordField("token", "GitHub token");
  if (!credential.authorize()) { context.cancel(); return; }
  const headers = {
    Authorization: "Bearer " + credential.getValue("token"),
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  const http = HTTP.create();
  const existing = http.request({url: api, method: "GET", parameters: {ref: branch}, headers});
  if (existing.success) {
    context.fail("This draft has already been published as a " + kind + ". Edit it in the desktop editor. Duplicate publication was prevented.");
    return;
  }
  if (existing.statusCode !== 404) {
    context.fail("GitHub lookup failed (HTTP " + existing.statusCode + "). Check the token and network, then retry.");
    return;
  }
  const response = http.request({
    url: api, method: "PUT", encoding: "json", headers,
    data: {message: "Publish " + kind + " from Drafts", branch, content: Base64.encode(markdown)}
  });
  if (!response.success) {
    context.fail("GitHub publication failed (HTTP " + response.statusCode + "). Your draft is retained. Check Actions/token/network before retrying.");
    return;
  }
  draft.addTag("blog-published");
  draft.update();
  const done = Prompt.create();
  done.title = "Sent to GitHub";
  done.message = "The source is committed. Pages deployment is pending; check https://github.com/" + repository + "/actions. Your original writing remains in Drafts. Run git pull --ff-only on the desktop before editing or deploying there.";
  done.addButton("Done");
  done.show();
})();

