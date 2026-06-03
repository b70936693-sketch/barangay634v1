---
name: agent-customization
description: 'Create, update, and fix VS Code agent customization assets in this workspace, including instructions, prompts, skills, custom agents, hooks, and AGENTS.md entries.'
argument-hint: 'Describe the customization task, such as creating a workspace instruction, fixing applyTo patterns, or drafting a skill.'
user-invocable: true
---

# Agent Customization

## When to Use
- Add or update workspace-specific VS Code agent customization files
- Create or repair `.instructions.md`, `.prompt.md`, `.agent.md`, `SKILL.md`, `copilot-instructions.md`, or `AGENTS.md`
- Troubleshoot why a customization is not loading or is applied too broadly
- Choose the right primitive for a reusable workflow versus a single prompt

## Workflow

1. Determine scope
   - Workspace-specific: use `.github/skills/`, `.github/`, `.agents/`, `.claude/`
   - Personal: use `~/.copilot/`, `~/.agents/`, or `~/.claude/`

2. Choose the right customization primitive
   - `copilot-instructions.md` / `AGENTS.md`: Always-on workspace behavior
   - `*.instructions.md`: File-based guidance for matching paths
   - `*.prompt.md`: Single focused input-driven task
   - `SKILL.md`: Multi-step reusable workflows with bundled resources
   - `*.agent.md`: Custom agents or subagents with tool restrictions
   - Hooks: deterministic lifecycle scripts or enforcement tasks

3. Create the file in the correct location
   - Skills: `.github/skills/<name>/SKILL.md`
   - Prompts: `.github/prompts/<name>.prompt.md`
   - Instructions: `.github/instructions/<name>.instructions.md`
   - Agents: `.github/agents/<name>.agent.md`
   - Workspace instructions: `AGENTS.md` or `copilot-instructions.md`

4. Write valid frontmatter
   - `name`: lowercase alphanumeric with hyphens, must match folder name when applicable
   - `description`: keyword-rich and trigger-friendly
   - Optional fields: `argument-hint`, `user-invocable`, `disable-model-invocation`

5. Add body content
   - Explain what the customization accomplishes
   - Describe when to use it
   - Provide step-by-step procedures and decision rules
   - Reference local assets with `./` relative paths when needed

6. Validate and test
   - Confirm file location and name are correct
   - Check YAML frontmatter syntax and quoting
   - Verify that descriptions include search-friendly trigger words
   - If a skill, ensure `name` matches its folder

## Decision Guide

- Need a reusable editor workflow? Use `SKILL.md`
- Need a one-off or parameterized command? Use `*.prompt.md`
- Need persistent guidance across project files? Use instructions
- Need a strict, deterministic action before/after a tool or command? Use hooks

## Example Prompts
- `/agent-customization Create a new skill to onboard contributors to this repo`
- `/agent-customization Fix a `.instructions.md` applyTo pattern for API routes`
- `/agent-customization Draft a workspace prompt for generating TypeScript route handlers`

## Notes
- Keep skills and prompts concise and discoverable
- Avoid overly broad `applyTo: "**"` unless it truly applies everywhere
- Prefer workspace-level customizations in `.github/` for team sharing
- Use `user-invocable: true` for slash-command visibility and `disable-model-invocation: false` for auto-loading
