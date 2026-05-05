class ReceiptIntelligenceError(RuntimeError):
    """Base error for receipt intelligence failures."""


class ReceiptConfigurationError(ReceiptIntelligenceError):
    """Raised when runtime configuration is missing or invalid."""


class ReceiptParserError(ReceiptIntelligenceError):
    """Raised when Veryfi parsing fails."""


class ReceiptNotReceiptError(ReceiptIntelligenceError):
    """Raised when OCR output does not look like a receipt."""


class ReceiptAuthenticationError(ReceiptParserError):
    """Raised when Veryfi credentials are rejected."""


class ReceiptCategoryResolutionError(ReceiptIntelligenceError):
    """Raised when Groq category resolution fails."""
