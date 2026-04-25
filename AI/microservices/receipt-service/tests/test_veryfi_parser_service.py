from __future__ import annotations

from contextlib import ExitStack
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

try:
    from app.services import receipt_parser_service as parser_module
    from app.services.receipt_parser_service import (
        ReceiptParserAuthenticationError,
        ReceiptParserConfigurationError,
        ReceiptParserError,
        ReceiptParserService,
        VeryfiReceiptParser,
    )
except ModuleNotFoundError as exc:  # pragma: no cover - environment-dependent import
    parser_module = None  # type: ignore[assignment]
    ReceiptParserAuthenticationError = RuntimeError  # type: ignore[assignment]
    ReceiptParserConfigurationError = RuntimeError  # type: ignore[assignment]
    ReceiptParserError = RuntimeError  # type: ignore[assignment]
    ReceiptParserService = None  # type: ignore[assignment]
    VeryfiReceiptParser = None  # type: ignore[assignment]
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None


@unittest.skipIf(VeryfiReceiptParser is None, f"parser service dependencies unavailable: {_IMPORT_ERROR}")
class VeryfiParserServiceTests(unittest.TestCase):
    def _configured_runtime(self):
        return (
            patch.object(parser_module.settings, "veryfi_client_id", "client-id"),
            patch.object(parser_module.settings, "veryfi_client_secret", "client-secret"),
            patch.object(parser_module.settings, "veryfi_username", "user"),
            patch.object(parser_module.settings, "veryfi_api_key", "api-key"),
            patch.object(parser_module.settings, "veryfi_max_retries", 1),
            patch.object(parser_module, "VeryfiClient", object()),
        )

    def test_receipt_parser_service_rejects_unsupported_provider(self) -> None:
        with patch.object(parser_module.settings, "receipt_parser_provider", "unsupported"):
            with self.assertRaises(ReceiptParserConfigurationError):
                ReceiptParserService()

    def test_parse_document_retries_transient_provider_errors(self) -> None:
        parser = VeryfiReceiptParser()
        transient_error = type("FakeVeryfiClientError", (Exception,), {})
        mock_client = Mock()
        mock_client.process_document.side_effect = [
            transient_error("temporary"),
            {"id": 12, "document_type": "receipt", "ocr_text": "Store\nTOTAL 10.00"},
        ]

        with tempfile.TemporaryDirectory() as temp_dir:
            image_path = Path(temp_dir) / "receipt.jpg"
            image_path.write_bytes(b"fake-image")
            with ExitStack() as stack:
                for configured_patch in self._configured_runtime():
                    stack.enter_context(configured_patch)
                stack.enter_context(patch.object(parser_module, "BadRequest", type("FakeBadRequest", (Exception,), {})))
                stack.enter_context(
                    patch.object(parser_module, "ResourceNotFound", type("FakeResourceNotFound", (Exception,), {}))
                )
                stack.enter_context(
                    patch.object(parser_module, "UnauthorizedAccessToken", type("FakeAuthError", (Exception,), {}))
                )
                stack.enter_context(patch.object(parser_module, "VeryfiClientError", transient_error))
                stack.enter_context(patch.object(parser, "_get_client", return_value=mock_client))
                result = parser.parse_document(str(image_path))

        self.assertEqual(result.provider, "veryfi")
        self.assertEqual(result.raw_text, "Store\nTOTAL 10.00")
        self.assertEqual(mock_client.process_document.call_count, 2)

    def test_parse_document_maps_authentication_error(self) -> None:
        parser = VeryfiReceiptParser()
        auth_error = type("FakeUnauthorizedAccessToken", (Exception,), {})
        mock_client = Mock()
        mock_client.process_document.side_effect = auth_error("bad credentials")

        with tempfile.TemporaryDirectory() as temp_dir:
            image_path = Path(temp_dir) / "receipt.jpg"
            image_path.write_bytes(b"fake-image")
            with ExitStack() as stack:
                for configured_patch in self._configured_runtime():
                    stack.enter_context(configured_patch)
                stack.enter_context(patch.object(parser_module, "UnauthorizedAccessToken", auth_error))
                stack.enter_context(patch.object(parser, "_get_client", return_value=mock_client))
                with self.assertRaises(ReceiptParserAuthenticationError):
                    parser.parse_document(str(image_path))

    def test_parse_document_rejects_missing_image(self) -> None:
        parser = VeryfiReceiptParser()

        with self.assertRaises(ReceiptParserError):
            parser.parse_document("missing-file.jpg")


if __name__ == "__main__":
    unittest.main()
