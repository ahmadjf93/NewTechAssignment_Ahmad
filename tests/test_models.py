"""Unit tests for models.py."""

import pytest

from models import Priority, Status, Task


# ---------------------------------------------------------------------------
# Task creation
# ---------------------------------------------------------------------------


def test_task_default_fields():
    task = Task(title="Write tests", description="Add unit tests for the project.")
    assert task.title == "Write tests"
    assert task.description == "Add unit tests for the project."
    assert task.priority == Priority.MEDIUM
    assert task.status == Status.PENDING
    assert task.due_date is None
    assert task.created_at  # non-empty


def test_task_custom_priority_and_due_date():
    task = Task(
        title="Deploy",
        description="Deploy to production.",
        priority=Priority.HIGH,
        due_date="2026-12-31",
    )
    assert task.priority == Priority.HIGH
    assert task.due_date == "2026-12-31"


def test_task_empty_title_raises():
    with pytest.raises(ValueError, match="title cannot be empty"):
        Task(title="", description="Some description.")


def test_task_whitespace_title_raises():
    with pytest.raises(ValueError, match="title cannot be empty"):
        Task(title="   ", description="Some description.")


def test_task_title_too_long_raises():
    with pytest.raises(ValueError, match="100 characters"):
        Task(title="x" * 101, description="Some description.")


def test_task_empty_description_raises():
    with pytest.raises(ValueError, match="description cannot be empty"):
        Task(title="Valid title", description="")


def test_task_invalid_due_date_raises():
    with pytest.raises(ValueError, match="YYYY-MM-DD"):
        Task(title="Deploy", description="Deploy.", due_date="31-12-2026")


# ---------------------------------------------------------------------------
# Status transitions
# ---------------------------------------------------------------------------


def test_mark_in_progress():
    task = Task(title="T", description="D")
    task.mark_in_progress()
    assert task.status == Status.IN_PROGRESS


def test_mark_done():
    task = Task(title="T", description="D")
    task.mark_done()
    assert task.status == Status.DONE


def test_mark_in_progress_on_done_raises():
    task = Task(title="T", description="D")
    task.mark_done()
    with pytest.raises(ValueError, match="completed"):
        task.mark_in_progress()


# ---------------------------------------------------------------------------
# Serialisation
# ---------------------------------------------------------------------------


def test_to_dict_keys():
    task = Task(title="T", description="D", due_date="2026-01-01")
    d = task.to_dict()
    assert set(d.keys()) == {
        "task_id",
        "title",
        "description",
        "priority",
        "status",
        "due_date",
        "created_at",
    }
    assert d["priority"] == "medium"
    assert d["status"] == "pending"


def test_str_representation():
    task = Task(title="Sample", description="D")
    task.task_id = 5
    assert "5" in str(task)
    assert "Sample" in str(task)
