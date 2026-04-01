from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    port: int = 8003
    database_url: str = "postgresql://postgres:password@localhost:5432/receipt_db"
    receipt_upload_dir: str = "uploads"
    finance_service_url: str = "http://localhost:8002"
    frontend_url: str = "http://localhost:3000"
    receipt_default_user_id: str = ""
    receipt_worker_poll_seconds: float = 2.0
    receipt_job_stale_seconds: int = 900
    receipt_ocr_device: str = "auto"
    receipt_ocr_allow_cpu_fallback: bool = True
    receipt_ocr_enable_hpi: bool = False
    receipt_ocr_precision: str = "fp32"
    receipt_ocr_enable_mkldnn: bool = False
    receipt_ocr_cpu_threads: int = 2

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
