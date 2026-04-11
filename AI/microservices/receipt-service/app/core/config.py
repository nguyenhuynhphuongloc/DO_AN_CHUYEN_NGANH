from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    port: int = 8003
    database_url: str = "postgresql://postgres:password@localhost:5432/receipt_db"
    receipt_upload_dir: str = "uploads"
    finance_service_url: str = "http://localhost:8002"
    frontend_url: str = "http://localhost:3000"
    jwt_access_secret: str = "dev-access-secret"
    worker_poll_interval_seconds: float = 2.0
    worker_batch_size: int = 1
    ocr_device: str = "auto"
    ocr_cpu_threads: int = 2
    ocr_language: str = "en"
    ocr_enable_mkldnn: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
