from __future__ import annotations

from typing import Any


def anchor_latest_hash(chain_hash: str) -> dict[str, Any]:
    """Polygon adapter boundary.

    Deploying or calling a contract is deliberately disabled until a testnet RPC URL,
    contract address, and authorized wallet are supplied through environment config.
    This keeps offline screening fully usable and avoids claiming a local hash was
    placed on-chain when it was not.
    """
    return {
        "status": "pending_configuration",
        "chain_hash": chain_hash,
        "network": "Polygon testnet",
        "transaction_hash": None,
    }
