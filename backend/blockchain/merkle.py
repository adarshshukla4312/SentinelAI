from __future__ import annotations

import hashlib
import json
from pathlib import Path
from threading import Lock
from typing import Any


_lock = Lock()
_GENESIS_HASH = "0" * 64


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


class AuditLedger:
    """A small append-only SHA-256 hash chain for offline audit continuity.

    The latest chain hash can be batched to Polygon by the separate anchoring adapter
    when connectivity is available.
    """

    def __init__(self, ledger_path: Path) -> None:
        self.ledger_path = ledger_path

    def _read(self) -> list[dict[str, Any]]:
        if not self.ledger_path.exists():
            return []
        return json.loads(self.ledger_path.read_text(encoding="utf-8"))

    def append(self, receipt: dict[str, Any]) -> dict[str, Any]:
        with _lock:
            records = self._read()
            previous_hash = records[-1]["chain_hash"] if records else _GENESIS_HASH
            receipt_hash = sha256_hex(canonical_json(receipt))
            chain_hash = sha256_hex(f"{previous_hash}:{receipt_hash}")
            record = {
                "sequence": len(records) + 1,
                "receipt_hash": receipt_hash,
                "previous_hash": previous_hash,
                "chain_hash": chain_hash,
            }
            records.append(record)
            temporary_path = self.ledger_path.with_suffix(".tmp")
            temporary_path.write_text(canonical_json(records), encoding="utf-8")
            temporary_path.replace(self.ledger_path)
            return record

    def verify(self) -> bool:
        with _lock:
            records = self._read()
        previous_hash = _GENESIS_HASH
        for record in records:
            if record["previous_hash"] != previous_hash:
                return False
            expected = sha256_hex(f"{previous_hash}:{record['receipt_hash']}")
            if record["chain_hash"] != expected:
                return False
            previous_hash = record["chain_hash"]
        return True
