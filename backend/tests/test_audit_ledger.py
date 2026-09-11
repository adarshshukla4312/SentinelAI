import tempfile
import unittest
from pathlib import Path

from blockchain.merkle import AuditLedger


class AuditLedgerTests(unittest.TestCase):
    def test_links_and_verifies_records(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger = AuditLedger(Path(directory) / "audit.json")
            first = ledger.append({"screening_id": "one", "decision": "CLEAR"})
            second = ledger.append({"screening_id": "two", "decision": "REVIEW"})
            self.assertEqual(second["previous_hash"], first["chain_hash"])
            self.assertTrue(ledger.verify())


if __name__ == "__main__":
    unittest.main()
