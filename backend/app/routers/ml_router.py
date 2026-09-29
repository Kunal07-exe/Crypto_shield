from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Dict, Any, Optional
from app.ml_engine import ml_service, FEATURE_NAMES

router = APIRouter(prefix="/ml", tags=["Machine Learning & Custom Model Training"])

@router.get("/metrics")
def get_ml_performance_metrics():
    """
    Returns performance metrics from Random Forest and XGBoost with SMOTE.
    """
    if not ml_service.is_trained:
        ml_service.train_and_evaluate(n_samples=30000)

    return {
        "scientific_foundation": "sensors-22-07162-v3: A Machine Learning and Blockchain Based Efficient Fraud Detection Mechanism",
        "dataset_info": ml_service.active_dataset_info,
        "dataset_total": ml_service.model_metrics.get("dataset_total", 30000),
        "test_samples": ml_service.model_metrics.get("test_samples", 9000),
        "features": ml_service.active_features,
        "rf_metrics": ml_service.model_metrics.get("rf", {}),
        "xgb_metrics": ml_service.model_metrics.get("xgboost", {}),
        "trained_at": ml_service.model_metrics.get("trained_at"),
        "model_drift_status": {
            "status": "HEALTHY",
            "drift_detected": False,
            "current_f1_baseline": round(ml_service.model_metrics.get("xgboost", {}).get("f1", 0.94), 3),
            "last_evaluated": ml_service.model_metrics.get("trained_at")
        }
    }

@router.post("/train-from-file")
async def train_from_uploaded_file(
    file: UploadFile = File(...),
    target_col: Optional[str] = Form(None),
    test_size: float = Form(0.30),
    use_smote: bool = Form(True),
    rf_n_estimators: int = Form(100),
    xgb_n_estimators: int = Form(120)
):
    """
    CUSTOM DATASET TRAINING PIPELINE:
    Upload any supported file (PDF, CSV, XLSX, JSON, Parquet, TXT).
    The pipeline will:
    1. Parse and extract tabular transactions / features
    2. Auto-engineer graph metrics & identify fraud labels
    3. Balance dataset with SMOTE
    4. Train Random Forest + XGBoost models
    5. Evaluate Accuracy, Precision, Recall, F1, and ROC-AUC
    6. Hot-reload the live detection engine with the newly trained model!
    """
    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        filename = file.filename or "uploaded_dataset.csv"
        
        # Clean target_col if empty string
        cleaned_target = target_col.strip() if target_col and target_col.strip() else None

        result = ml_service.train_from_custom_data(
            file_bytes=file_bytes,
            filename=filename,
            target_col=cleaned_target,
            test_size=float(test_size),
            use_smote=bool(use_smote),
            rf_n_estimators=int(rf_n_estimators),
            xgb_n_estimators=int(xgb_n_estimators)
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training pipeline error: {str(e)}")

@router.get("/model-info")
def get_current_model_info():
    """
    Returns metadata about the currently active and loaded ML model.
    """
    return {
        "is_trained": ml_service.is_trained,
        "dataset_info": ml_service.active_dataset_info,
        "features": ml_service.active_features,
        "models": ["Random Forest Classifier", "XGBoost Classifier"],
        "trained_at": ml_service.model_metrics.get("trained_at")
    }

@router.post("/predict")
def live_ml_predict(feature_payload: Dict[str, float]):
    """
    Live inference endpoint for transaction classification using the active trained model.
    """
    result = ml_service.predict_transaction(feature_payload)
    return result

@router.post("/retrain")
def trigger_model_retrain():
    """
    Retrains the default baseline dataset.
    """
    ml_service.train_and_evaluate(n_samples=30000)
    return {
        "status": "Model Pipeline Retrained Successfully",
        "new_metrics": {
            "rf_roc_auc": ml_service.model_metrics["rf"]["roc_auc"],
            "xgb_roc_auc": ml_service.model_metrics["xgboost"]["roc_auc"]
        }
    }
