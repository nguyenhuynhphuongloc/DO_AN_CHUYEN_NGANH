from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    port: int = 8003
    database_url: str = "postgresql://postgres:password@localhost:5432/receipt_db"
    receipt_upload_dir: str = "uploads"
    receipt_temp_upload_dir: str = "uploads/tmp"
    finance_service_url: str = "http://localhost:8002"
    frontend_url: str = "http://localhost:3000"
    jwt_access_secret: str = "dev-access-secret"
    worker_poll_interval_seconds: float = 2.0
    worker_batch_size: int = 1
    receipt_session_first_enabled: bool = False
    receipt_session_expiry_hours: int = 24
    receipt_session_cleanup_grace_hours: int = 24
    receipt_session_cleanup_batch_size: int = 20
    receipt_session_retain_confirmed_image: bool = True
    ocr_device: str = "auto"
    ocr_cpu_threads: int = 2
    ocr_primary_language: str = "vi"
    ocr_fallback_language: str = "en"
    ocr_language: str = "vi"
    ocr_fallback_confidence_threshold: float = 0.7
    ocr_force_fallback_on_low_quality: bool = True
    ocr_enable_mkldnn: bool = False
    ocr_fast_confidence_threshold: float = 0.72
    ocr_fast_low_quality_threshold: float = 0.35
    ocr_fast_min_text_length: int = 24
    ocr_fast_detector_model: str = "PP-OCRv5_mobile_det"
    ocr_fast_recognition_model_vi: str = "latin_PP-OCRv5_mobile_rec"
    ocr_fast_recognition_model_en: str = "en_PP-OCRv5_mobile_rec"
    ocr_recovery_detector_model: str = "PP-OCRv5_server_det"
    ocr_recovery_recognition_model_vi: str = "latin_PP-OCRv5_mobile_rec"
    ocr_recovery_recognition_model_en: str = "en_PP-OCRv5_mobile_rec"
    ocr_fast_merchant_confidence_threshold: float = 0.58
    ocr_fast_max_fragmented_line_ratio: float = 0.45
    ocr_fast_max_short_header_ratio: float = 0.55
    ocr_fast_min_detected_lines: int = 6
    ocr_fast_max_corruption_signal_score: float = 1.15

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
