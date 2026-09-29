import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CryptoShield"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cryptoshield-cybercrime-investigation-platform-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cryptoshield.db")
    
    # ML Models path
    MODEL_DIR: str = os.path.join(os.path.dirname(__file__), "ml_models")
    
    # Blockchain Audit settings
    RPC_URL: str = os.getenv("RPC_URL", "http://127.0.0.1:8545")
    CONTRACT_ADDRESS: str = os.getenv("CONTRACT_ADDRESS", "0x71C8F794B2a6886e088a29A7228800Fc92779A42")
    NETWORK_NAME: str = "Sepolia / Local EVM"
    
    # Multi-provider resilience configuration
    PRIMARY_PROVIDER: str = "Infura Gateway"
    FALLBACK_PROVIDER_1: str = "Alchemy Gateway"
    FALLBACK_PROVIDER_2: str = "QuickNode Resilience Mesh"
    
    # Simulator Settings
    SIMULATION_INTERVAL_SEC: float = 2.5
    
    class Config:
        case_sensitive = True

settings = Settings()
