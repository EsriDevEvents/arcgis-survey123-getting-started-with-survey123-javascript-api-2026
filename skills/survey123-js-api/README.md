# Survey123 JS API Skill

Embed and interact with ArcGIS Survey123 forms in web applications using the Survey123 Web Form JavaScript API.

## What This Skill Does

This skill enables AI coding assistants to help you:

- Embed Survey123 surveys into web applications
- Implement OAuth authentication for private/org-shared surveys
- Handle form events and submissions programmatically
- Set and get question values dynamically
- Work with complex question types (repeats, geometry, attachments)
- Understand and modify survey definitions (form.json)

## Installation

> **Note on References:** This skill includes a `references/` folder with detailed documentation. Most AI assistants can follow links in SKILL.md to read reference files when needed. The installation methods below preserve this folder structure.
### Claude Code

```bash
# Add to your project's .claude/ directory
npx @anthropic-ai/claude-code skill add Beijing-R-D-Center/survey123-web/packages/survey123-js-api/skills/survey123-js-api

# Or manually copy the skill folder to:
# ~/.claude/skills/survey123-js-api/
```

### Cursor

1. Open Cursor Settings → Features → Rules for AI
2. Add the skill folder (including references) to your project:

```bash
# Copy entire skill folder with references
cp -r path/to/survey123-js-api .cursor/rules/survey123-js-api
```

Cursor will automatically read files in `.cursor/rules/` and can follow links to reference files.

### GitHub Copilot

GitHub Copilot supports custom instructions but has limited support for multi-file references. Options:

**Option 1: Single file (basic)**
```bash
# Copy main skill content to copilot instructions
cat path/to/survey123-js-api/SKILL.md >> .github/copilot-instructions.md
```

**Option 2: Include references (recommended)**
```bash
# Create a docs folder for Copilot to reference
mkdir -p .github/copilot-docs/survey123-js-api
cp -r path/to/survey123-js-api/* .github/copilot-docs/survey123-js-api/

# Add instruction to .github/copilot-instructions.md
echo "For Survey123 JS API tasks, refer to .github/copilot-docs/survey123-js-api/" >> .github/copilot-instructions.md
```

> **Note:** Copilot may not automatically read linked files. For best results, keep critical information in `copilot-instructions.md` directly.
### Windsurf

Add the skill folder to your project or global rules:

```bash
# Copy entire skill folder with references to your project
cp -r path/to/survey123-js-api .windsurfrules/survey123-js-api

# Or to global rules
cp -r path/to/survey123-js-api ~/.windsurf/rules/survey123-js-api
```

### Manual Installation

Copy the entire skill folder to your AI assistant's configuration directory:

```
survey123-js-api/
├── SKILL.md              # Main skill instructions
├── README.md             # This file
└── references/
    ├── api_reference.md  # API overview
    ├── api_methods.md    # Complete method reference
    ├── authentication.md # OAuth implementation guide
    ├── form_schema.md    # Survey definition schema
    └── examples.md       # Code examples
```

## Usage

Once installed, the skill is automatically available. Your AI assistant will use it when relevant tasks are detected.

### Example Prompts

**Basic Embedding:**
> "Embed a Survey123 form with item ID abc123 into my React app"