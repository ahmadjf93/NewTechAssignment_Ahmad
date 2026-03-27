"""Utility helpers for the Task Manager application."""

from typing import List

from models import Priority, Status, Task


def format_task_table(tasks: List[Task]) -> str:
    """Return a formatted table string for a list of tasks.

    Args:
        tasks: List of :class:`Task` objects to display.

    Returns:
        A human-readable table string, or a message if the list is empty.
    """
    if not tasks:
        return "No tasks to display."

    header = f"{'ID':<5} {'Title':<30} {'Priority':<10} {'Status':<12} {'Due Date':<12}"
    separator = "-" * len(header)
    rows = [header, separator]

    for task in tasks:
        due = task.due_date or "-"
        rows.append(
            f"{task.task_id:<5} {task.title:<30} "
            f"{task.priority.value:<10} {task.status.value:<12} {due:<12}"
        )

    return "\n".join(rows)


def parse_priority(value: str) -> Priority:
    """Convert a string to a :class:`Priority` enum value.

    Args:
        value: Case-insensitive priority string (e.g. ``"HIGH"``).

    Returns:
        The matching :class:`Priority` member.

    Raises:
        ValueError: If *value* does not match any priority.
    """
    try:
        return Priority(value.lower())
    except ValueError:
        valid = [p.value for p in Priority]
        raise ValueError(f"Invalid priority '{value}'. Choose from: {valid}.")


def parse_status(value: str) -> Status:
    """Convert a string to a :class:`Status` enum value.

    Args:
        value: Case-insensitive status string (e.g. ``"DONE"``).

    Returns:
        The matching :class:`Status` member.

    Raises:
        ValueError: If *value* does not match any status.
    """
    try:
        return Status(value.lower())
    except ValueError:
        valid = [s.value for s in Status]
        raise ValueError(f"Invalid status '{value}'. Choose from: {valid}.")
