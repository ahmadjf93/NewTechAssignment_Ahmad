"""Unit tests for utils.py."""

import pytest

from models import Priority, Status, Task
from utils import format_task_table, parse_priority, parse_status


# ---------------------------------------------------------------------------
# format_task_table
# ---------------------------------------------------------------------------


def test_format_empty_list():
    assert format_task_table([]) == "No tasks to display."


def test_format_table_contains_task_data():
    task = Task(title="Write docs", description="D.")
    task.task_id = 1
    output = format_task_table([task])
    assert "Write docs" in output
    assert "medium" in output
    assert "pending" in output


def test_format_table_multiple_tasks():
    tasks = []
    for i in range(3):
        t = Task(title=f"Task {i}", description="D.")
        t.task_id = i + 1
        tasks.append(t)
    output = format_task_table(tasks)
    for i in range(3):
        assert f"Task {i}" in output


# ---------------------------------------------------------------------------
# parse_priority
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("value,expected", [
    ("low", Priority.LOW),
    ("medium", Priority.MEDIUM),
    ("high", Priority.HIGH),
    ("LOW", Priority.LOW),
    ("HIGH", Priority.HIGH),
])
def test_parse_priority_valid(value, expected):
    assert parse_priority(value) == expected


def test_parse_priority_invalid():
    with pytest.raises(ValueError, match="Invalid priority"):
        parse_priority("critical")


# ---------------------------------------------------------------------------
# parse_status
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("value,expected", [
    ("pending", Status.PENDING),
    ("in_progress", Status.IN_PROGRESS),
    ("done", Status.DONE),
    ("DONE", Status.DONE),
])
def test_parse_status_valid(value, expected):
    assert parse_status(value) == expected


def test_parse_status_invalid():
    with pytest.raises(ValueError, match="Invalid status"):
        parse_status("cancelled")
