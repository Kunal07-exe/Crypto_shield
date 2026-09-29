import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "cryptoshield.db").replace("\\", "/")

class Settings(BaseSettings):
    PROJECT_NAME: str = "CryptoShield"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "cryptoshield-cybercrime-investigation-platform-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_PATH}"
    
    # ML Models path
    MODEL_DIR: str = os.path.join(os.path.dirname(__file__), "ml_models")
    
    # Blockchain Audit settings
    RPC_URL: str = "http://127.0.0.1:8545"
    CONTRACT_ADDRESS: str = "0x71C8F794B2a6886e088a29A7228800Fc92779A42"
    NETWORK_NAME: str = "Sepolia / Local EVM"
    
    # Multi-provider resilience configuration
    PRIMARY_PROVIDER: str = "Infura Gateway"
    FALLBACK_PROVIDER_1: str = "Alchemy Gateway"
    FALLBACK_PROVIDER_2: str = "QuickNode Resilience Mesh"
    
    # Simulator Settings
    SIMULATION_INTERVAL_SEC: float = 2.5
    
    model_config = SettingsConfigDict(
        case_sensitive=True,
        extra="ignore",
        env_file=".env",
        env_file_encoding="utf-8"
    )

settings = Settings()
