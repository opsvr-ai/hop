# Contributing to hop

hop is built on [Hermes Agent](https://github.com/NousResearch/hermes-agent). Contributions are welcome — bug fixes, features, docs, and platform compatibility improvements.

## Development Setup

### Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Git** | With `--recurse-submodules` support |
| **Python 3.11+** | uv will install it if missing |
| **uv** | Fast Python package manager ([install](https://docs.astral.sh/uv/)) |
| **Node.js 20+** | For the web dashboard and browser tools |

### Clone and install

```bash
git clone --recurse-submodules https://github.com/opsvr-ai/hop.git
cd hop

# Backend
uv venv .venv --python 3.11
source .venv/bin/activate
uv pip install -e ".[all,dev]"

# Web frontend
cd web
npm install
npx prisma generate
```

### Run tests

```bash
# Backend
scripts/run_tests.sh

# Web frontend
cd web && npm run build
```

## Project Structure

```
hop/
├── run_agent.py              # AIAgent — core conversation loop
├── cli.py                    # Interactive TUI
├── gateway/                  # Messaging gateway + API server
│   ├── run.py                # GatewayRunner
│   └── platforms/            # Platform adapters (Telegram, Discord, API server, etc.)
├── hermes_state.py           # SQLite session DB with FTS5
├── tools/                    # 40+ tools (self-registering)
├── skills/                   # Bundled AI skills
├── web/                      # Next.js 16 web dashboard
│   ├── src/app/              # App Router pages
│   ├── src/components/       # UI components
│   └── prisma/               # Database schema
└── tests/                    # Test suite
```

## Code Style

- **Python:** PEP 8 with practical exceptions. Catch specific exceptions. Use `logger.warning()` / `logger.error()`.
- **TypeScript:** Follow Next.js and React conventions. Use the project's ESLint config.
- **Comments:** Only when explaining non-obvious intent, trade-offs, or API quirks.

## Pull Request Process

1. Run tests: `scripts/run_tests.sh`
2. Test manually: exercise the code path you changed
3. Check cross-platform impact (Linux, macOS, Windows, WSL2)
4. Keep PRs focused — one logical change per PR

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

Examples:
```
feat(gateway): add user/space isolation to API server
fix(web): correct invite link expiration check
docs: update README for hop project
```

## Adding a Tool

Tools self-register with the central registry:

```python
from tools.registry import registry

def my_tool(param1: str, **kwargs) -> str:
    result = do_work(param1)
    return json.dumps(result)

MY_TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "my_tool",
        "description": "What this tool does.",
        "parameters": {
            "type": "object",
            "properties": {
                "param1": {"type": "string", "description": "What param1 is"},
            },
            "required": ["param1"],
        },
    },
}

registry.register(
    name="my_tool",
    toolset="my_toolset",
    schema=MY_TOOL_SCHEMA,
    handler=lambda args, **kw: my_tool(**args, **kw),
)
```

Add the tool name to the appropriate list in `toolsets.py` so it's exposed to agents.

## Adding a Skill

Skills live in `skills/` organized by category:

```
skills/
├── research/
│   └── arxiv/
│       ├── SKILL.md
│       └── scripts/
└── productivity/
    └── my-skill/
        ├── SKILL.md
        └── scripts/
```

See existing skills for the SKILL.md format. Skills should be broadly useful — specialized skills belong in the Skills Hub.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
