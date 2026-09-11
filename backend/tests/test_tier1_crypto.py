import unittest

from pipeline.tier1_crypto import calculate_check_digit, validate_td3_mrz


VALID_TD3 = """P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<
L898902C36UTO7408122F1204159ZE184226B<<<<<10"""


class TD3ValidationTests(unittest.TestCase):
    def test_icao_example_validates(self) -> None:
        result = validate_td3_mrz(VALID_TD3)
        self.assertTrue(result.is_valid)
        self.assertTrue(all(result.checks.values()))
        self.assertEqual(result.document_number, "L898902C3")

    def test_tampered_dob_fails(self) -> None:
        tampered = VALID_TD3.replace("7408122", "7408132")
        result = validate_td3_mrz(tampered)
        self.assertFalse(result.is_valid)
        self.assertFalse(result.checks["date_of_birth"])

    def test_icao_weighting(self) -> None:
        self.assertEqual(calculate_check_digit("L898902C3"), "6")

    def test_verhoeff_valid_aadhaar(self) -> None:
        from pipeline.tier1_crypto import validate_verhoeff, run_aadhaar

        # Test valid Aadhaar numbers
        self.assertTrue(validate_verhoeff("501363738063"))
        self.assertTrue(validate_verhoeff("5013 6373 8063"))

        # Test invalid check digit
        self.assertFalse(validate_verhoeff("501363738064"))

        # Test run_aadhaar returns pass
        result = run_aadhaar("5013 6373 8063")
        self.assertEqual(result.status, "pass")
        self.assertEqual(result.score, 1.0)
        self.assertEqual(result.details["document_number"], "5013 6373 8063")
        self.assertTrue(result.details["checks"]["verhoeff_checksum"])

    def test_verhoeff_invalid_aadhaar(self) -> None:
        from pipeline.tier1_crypto import run_aadhaar

        result = run_aadhaar("5013 6373 8064")
        self.assertEqual(result.status, "fail")
        self.assertFalse(result.details["checks"]["verhoeff_checksum"])


if __name__ == "__main__":
    unittest.main()
