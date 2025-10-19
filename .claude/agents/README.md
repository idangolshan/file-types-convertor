# Code Review Subagent

This directory contains custom subagents for Claude Code. These specialized agents help with specific development tasks.

## Available Agents

### code-reviewer

**Purpose**: Comprehensive code review focusing on performance optimization, efficiency, and best practices.

**What it analyzes**:
- Performance bottlenecks and optimization opportunities
- Time and space complexity (Big O analysis)
- Memory leaks and resource management
- Security vulnerabilities
- Best practices and code smells
- TypeScript type safety
- Framework-specific patterns (Svelte 5, SvelteKit, Tailwind v4)

**When to use**:
- After implementing new features
- Before committing major changes
- When optimizing performance
- When refactoring code
- For general code quality checks

## How to Use

### Method 1: Explicit Request (Recommended for Testing)

Simply mention the agent in your request:

```
"Use the code-reviewer subagent to analyze src/lib/converters/imageConverter.ts"
```

```
"Have the code-reviewer check my recent changes for performance issues"
```

```
"Code-reviewer: review the entire src/lib/components/ directory"
```

### Method 2: Automatic Invocation

The agent is configured to activate automatically when you:
- Ask for code reviews
- Request optimization analysis
- Ask about code efficiency
- Request best practices review

Examples that trigger automatically:
```
"Review my code for performance issues"
"Optimize the image conversion logic"
"Check for best practices violations"
"Analyze code efficiency"
```

### Method 3: Agent Management

View all agents and their status:
```
/agents
```

## Review Output Format

The code-reviewer provides structured feedback:

1. **Executive Summary**
   - Files reviewed count
   - Issues found by severity
   - Overall assessment

2. **Categorized Issues**
   - Critical, High, Medium, Low priority
   - Exact file paths and line numbers
   - Problem description and impact
   - Specific code fixes with examples
   - Quantified benefits

3. **Positive Observations**
   - Good practices found in the code

4. **Recommendations Summary**
   - High-level improvement suggestions

## Project-Specific Knowledge

The code-reviewer is configured with knowledge of this project's tech stack:
- SvelteKit 2 with Svelte 5 (runes syntax)
- Tailwind CSS v4 (different from v3)
- TypeScript
- Canvas API for image processing
- Claude AI integration patterns

It will check for:
- Proper Svelte 5 runes usage
- Tailwind v4 compatibility issues
- Memory management for object URLs
- Canvas API best practices
- Async/await error handling

## Tips for Best Results

1. **Be specific** about what you want reviewed:
   ```
   "Review src/lib/converters/imageConverter.ts for memory leaks"
   ```

2. **Request scope** you need:
   ```
   "Quick review of just performance issues in +page.svelte"
   "Comprehensive security audit of the entire codebase"
   ```

3. **Ask for fixes** if needed:
   ```
   "Review and fix any issues you find in src/lib/components/"
   ```

## Examples

### Example 1: Single File Review
```
"Code-reviewer: analyze src/lib/utils/imageAnalyzer.ts"
```

### Example 2: Performance Focus
```
"Use code-reviewer to find performance bottlenecks in the image conversion flow"
```

### Example 3: Full Codebase Audit
```
"Run a comprehensive code review on all TypeScript files in src/lib/"
```

### Example 4: Pre-commit Check
```
"Before I commit, have code-reviewer check my changes for any issues"
```

## Agent Configuration

Location: `.claude/agents/code-reviewer.md`

**Tools available to agent**:
- Read (file reading)
- Glob (file pattern matching)
- Grep (code searching)
- Bash (running type checks, tests)
- Edit (applying fixes)

**Model**: claude-sonnet-4-5-20250929

To modify the agent's behavior, edit the configuration file directly.
