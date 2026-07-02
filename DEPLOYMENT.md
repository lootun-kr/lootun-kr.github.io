# LOOTUN GitHub Pages Deployment

## Confirmed Target

- Brand: LOOTUN / 루툰
- GitHub organization: `lootun-kr`
- GitHub repository: `lootun-kr.github.io`
- Repository URL: `https://github.com/lootun-kr/lootun-kr.github.io`
- Public GitHub Pages URL: `https://lootun-kr.github.io/`

## Local Project

- Workspace path: `/home/u01/.openclaw/workspace/lootun-catalog-site`
- Site type: static HTML/CSS/JavaScript
- Build step: none
- Pages source: repository root
- Primary branch: `main`

## Planned Deploy Key Setup

- SSH key path: `~/.ssh/lootun_kr_github_pages`
- SSH public key path: `~/.ssh/lootun_kr_github_pages.pub`
- SSH host alias: `github-lootun-pages`
- SSH remote URL:

```text
git@github-lootun-pages:lootun-kr/lootun-kr.github.io.git
```

## GitHub Deploy Key Registration

Register the public key in:

```text
https://github.com/lootun-kr/lootun-kr.github.io/settings/keys
```

Suggested title:

```text
LOOTUN catalog site deploy key
```

Required option:

```text
Allow write access: checked
```

## Step Status

- Step 1: repository connection plan confirmed
- Step 2: local Deploy Key, SSH config, Git remote prepared, and SSH authentication verified
- Step 3: static catalog site built
- Step 4: local preview server verified on port `8788`
- Step 5: commit and push
- Step 6: verify GitHub Pages
