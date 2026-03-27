"""Data models for the Task Manager application."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class Priority(Enum):
    """Task priority levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Status(Enum):
    """Task completion status."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DONE = "done"


@dataclass
class Task:
    """Represents a single task."""

    title: str
    description: str
    priority: Priority = Priority.MEDIUM
    status: Status = Status.PENDING
    due_date: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))
    task_id: int = field(default=0, init=False)

    def __post_init__(self) -> None:
        """Validate task fields after initialisation."""
        if not self.title or not self.title.strip():
            raise ValueError("Task title cannot be empty.")
        if len(self.title) > 100:
            raise ValueError("Task title must not exceed 100 characters.")
        if not self.description or not self.description.strip():
            raise ValueError("Task description cannot be empty.")
        if self.due_date is not None:
            self._validate_due_date(self.due_date)

    @staticmethod
    def _validate_due_date(date_str: str) -> None:
        """Ensure due_date follows YYYY-MM-DD format."""
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"due_date '{date_str}' must follow the format YYYY-MM-DD.")

    def mark_in_progress(self) -> None:
        """Transition task to IN_PROGRESS status."""
        if self.status == Status.DONE:
            raise ValueError("Cannot restart a completed task.")
        self.status = Status.IN_PROGRESS

    def mark_done(self) -> None:
        """Transition task to DONE status."""
        self.status = Status.DONE

    def to_dict(self) -> dict:
        """Return a plain-dict representation of the task."""
        return {
            "task_id": self.task_id,
            "title": self.title,
            "description": self.description,
            "priority": self.priority.value,
            "status": self.status.value,
            "due_date": self.due_date,
            "created_at": self.created_at,
        }

    def __str__(self) -> str:
        due = f", due: {self.due_date}" if self.due_date else ""
        return (
            f"[{self.task_id}] {self.title} | "
            f"priority={self.priority.value} | "
            f"status={self.status.value}{due}"
        )
