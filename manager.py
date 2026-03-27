"""Task manager – handles CRUD operations and filtering."""

from typing import List, Optional

from models import Priority, Status, Task


class TaskManager:
    """Manages a collection of tasks with full CRUD support."""

    def __init__(self) -> None:
        self._tasks: List[Task] = []
        self._next_id: int = 1

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    def add_task(
        self,
        title: str,
        description: str,
        priority: Priority = Priority.MEDIUM,
        due_date: Optional[str] = None,
    ) -> Task:
        """Create a new task and return it.

        Args:
            title: Short summary of the task (max 100 chars).
            description: Detailed description.
            priority: Priority level (default MEDIUM).
            due_date: Optional deadline in YYYY-MM-DD format.

        Returns:
            The newly created :class:`Task`.

        Raises:
            ValueError: If any argument fails validation.
        """
        task = Task(
            title=title,
            description=description,
            priority=priority,
            due_date=due_date,
        )
        task.task_id = self._next_id
        self._next_id += 1
        self._tasks.append(task)
        return task

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get_task(self, task_id: int) -> Task:
        """Return the task with the given *task_id*.

        Raises:
            KeyError: If no task with that id exists.
        """
        for task in self._tasks:
            if task.task_id == task_id:
                return task
        raise KeyError(f"Task with id={task_id} not found.")

    def list_tasks(
        self,
        status: Optional[Status] = None,
        priority: Optional[Priority] = None,
    ) -> List[Task]:
        """Return tasks optionally filtered by *status* and/or *priority*."""
        result = self._tasks
        if status is not None:
            result = [t for t in result if t.status == status]
        if priority is not None:
            result = [t for t in result if t.priority == priority]
        return list(result)

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    def update_task(
        self,
        task_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        priority: Optional[Priority] = None,
        due_date: Optional[str] = None,
    ) -> Task:
        """Update mutable fields of an existing task.

        Only the keyword arguments that are explicitly passed (non-None)
        are changed.

        Returns:
            The updated :class:`Task`.

        Raises:
            KeyError: If the task does not exist.
            ValueError: If any new value fails validation.
        """
        task = self.get_task(task_id)

        if title is not None:
            if not title.strip():
                raise ValueError("Task title cannot be empty.")
            if len(title) > 100:
                raise ValueError("Task title must not exceed 100 characters.")
            task.title = title

        if description is not None:
            if not description.strip():
                raise ValueError("Task description cannot be empty.")
            task.description = description

        if priority is not None:
            task.priority = priority

        if due_date is not None:
            Task._validate_due_date(due_date)
            task.due_date = due_date

        return task

    def set_status(self, task_id: int, status: Status) -> Task:
        """Change the status of a task.

        Returns:
            The updated :class:`Task`.

        Raises:
            KeyError: If the task does not exist.
            ValueError: If the status transition is invalid.
        """
        task = self.get_task(task_id)
        if status == Status.IN_PROGRESS:
            task.mark_in_progress()
        elif status == Status.DONE:
            task.mark_done()
        else:
            task.status = Status.PENDING
        return task

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    def delete_task(self, task_id: int) -> None:
        """Remove the task with *task_id*.

        Raises:
            KeyError: If the task does not exist.
        """
        task = self.get_task(task_id)
        self._tasks.remove(task)

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------

    def summary(self) -> dict:
        """Return a count breakdown by status."""
        return {
            "total": len(self._tasks),
            "pending": sum(1 for t in self._tasks if t.status == Status.PENDING),
            "in_progress": sum(1 for t in self._tasks if t.status == Status.IN_PROGRESS),
            "done": sum(1 for t in self._tasks if t.status == Status.DONE),
        }
