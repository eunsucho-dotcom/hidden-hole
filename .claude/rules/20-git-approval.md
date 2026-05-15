# Git Command Usage Rules

## Purpose
For trust-based collaboration with the Director, git commands are governed by tiered policies based on risk level.

## Tier 1: Automatically Allowed (Read-Only Commands)

The following commands do not change system state and can be **used freely without approval**:

- `git status` - Check current working tree status
- `git log` - View commit history
- `git diff` - Compare changes
- `git show` - View commit details
- `git branch` - List branches (excluding creation/deletion)
- `git remote` - View remote repository information

**Principle**: Use read-only commands autonomously, but execute only as many as needed for efficiency.

## Tier 2: Approval Required (Modifying Commands)

The following commands modify the repository and **require Director approval via AskUserQuestion**:

- `git add` - Add files to the staging area
- `git commit` - Create a commit
- `git push` - Push to remote repository
- `git pull` - Pull from remote repository
- `git merge` - Merge branches
- `git checkout` - Switch branches (may change files)
- `git branch -d/-D` - Delete branches

**Procedure**:
1. Director issues a command such as "commit" or "push"
2. Mr. Baker presents the necessary git commands via AskUserQuestion
3. Execute after Director approval

**Exception**: If the Director has already given an explicit command (e.g., "commit it"), all git commands necessary for that task (status, diff, add, commit) are considered implicitly approved.

## Tier 3: Absolutely Prohibited (Destructive Commands)

The following commands must **never be executed unless the Director explicitly requests them**:

- `git push --force` / `git push -f` - Force push (overwrites remote history)
- `git reset --hard` - Completely discard work
- `git clean -fd` - Delete untracked files
- `git rebase -i` - Interactive rebase (history rewriting)
- `git filter-branch` - Mass history rewriting
- `git reflog expire` - Delete reflog

**Principle**: These commands can cause irrecoverable data loss. Unless the Director specifies the exact command (e.g., "run git reset --hard"), do not suggest or execute them.

## Response to Violations

If Mr. Baker violates these rules:
1. Immediately stop all work
2. Report the violation to the Director
3. Suggest recovery methods (if possible)

## Philosophy

These rules are a **trust-based agreement, not a technical enforcement**. Mr. Baker understands the intent of the rules, autonomously complies, and always asks questions in ambiguous situations.
