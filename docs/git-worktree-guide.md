# Git Worktree Management Guide

This guide explains how to use git worktrees for the Powerback project.

## Overview

Git worktrees allow you to have multiple working directories for the same repository, each checked out to different branches. This is useful for:

- Working on multiple features simultaneously
- Testing different branches without switching
- Parallel development workflows
- Isolated testing environments

## Quick Start

### List Worktrees
```bash
git worktree list
```

### Create a New Worktree
```bash
git worktree add ../worktrees/feature-name feature/feature-name
```

### Remove a Worktree
```bash
git worktree remove ../worktrees/feature-name
```

### Clean Up Orphaned Worktrees
```bash
git worktree prune
```

## Detailed Usage

### Creating Worktrees

Create worktrees manually using git commands:

```bash
# Create a worktree for a new feature
git worktree add ../worktrees/feature-auth feature/user-authentication

# Create a worktree for a hotfix
git worktree add ../worktrees/hotfix-security hotfix/security-patch

# Create a worktree for an experiment
git worktree add ../worktrees/experiment-ui experiment/new-ui
```

### Working with Worktrees

Once created, you can work in the worktree directory:

```bash
# Navigate to the worktree
cd ../worktrees/feature-auth

# Work normally - make changes, commit, etc.
git add .
git commit -m "Add user authentication feature"
git push origin feature/user-authentication

# Switch back to main directory
cd ../..
```

### Removing Worktrees

When you're done with a worktree:

```bash
# Remove the worktree
git worktree remove ../worktrees/feature-auth

# Or remove manually
git worktree remove worktrees/feature-auth
```

### Cleaning Up

The prune command removes worktrees whose branches no longer exist:

```bash
git worktree prune
```

## Advanced Usage

### Custom Base Directory

You can specify a custom base directory for worktrees:

```bash
# Create worktree in custom directory
git worktree add ../features/new-feature feature/new-feature

# Create worktree in experiments directory
git worktree add ../experiments/experiment-ui experiment/new-ui
```

### Force Operations

Use the `-f` flag to overwrite existing worktrees:

```bash
# Force create worktree (overwrites existing)
git worktree add -f ../worktrees/existing-feature feature/existing
```

### Direct Git Usage

You can use git worktree commands directly:

```bash
# List worktrees
git worktree list

# Create worktree
git worktree add ../worktrees/test-feature feature/test

# Remove worktree
git worktree remove ../worktrees/test-feature

# Clean up
git worktree prune
```

## Best Practices

### Naming Conventions

- **Feature branches**: `feature/description` → `feature-description`
- **Hotfix branches**: `hotfix/description` → `hotfix-description`
- **Experiment branches**: `experiment/description` → `experiment-description`

### Workflow Examples

#### Feature Development
```bash
# 1. Create worktree for new feature
git worktree add ../worktrees/payment-integration feature/payment-integration

# 2. Work in the worktree
cd ../worktrees/payment-integration
# Make changes, commit, push

# 3. When done, remove worktree
cd ../..
git worktree remove ../worktrees/payment-integration
```

#### Testing Different Branches
```bash
# 1. Create worktrees for different branches
git worktree add ../worktrees/feature-a feature/a
git worktree add ../worktrees/feature-b feature/b

# 2. Test both branches simultaneously
cd ../worktrees/feature-a
npm test
cd ../worktrees/feature-b
npm test

# 3. Clean up when done
cd ../..
git worktree remove ../worktrees/feature-a
git worktree remove ../worktrees/feature-b
```

#### Parallel Development
```bash
# 1. Create worktrees for different developers
git worktree add ../worktrees/frontend-dev feature/frontend
git worktree add ../worktrees/backend-dev feature/backend

# 2. Each developer works in their own worktree
# Developer 1: cd ../worktrees/frontend-dev
# Developer 2: cd ../worktrees/backend-dev

# 3. Merge when ready
git checkout main
git merge feature/frontend
git merge feature/backend
```

## Troubleshooting

### Common Issues

#### Worktree Already Exists
```bash
# Error: Worktree path already exists
# Solution: Use -f flag or choose different name
git worktree add -f ../worktrees/different-name feature/existing
```

#### Branch Already Exists
```bash
# Error: Branch already exists
# Solution: Use different branch name or create new branch
git worktree add ../worktrees/feature-name feature/new-name
```

#### Cannot Remove Worktree
```bash
# Error: Cannot remove worktree
# Solution: Check if worktree is currently checked out
git worktree list
# If worktree is checked out, switch to different directory first
```

### Manual Cleanup

If git worktree commands fail, you can manually clean up:

```bash
# List all worktrees
git worktree list

# Remove specific worktree
git worktree remove ../worktrees/feature-name

# Remove directory if git worktree remove fails
rm -rf ../worktrees/feature-name
```

## Integration with Environment Management

Worktrees work well with the simplified environment management:

```bash
# 1. Create worktree
git worktree add ../worktrees/new-feature feature/new-feature

# 2. Switch to worktree
cd ../worktrees/new-feature

# 3. Set up environment (copy .env file)
cp ../.env .

# 4. Work normally
npm run dev

# 5. When done, clean up
cd ../..
git worktree remove ../worktrees/new-feature
```

## File Structure

```
powerback-beta/
├── worktrees/                    # Default worktree directory
│   ├── feature-auth/            # Feature worktree
│   ├── hotfix-security/         # Hotfix worktree
│   └── experiment-ui/           # Experiment worktree
└── ...                          # Main project files
```

## Git Commands Reference

- `git worktree list` - List all worktrees
- `git worktree add <path> <branch>` - Create a new worktree
- `git worktree remove <path>` - Remove a worktree
- `git worktree prune` - Clean up orphaned worktrees

## Related Documentation

- [Development Guide](./development.md) - Development setup
- [NPM Scripts](./npm-scripts.md) - Available npm commands
- [Linting & Formatting](./linting-formatting.md) - Code style guidelines
