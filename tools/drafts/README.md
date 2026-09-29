# Posting from Drafts on iPhone

Two standalone Script actions are ready to install:

- **Publish Link**: paste `publish-link.js` into a Script step.
- **Publish Quote**: paste `publish-quote.js` into a Script step.

## Install

1. In Drafts, create an action named **Publish Link**, add a **Script** step, and paste the entire corresponding JavaScript file. Repeat for **Publish Quote**. Creating/editing actions requires [Drafts Pro](https://docs.getdrafts.com/actions/).
2. Set the actions' **After Success** behavior to **Do Nothing**, so your original writing stays in Drafts.
3. Create a [fine-grained GitHub personal access token](https://github.com/settings/personal-access-tokens/new). Select resource owner **peroty**, **Only select repositories → 11ty-blog**, and repository permission **Contents → Read and write**. Set an expiration date. No Actions or Workflows permission is needed. This token can modify repository content generally; GitHub does not restrict it to the blog's content folders.
4. Run an action. Fill in the entry, choose **Review**, and inspect the Markdown. Cancel keeps everything in Drafts. Choose **Publish** to send it.
5. On the first publication, enter the token into Drafts' credential prompt. Both actions share that saved credential. Never paste it into the script, a draft, or this repository. [Drafts Credentials](https://scripting.getdrafts.com/classes/Credential) stores it separately; Settings → Credentials → Forget lets you replace it.

## Link example

Write this in a draft, then run **Publish Link**:

```text
A local editor worth trying
https://example.com/article

Here is what I liked about it. Markdown works here.
```

The action suggests the first line as the title, finds a URL on its own line, and uses the following text as commentary. All fields are editable before review. Add comma-separated tags in the prompt.

For **Publish Quote**, write the quotation in the draft. The action asks for the author, optional source URL, and tags.

## What publication does

The action creates a Markdown file directly on `main` using the [GitHub Contents API](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents). GitHub Actions then builds and deploys Pages. The desktop computer can be off; no local server or internet-facing admin is required.

Each file uses the Drafts UUID for its filename, so retrying the same draft cannot create a second entry of that type. Existing entries are never overwritten. A successful publication adds `blog-published` to the original Drafts item. If the network fails after GitHub accepts the commit, check the repository/Actions before retrying; the existence check will prevent an overwrite.

These actions publish new links and quotes; they do not upload private drafts or images. To publish another entry, create a new Drafts item. To revise an existing entry, use the desktop editor.

After posting on the phone, run `git pull --ff-only` in your desktop checkout before editing/deploying. If Git reports local changes or a divergent branch, stop and reconcile those changes before trying again.

The scripts have been exercised with simulated Drafts prompts and HTTP responses. Installation and a real publication on an iPhone still need to be tried; no token is included and no test entry was sent to GitHub.
