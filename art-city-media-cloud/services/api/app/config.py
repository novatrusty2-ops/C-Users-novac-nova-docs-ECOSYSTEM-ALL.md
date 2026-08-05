from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    jwt_secret: str = "dev-change-me-art-city-media-cloud"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 14

    database_url: str = "postgresql+psycopg://artcity:artcity@localhost:5432/artcity"

    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    s3_endpoint_url: str = "http://localhost:9000"
    s3_access_key: str = "artcity"
    s3_secret_key: str = "artcitysecret"
    s3_bucket: str = "artcity-media"
    s3_region: str = "us-east-1"
    s3_force_path_style: bool = True
    s3_public_endpoint_url: str = "http://localhost:9000"

    upload_part_size_bytes: int = 5 * 1024 * 1024
    signed_url_expire_seconds: int = 3600

    seed_admin_email: str = "admin@artcity.example"
    seed_admin_password: str = "ChangeMeNow!"
    seed_tenant_name: str = "Art City"
    seed_tenant_slug: str = "art-city"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
