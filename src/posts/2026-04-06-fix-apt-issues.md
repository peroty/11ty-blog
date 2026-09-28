---
title: "Fixing APT issues"
date: 2026-04-06
description: "I finally got tired of looking at issues when I ran APT.."
layout: layouts/post.njk
---

# Fixing `apt update` warnings for Google Chrome and Typora on Ubuntu

## Problem 1: Google Chrome repository warning

I saw this warning during `apt update`:

```
N: Skipping acquire of configured file 'main/binary-i386/Packages' as repository 'https://dl.google.com/linux/chrome/deb stable InRelease' doesn't support architecture 'i386'
```

### What was happening

APT was trying to check the Google Chrome repository for `i386` packages, but Google Chrome only provides packages there for `amd64`.

### What I did

I checked which APT source file was being used for Chrome and found:

```
/etc/apt/sources.list.d/google-chrome.sources
```

I edited that file and added:

```
Architectures: amd64
```

### Result

That change told APT to only use the Chrome repository for the `amd64` architecture, which stopped the warning.

------

## Problem 2: Typora repository warning

I also saw this warning during `apt update`:

```
N: Missing Signed-By in the sources.list(5) entry for 'https://typora.io/linux'
```

### What was happening

Typora had two different repository entries present:

- a newer one using the modern keyring method
- an older active source file that did not include `Signed-By`

APT was still reading the older active Typora source, so the warning continued even after adding the new Typora key and repo entry.

### What I did

I first set up the newer Typora repository entry using a dedicated keyring:

- removed the old Typora key from `/etc/apt/trusted.gpg.d/typora.asc`
- created `/etc/apt/keyrings/typora.gpg`
- created a new repo file at `/etc/apt/sources.list.d/typora.list` using `signed-by=/etc/apt/keyrings/typora.gpg`

Then I removed the older active Typora source file:

```
/etc/apt/sources.list.d/archive_uri-https_typora_io_linux-noble.sources
```

After that, I cleaned up leftover backup files like `.save` and `.distUpgrade`.

### Result

Once the old active Typora source was removed, APT only used the newer signed repository entry, and the warning was resolved.

------

## Final actions taken

### Chrome

- Identified the active Chrome repo file
- Added `Architectures: amd64` to `/etc/apt/sources.list.d/google-chrome.sources`

### Typora

- Set up a proper keyring-based repo entry using `signed-by`
- Removed the old active Typora source file that was missing `Signed-By`
- Removed stale backup source files afterward

### Verification

I ran: `sudo apt update` to confirm the warnings were gone.

------

## Final takeaway

These were two separate APT source problems:

- **Chrome** needed to be restricted to the correct architecture
- **Typora** needed the old unsigned-style source removed so only the modern signed entry remained