# Level Builder Documentation

## Overview

The Level Builder is a tool for creating custom tutorial levels that teach Git concepts. It provides a step-by-step wizard to configure all aspects of a level, from metadata to tutorial steps, with built-in validation and testing.

## Accessing the Level Builder

- **From Sandbox**: Click the "Create Level" button in the sandbox toolbar. This will open the Level Builder with the current sandbox state as the initial state.
- **Direct Access**: Navigate to `/build-level` to start creating a new level from scratch or import an existing one.

## Level Builder Wizard

The Level Builder uses a 6-step wizard to guide you through creating a complete tutorial level:

### 1. Metadata

Configure basic level information:

- **Level Name**: A descriptive name for your level (e.g., "Introduction to Branching")
- **Level ID**: A unique identifier (auto-generated from the name, can be edited)
  - Must use only lowercase letters, numbers, hyphens, and underscores
  - Example: `intro-branching`
- **Description**: Brief description of what users will learn
- **Difficulty**: Choose from intro, beginner, intermediate, or advanced
- **Order**: Position in a sequence (for organizing multiple levels)

**Best Practices:**
- Use clear, descriptive names that indicate what concept is being taught
- Keep descriptions concise but informative
- Choose appropriate difficulty based on prerequisites

### 2. Initial State

Define the starting Git state for the level:

**Options:**
- **Start with Blank State**: Creates a simple initial state with one commit
- **Import from Sandbox**: Load a saved sandbox state from a JSON file
- **Paste JSON**: Manually paste a GitStateSnapshot JSON structure

**State Structure:**
```json
{
  "commits": [{"id": "C0", "parents": [], "message": "Initial commit", "timestamp": 1700000000000}],
  "branches": [{"name": "main", "target": "C0"}],
  "tags": [],
  "head": {"type": "branch", "name": "main"}
}
```

**Best Practices:**
- Keep initial states simple - only include what's necessary for the lesson
- Ensure the initial state is stable and represents a valid Git repository
- Use meaningful commit messages even in the initial state

### 3. Goal State

Define the target state that users should achieve:

**Options:**
- **Copy from Initial State**: Start with the initial state and modify it
- **Import from File**: Load a saved state from JSON
- **Paste JSON**: Manually paste the goal state

**Best Practices:**
- Make the goal state clearly different from the initial state
- Ensure the goal can be achieved through Git commands
- Consider what you want users to practice (creating commits, branches, merges, etc.)

### 4. Solution Commands

Define the optimal solution to achieve the goal state:

- Add one command per line (e.g., `git commit`, `git branch feature`)
- Use the "Test Solution" button to verify commands work
- Commands are executed in sequence from the initial state

**Validation:**
- Shows whether each command succeeded or failed
- Compares the final state with the goal state
- Reports any differences (missing commits, incorrect branches, etc.)

**Best Practices:**
- Provide the most straightforward solution
- Use commands that demonstrate the concept you're teaching
- Test your solution thoroughly before sharing
- Keep solutions concise (3-5 commands is ideal)

### 5. Tutorial Steps & Hints

Create guidance for users:

**Tutorial Steps:**

Three types of steps are supported:

1. **Dialog**: Instructional text shown to users
   - Use for explaining concepts
   - Support Markdown formatting
   - Keep paragraphs short and focused

2. **Demonstration**: Show a command in action
   - Specify setup commands (if needed)
   - Define the command to demonstrate
   - Provide before and after text

3. **Challenge**: Ask users to complete a task
   - Provide clear instructions
   - Can include per-step hints

**Hints:**
- Add progressive hints that guide users when stuck
- Start with general guidance, become more specific
- Avoid giving away the exact solution immediately

**Best Practices:**
- Start with a dialog step explaining the concept
- Use demonstrations to show examples before challenges
- End with a challenge step where users practice
- Provide at least 2-3 hints
- Write hints that teach problem-solving, not just answers

### 6. Validation & Export

Review and test your complete level:

**Validation Checks:**
- All required fields are present
- IDs are valid (alphanumeric, hyphens, underscores only)
- States have proper structure
- Tutorial steps are correctly formatted
- Solution commands achieve the goal state

**Warnings (non-blocking):**
- Missing English translations
- No solution commands
- No hints provided

**Export Options:**
- **Download as JSON**: Save level to your local machine
- **Copy Share Link**: Generate a URL to share the level (for small levels)
- For large levels, share the JSON file instead

## Level Structure

A complete level JSON includes:

```json
{
  "id": "intro-branching",
  "name": {"en_US": "Introduction to Branching"},
  "description": {"en_US": "Learn how to create and manage branches"},
  "difficulty": "intro",
  "order": 1,
  "initialState": { /* GitStateSnapshot */ },
  "goalState": { /* GitStateSnapshot */ },
  "tutorialSteps": [
    {
      "type": "dialog",
      "id": "step1",
      "title": {"en_US": "What are branches?"},
      "content": {"en_US": ["Branches let you work on different features..."]}
    },
    {
      "type": "challenge",
      "id": "challenge",
      "instructions": {"en_US": ["Create a new branch called 'feature'"]},
      "hints": []
    }
  ],
  "solutionCommands": ["git branch feature"],
  "hints": [
    {"en_US": ["Try using the git branch command"]},
    {"en_US": ["The syntax is: git branch <branch-name>"]}
  ],
  "flags": {
    "compareOnlyMain": false,
    "allowAnySolution": false
  }
}
```

## Advanced Features

### Localization

Levels support multiple languages:
- Add translations for name, description, tutorial steps, and hints
- Use locale keys like `en_US`, `de_DE`, `es_ES`
- At minimum, provide English (`en_US`) translations

### Level Flags

Optional flags to customize level behavior:

- **compareOnlyMain**: Only compare the main branch, ignore others
- **allowAnySolution**: Accept any solution (for sandbox-style levels)
- **disableHints**: Don't show hints to users
- **timeLimit**: Optional time limit in seconds

## Sharing Levels

### Via JSON File

1. Export your level as JSON
2. Share the file via email, GitHub, or file sharing service
3. Recipients can import it using "Import Level" on the Level Builder page

### Via URL

1. Click "Copy Share Link" on the validation step
2. Share the generated URL
3. Recipients can open the URL to load the level directly

**Note**: URLs have size limits (~1500 characters). For complex levels with many commits or long tutorial text, use JSON file sharing instead.

## Testing Your Level

Before sharing, thoroughly test your level:

1. ✓ Run validation in Step 6
2. ✓ Verify solution commands achieve the goal state
3. ✓ Check that differences report shows zero issues
4. ✓ Review tutorial steps for clarity
5. ✓ Test hints are helpful but not too revealing
6. ✓ Try completing the level yourself to ensure it's solvable

## Tips for Creating Effective Levels

### Content Design

- **Focus on one concept**: Each level should teach a single Git concept
- **Build progressively**: Start with explanation, demonstrate, then challenge
- **Use realistic scenarios**: Make examples relatable to real Git workflows
- **Keep it simple**: Don't overcomplicate; clarity is key

### Tutorial Writing

- **Be concise**: Users want to learn, not read walls of text
- **Use active voice**: "Create a branch" not "A branch should be created"
- **Provide context**: Explain why a concept is useful
- **Show, then tell**: Demonstrate first, explain after

### Difficulty Balance

- **Intro**: Single concept, 1-2 commands, heavy guidance
- **Beginner**: 2-3 related concepts, 3-5 commands, moderate guidance
- **Intermediate**: Multiple concepts, 5-8 commands, light guidance
- **Advanced**: Complex scenarios, 8+ commands, minimal guidance

### Common Pitfalls to Avoid

- ❌ Too many commits in initial state
- ❌ Goal state unreachable from initial state
- ❌ Solution commands that fail
- ❌ Tutorial steps that don't match the commands needed
- ❌ Hints that give away the answer immediately
- ❌ Missing validation of the level before sharing

## Keyboard Accessibility

The Level Builder is fully keyboard accessible:

- **Tab/Shift+Tab**: Navigate between form fields and buttons
- **Enter**: Activate buttons
- **Arrow Keys**: Navigate step indicators
- **Escape**: Close dialogs

All interactive elements have visible focus indicators and proper ARIA labels.

## Troubleshooting

### "Level is too large to share via URL"

The level has too much content for URL encoding. Use "Download as JSON" instead and share the file.

### "Solution does not match goal state"

The solution commands don't produce the expected goal state. Common causes:
- Incorrect command syntax
- Commands in wrong order
- Missing commits or branches in goal state
- HEAD pointing to wrong branch/commit

Check the differences report to see what's mismatched.

### "Invalid JSON"

When importing, ensure:
- JSON is properly formatted
- No trailing commas
- All strings are quoted
- Structure matches the Level schema

## Contributing Levels

To contribute levels to the main repository:

1. Create and thoroughly test your level
2. Export as JSON
3. Place in `/levels/` directory with descriptive name
4. Add to appropriate sequence in `/levels/sequences/`
5. Submit a pull request with description of the level

## API Reference

For programmatic level creation, see:
- `src/lib/level-builder/validation.ts` - Validation functions
- `src/lib/level-builder/serialization.ts` - Import/export utilities
- `src/lib/level-builder/solution-runner.ts` - Solution testing
- `src/tutorial/types.ts` - Type definitions

## Related Documentation

- [Tutorial System](./TUTORIAL_SYSTEM.md) - How the tutorial engine works
- [Sandbox](./SANDBOX.md) - Using sandbox mode to test states
- [Commands](./COMMANDS.md) - Available Git commands
