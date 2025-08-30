# GitHub Setup Instructions

To push changes to your GitHub repository, you'll need to set up authentication using a personal access token.

## Creating a Personal Access Token

1. Go to GitHub.com
2. Click on your profile picture and select "Settings"
3. Scroll down to "Developer settings" and click on it
4. Click on "Personal access tokens" and then "Tokens (classic)"
5. Click "Generate new token" and select "Generate new token (classic)"
6. Give it a name like "Termux Git Access"
7. Select the "repo" scope to allow full access to repositories
8. Click "Generate token"
9. Copy the token (you won't see it again)

## Setting up Git Authentication

Once you have your token, run the following command in Termux, replacing `<your-token>` with your actual token:

```bash
cd /data/data/com.termux/files/home/tvrmote
git remote set-url origin https://<your-token>@github.com/irfanabdulkarim/tvrmote.git
```

## Pushing Changes

After setting up authentication, you can push your changes:

```bash
cd /data/data/com.termux/files/home/tvrmote
git push origin main
```

This will push the GitHub Actions workflows and updated README to your repository.