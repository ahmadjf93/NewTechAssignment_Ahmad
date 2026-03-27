# NewTechAssignment_Ahmad

A command-line **Task Manager** built with Python to demonstrate clean code
quality, solid logic, and well-tested design.

## Features

- **Create** tasks with title, description, priority (`low` / `medium` / `high`) and an optional due date
- **List** tasks with optional filtering by status or priority
- **Update** any mutable field of an existing task
- **Change status** – move tasks through `pending → in_progress → done`
- **Delete** tasks
- **Summary** statistics (total, pending, in-progress, done)

## Project Structure

```
├── main.py              # CLI entry point
├── manager.py           # Business logic (CRUD + filtering)
├── models.py            # Data models (Task, Priority, Status)
├── utils.py             # Formatting and parsing helpers
├── tests/
│   ├── conftest.py      # pytest path setup
│   ├── test_models.py   # Tests for data models
│   ├── test_manager.py  # Tests for task manager logic
│   └── test_utils.py    # Tests for utility functions
├── requirements-dev.txt # Development dependencies
└── setup.cfg            # Linter configuration
```

## Getting Started

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run the interactive CLI
python main.py

# Run the test suite
pytest tests/ -v

# Check code style
flake8 models.py manager.py utils.py main.py tests/
```

## Code Quality Highlights

| Aspect | Detail |
|---|---|
| Type hints | All public functions and methods are fully annotated |
| Docstrings | Google-style docstrings on every public symbol |
| Validation | Input validated at model construction and update time |
| Error handling | Raises `ValueError` for bad data, `KeyError` for missing records |
| Tests | 47 unit tests covering happy paths and edge cases |
| Linting | Passes `flake8` with a maximum line length of 100 |
