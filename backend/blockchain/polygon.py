from __future__ import annotations

import json
import logging
import time
from typing import Any

from config import (
    DEPLOYED_CONTRACT_PATH,
    POLYGON_CONTRACT_ADDRESS,
    POLYGON_PRIVATE_KEY,
    POLYGON_REQUEST_TIMEOUT_SECONDS,
    POLYGON_RPC_URL,
)
from logging_config import get_logger, log_event

logger = get_logger("sentinelai.blockchain")


def _load_contract_metadata() -> tuple[str | None, list[dict[str, Any]] | None]:
    if not DEPLOYED_CONTRACT_PATH.exists():
        return None, None
    try:
        data = json.loads(DEPLOYED_CONTRACT_PATH.read_text(encoding="utf-8"))
        address = POLYGON_CONTRACT_ADDRESS or data.get("contractAddress")
        abi = data.get("abi")
        return address, abi
    except Exception:
        log_event(logger, logging.ERROR, "FAILED_TO_LOAD_DEPLOYED_CONTRACT_METADATA", exc_info=True)
        return None, None


def anchor_latest_hash(chain_hash: str) -> dict[str, Any]:
    """Anchor an audit hash on the Polygon Amoy testnet.

    If RPC, private key, or contract address is absent, falls back cleanly to
    `pending_configuration` so offline verification continues uninterrupted.
    """
    contract_address, abi = _load_contract_metadata()

    if not POLYGON_PRIVATE_KEY or not contract_address or not abi:
        log_event(
            logger,
            logging.INFO,
            "POLYGON_ANCHOR_SKIPPED",
            data={
                "reason": "Missing wallet private key or contract address",
                "chain_hash": chain_hash,
            },
        )
        return {
            "status": "pending_configuration",
            "chain_hash": chain_hash,
            "network": "Polygon Amoy testnet",
            "transaction_hash": None,
        }

    try:
        from web3 import Web3

        w3 = Web3(
            Web3.HTTPProvider(
                POLYGON_RPC_URL,
                request_kwargs={"timeout": POLYGON_REQUEST_TIMEOUT_SECONDS},
            )
        )
        if not w3.is_connected():
            log_event(
                logger,
                logging.WARNING,
                "POLYGON_RPC_UNREACHABLE",
                data={"rpc_url": POLYGON_RPC_URL},
            )
            return {
                "status": "anchor_failed",
                "chain_hash": chain_hash,
                "network": "Polygon Amoy testnet",
                "transaction_hash": None,
                "error": "RPC node unreachable",
            }

        account = w3.eth.account.from_key(POLYGON_PRIVATE_KEY)
        checksum_address = Web3.to_checksum_address(contract_address)
        contract = w3.eth.contract(address=checksum_address, abi=abi)

        hash_bytes = bytes.fromhex(chain_hash.removeprefix("0x"))
        current_timestamp = int(time.time())

        tx = contract.functions.storeAuditHash(
            hash_bytes,
            current_timestamp,
        ).build_transaction(
            {
                "from": account.address,
                "nonce": w3.eth.get_transaction_count(account.address),
                "gas": 120000,
                "gasPrice": w3.eth.gas_price,
            }
        )

        signed_tx = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_hex = tx_hash.hex()
        if not tx_hex.startswith("0x"):
            tx_hex = f"0x{tx_hex}"

        log_event(
            logger,
            logging.INFO,
            "POLYGON_HASH_ANCHORED",
            data={
                "chain_hash": chain_hash,
                "tx_hash": tx_hex,
                "network": "Polygon Amoy testnet",
            },
        )
        return {
            "status": "anchored",
            "chain_hash": chain_hash,
            "transaction_hash": tx_hex,
            "network": "Polygon Amoy testnet",
            "explorer_url": f"https://amoy.polygonscan.com/tx/{tx_hex}",
        }
    except Exception as error:
        log_event(
            logger,
            logging.ERROR,
            "POLYGON_ANCHOR_ERROR",
            data={"chain_hash": chain_hash, "error": str(error)},
            exc_info=True,
        )
        return {
            "status": "anchor_failed",
            "chain_hash": chain_hash,
            "network": "Polygon Amoy testnet",
            "transaction_hash": None,
            "error": str(error),
        }
