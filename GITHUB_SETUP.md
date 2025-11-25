# 🚀 GitHub Setup Instructions

Follow these steps to push your PlateSpot project to GitHub and enable GitHub Pages:

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **+** icon in the top right and select **New repository**
3. Name it: `PlaneSpot`
4. Keep it **Public** (required for free GitHub Pages)
5. **DO NOT** initialize with README, .gitignore, or license
6. Click **Create repository**

## Step 2: Push Your Code

Once you create the repository, GitHub will show you commands. Use these in PowerShell:

```powershell
cd c:\Users\Philip\Documents\Projects\PlaneSpot

# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/PlaneSpot.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 3: Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/PlaneSpot`
2. Click **Settings** tab
3. Click **Pages** in the left sidebar
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**

GitHub will display your site URL: `https://YOUR_USERNAME.github.io/PlaneSpot/`

**Note**: It may take 1-2 minutes for your site to be published.

## Step 4: Update README

After your site is live, update the README.md with your actual GitHub username:

```powershell
# Edit the README.md file and replace:
# - philip.github.io/PlaneSpot with YOUR_USERNAME.github.io/PlaneSpot
# - YOUR_USERNAME with your actual GitHub username

# Then commit and push:
git add README.md
git commit -m "Update README with live site URL"
git push
```

## 🎉 Done!

Your PlateSpot flight tracker will be live at:
`https://YOUR_USERNAME.github.io/PlaneSpot/`

---

## Quick Commands Reference

```powershell
# Make changes and push updates
git add .
git commit -m "Your commit message"
git push

# Check status
git status

# View remote
git remote -v
```
