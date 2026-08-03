"""Port for resume document storage."""

from typing import Protocol


class StoragePort(Protocol):
    def download(self, object_path: str) -> bytes: ...
