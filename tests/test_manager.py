"""Unit tests for manager.py."""

import pytest

from manager import TaskManager
from models import Priority, Status


@pytest.fixture()
def manager():
    """Return a fresh TaskManager for each test."""
    return TaskManager()


# ---------------------------------------------------------------------------
# add_task
# ---------------------------------------------------------------------------


def test_add_task_returns_task_with_id(manager):
    task = manager.add_task("Buy groceries", "Milk, eggs, bread.")
    assert task.task_id == 1
    assert task.title == "Buy groceries"


def test_add_multiple_tasks_increments_id(manager):
    t1 = manager.add_task("Task A", "Description A.")
    t2 = manager.add_task("Task B", "Description B.")
    assert t2.task_id == t1.task_id + 1


def test_add_task_invalid_title_raises(manager):
    with pytest.raises(ValueError):
        manager.add_task("", "Some description.")


def test_add_task_invalid_due_date_raises(manager):
    with pytest.raises(ValueError):
        manager.add_task("T", "D", due_date="not-a-date")


# ---------------------------------------------------------------------------
# get_task
# ---------------------------------------------------------------------------


def test_get_existing_task(manager):
    added = manager.add_task("X", "Y.")
    fetched = manager.get_task(added.task_id)
    assert fetched is added


def test_get_nonexistent_task_raises(manager):
    with pytest.raises(KeyError):
        manager.get_task(999)


# ---------------------------------------------------------------------------
# list_tasks
# ---------------------------------------------------------------------------


def test_list_all_tasks(manager):
    manager.add_task("A", "Desc A.")
    manager.add_task("B", "Desc B.")
    assert len(manager.list_tasks()) == 2


def test_list_tasks_filter_status(manager):
    t1 = manager.add_task("A", "Desc A.")
    manager.add_task("B", "Desc B.")
    manager.set_status(t1.task_id, Status.DONE)

    done = manager.list_tasks(status=Status.DONE)
    pending = manager.list_tasks(status=Status.PENDING)
    assert len(done) == 1
    assert len(pending) == 1


def test_list_tasks_filter_priority(manager):
    manager.add_task("High", "H.", priority=Priority.HIGH)
    manager.add_task("Low", "L.", priority=Priority.LOW)

    highs = manager.list_tasks(priority=Priority.HIGH)
    assert len(highs) == 1
    assert highs[0].title == "High"


def test_list_tasks_combined_filters(manager):
    manager.add_task("H-pending", "D.", priority=Priority.HIGH)
    t2 = manager.add_task("H-done", "D.", priority=Priority.HIGH)
    manager.set_status(t2.task_id, Status.DONE)
    manager.add_task("L-pending", "D.", priority=Priority.LOW)

    result = manager.list_tasks(status=Status.PENDING, priority=Priority.HIGH)
    assert len(result) == 1
    assert result[0].title == "H-pending"


# ---------------------------------------------------------------------------
# update_task
# ---------------------------------------------------------------------------


def test_update_task_title(manager):
    task = manager.add_task("Old title", "D.")
    updated = manager.update_task(task.task_id, title="New title")
    assert updated.title == "New title"


def test_update_task_priority(manager):
    task = manager.add_task("T", "D.")
    manager.update_task(task.task_id, priority=Priority.HIGH)
    assert task.priority == Priority.HIGH


def test_update_task_empty_title_raises(manager):
    task = manager.add_task("T", "D.")
    with pytest.raises(ValueError):
        manager.update_task(task.task_id, title="")


def test_update_nonexistent_task_raises(manager):
    with pytest.raises(KeyError):
        manager.update_task(42, title="X")


# ---------------------------------------------------------------------------
# set_status
# ---------------------------------------------------------------------------


def test_set_status_in_progress(manager):
    task = manager.add_task("T", "D.")
    manager.set_status(task.task_id, Status.IN_PROGRESS)
    assert task.status == Status.IN_PROGRESS


def test_set_status_done(manager):
    task = manager.add_task("T", "D.")
    manager.set_status(task.task_id, Status.DONE)
    assert task.status == Status.DONE


def test_set_status_restart_done_raises(manager):
    task = manager.add_task("T", "D.")
    manager.set_status(task.task_id, Status.DONE)
    with pytest.raises(ValueError):
        manager.set_status(task.task_id, Status.IN_PROGRESS)


# ---------------------------------------------------------------------------
# delete_task
# ---------------------------------------------------------------------------


def test_delete_task(manager):
    task = manager.add_task("T", "D.")
    manager.delete_task(task.task_id)
    assert manager.list_tasks() == []


def test_delete_nonexistent_raises(manager):
    with pytest.raises(KeyError):
        manager.delete_task(99)


# ---------------------------------------------------------------------------
# summary
# ---------------------------------------------------------------------------


def test_summary_counts(manager):
    manager.add_task("A", "D.")
    t2 = manager.add_task("B", "D.")
    t3 = manager.add_task("C", "D.")
    manager.set_status(t2.task_id, Status.IN_PROGRESS)
    manager.set_status(t3.task_id, Status.DONE)

    stats = manager.summary()
    assert stats["total"] == 3
    assert stats["pending"] == 1
    assert stats["in_progress"] == 1
    assert stats["done"] == 1


def test_summary_empty(manager):
    stats = manager.summary()
    assert stats == {"total": 0, "pending": 0, "in_progress": 0, "done": 0}
