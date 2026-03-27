"""Entry point for the Task Manager CLI."""

from manager import TaskManager
from utils import format_task_table, parse_priority, parse_status


def print_menu() -> None:
    """Display the main menu."""
    print("\n=== Task Manager ===")
    print("1. Add task")
    print("2. List tasks")
    print("3. Update task")
    print("4. Change task status")
    print("5. Delete task")
    print("6. Summary")
    print("0. Exit")


def prompt(label: str, required: bool = True) -> str:
    """Prompt the user for input, enforcing non-empty when *required*."""
    while True:
        value = input(f"{label}: ").strip()
        if value or not required:
            return value
        print("  This field is required. Please try again.")


def run(manager: TaskManager) -> None:
    """Main interactive loop."""
    print("Welcome to Task Manager!")

    while True:
        print_menu()
        choice = prompt("Choice")

        if choice == "1":
            _handle_add(manager)
        elif choice == "2":
            _handle_list(manager)
        elif choice == "3":
            _handle_update(manager)
        elif choice == "4":
            _handle_set_status(manager)
        elif choice == "5":
            _handle_delete(manager)
        elif choice == "6":
            _handle_summary(manager)
        elif choice == "0":
            print("Goodbye!")
            break
        else:
            print("  Invalid option. Please enter a number from the menu.")


# ---------------------------------------------------------------------------
# Handlers
# ---------------------------------------------------------------------------


def _handle_add(manager: TaskManager) -> None:
    title = prompt("Title")
    description = prompt("Description")
    priority_str = prompt("Priority (low/medium/high) [medium]", required=False) or "medium"
    due_date = prompt("Due date (YYYY-MM-DD) [optional]", required=False) or None

    try:
        priority = parse_priority(priority_str)
        task = manager.add_task(title, description, priority=priority, due_date=due_date)
        print(f"  Task added: {task}")
    except ValueError as exc:
        print(f"  Error: {exc}")


def _handle_list(manager: TaskManager) -> None:
    status_str = prompt("Filter by status (pending/in_progress/done) [all]", required=False)
    priority_str = prompt("Filter by priority (low/medium/high) [all]", required=False)

    try:
        status = parse_status(status_str) if status_str else None
        priority = parse_priority(priority_str) if priority_str else None
        tasks = manager.list_tasks(status=status, priority=priority)
        print("\n" + format_task_table(tasks))
    except ValueError as exc:
        print(f"  Error: {exc}")


def _handle_update(manager: TaskManager) -> None:
    try:
        task_id = int(prompt("Task ID"))
        title = prompt("New title [leave blank to keep]", required=False) or None
        description = prompt("New description [leave blank to keep]", required=False) or None
        priority_str = prompt(
            "New priority (low/medium/high) [leave blank to keep]", required=False
        )
        due_date = (
            prompt("New due date (YYYY-MM-DD) [leave blank to keep]", required=False) or None
        )

        priority = parse_priority(priority_str) if priority_str else None
        task = manager.update_task(
            task_id,
            title=title,
            description=description,
            priority=priority,
            due_date=due_date,
        )
        print(f"  Task updated: {task}")
    except (KeyError, ValueError) as exc:
        print(f"  Error: {exc}")


def _handle_set_status(manager: TaskManager) -> None:
    try:
        task_id = int(prompt("Task ID"))
        status_str = prompt("New status (pending/in_progress/done)")
        status = parse_status(status_str)
        task = manager.set_status(task_id, status)
        print(f"  Status updated: {task}")
    except (KeyError, ValueError) as exc:
        print(f"  Error: {exc}")


def _handle_delete(manager: TaskManager) -> None:
    try:
        task_id = int(prompt("Task ID"))
        manager.delete_task(task_id)
        print(f"  Task {task_id} deleted.")
    except (KeyError, ValueError) as exc:
        print(f"  Error: {exc}")


def _handle_summary(manager: TaskManager) -> None:
    stats = manager.summary()
    print(
        f"\n  Total: {stats['total']} | "
        f"Pending: {stats['pending']} | "
        f"In-progress: {stats['in_progress']} | "
        f"Done: {stats['done']}"
    )


if __name__ == "__main__":
    run(TaskManager())
