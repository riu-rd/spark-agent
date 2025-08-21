"""
TRYBE Fintech AI Models
========================
Clean implementation of the TRYBE Discrepancy Detector and Risk Predictor models.
These classes are designed to work with the pre-trained pickle files.

Models:
- TRYBEDiscrepancyDetector: Detects floating cash transactions
- TRYBERiskPredictor: Predicts probability of transaction floating
"""

from __future__ import annotations
import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Union
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report


class DataSchemaAligner:
    """
    Maps alternative/legacy column names to canonical names.
    Ensures compatibility across different data sources.
    """
    
    _NAME_MAP: Dict[str, List[str]] = {
        "transaction_id": ["txn_id", "id"],
        "user_id": ["uid"],
        "amount": ["txn_amount"],
        "transaction_type": ["transaction_types", "txn_type"],
        "recipient_type": [],
        "status_4": ["final_status", "status_final"],
        "is_floating_cash": ["ground_truth_floating"],
        "floating_duration_minutes": ["float_minutes"],
        "manual_escalation_needed": ["escalate"],
        "is_fraudulent_attempt": ["fraud_flag"],
        "simulated_network_latency": ["network_latency", "latency_ms"],
        "recipient_bank_name_or_ewallet": ["recipient_bank", "recipient_bank/e-wallet_name", "recipient_bank_name/e-wallet_name"],
        "timestamp_initiated": ["timestamp", "initiated_at"],
        "is_cancellation": ["cancel_flag"],
    }
    
    def __init__(self, df: pd.DataFrame):
        self.original = df.copy()
        self.aligned = self._align(df.copy())
    
    def _align(self, df: pd.DataFrame) -> pd.DataFrame:
        """Rename columns to canonical names."""
        rename_map: Dict[str, str] = {}
        for canonical, aliases in self._NAME_MAP.items():
            if canonical in df.columns:
                continue
            for alt in aliases:
                if alt in df.columns:
                    rename_map[alt] = canonical
                    break
        if rename_map:
            df = df.rename(columns=rename_map)
        return df
    
    @property
    def frame(self) -> pd.DataFrame:
        return self.aligned


class TRYBEDiscrepancyDetector:
    """
    Detects floating cash transactions based on business rules.
    
    Primary detection method: Flags transactions where floating_duration_minutes > threshold
    
    Performance metrics (on test dataset):
    - Precision: ~0.34
    - Recall: ~0.96
    - Alert rate: ~14% of transactions
    """
    
    _THRESHOLD_MIN = 10  # Minutes threshold for floating detection
    
    def __init__(self):
        self.df = None
        
    def load_transaction_data(self, src: Union[str, pd.DataFrame]) -> pd.DataFrame:
        """
        Load and align transaction data.
        
        Args:
            src: Either a file path (str) or a DataFrame
            
        Returns:
            Aligned DataFrame
        """
        raw = pd.read_csv(src) if isinstance(src, str) else src.copy()
        self.df = DataSchemaAligner(raw).frame
        print(f"Loaded {len(self.df):,} transactions")
        return self.df
    
    def _is_floating(self, row: pd.Series) -> bool:
        """Check if a transaction is floating based on duration."""
        return row.get("floating_duration_minutes", 0) > self._THRESHOLD_MIN
    
    def detect_discrepancies(self, df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        """
        Apply discrepancy detection to transactions.
        
        Args:
            df: DataFrame to analyze (uses self.df if None)
            
        Returns:
            DataFrame with 'detected_discrepancy' column added
        """
        if df is None:
            df = self.df
            if df is None:
                raise ValueError("Run load_transaction_data() first.")
        else:
            df = DataSchemaAligner(df).frame
        
        df["detected_discrepancy"] = df["floating_duration_minutes"] > self._THRESHOLD_MIN
        flagged = int(df["detected_discrepancy"].sum())
        print(f"Flagged {flagged:,}/{len(df):,} transactions ({flagged/len(df):.2%})")
        
        # Calculate metrics if ground truth available
        if "is_floating_cash" in df.columns:
            tp = ((df["detected_discrepancy"]) & df["is_floating_cash"]).sum()
            fp = flagged - tp
            fn = ((~df["detected_discrepancy"]) & df["is_floating_cash"]).sum()
            precision = tp / (tp + fp) if tp + fp else 0
            recall = tp / (tp + fn) if tp + fn else 0
            print(f"Precision: {precision:.3f} | Recall: {recall:.3f}")
        
        return df
    
    def get_flagged_transactions(self, df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        """
        Get only flagged transactions with key details.
        
        Args:
            df: DataFrame with detection results
            
        Returns:
            DataFrame containing only flagged transactions
        """
        if df is None:
            df = self.df
            if df is None:
                raise ValueError("Run detect_discrepancies() first.")
        
        cols = [
            "transaction_id", "user_id", "amount", "transaction_type",
            "status_4", "floating_duration_minutes", "manual_escalation_needed"
        ]
        available_cols = [c for c in cols if c in df.columns]
        
        if "detected_discrepancy" not in df.columns:
            df = self.detect_discrepancies(df)
            
        return df.loc[df["detected_discrepancy"], available_cols].copy()


class TRYBERiskPredictor:
    """
    Predicts probability of transaction becoming floating cash.
    
    Uses Random Forest or Logistic Regression with engineered features.
    
    Performance metrics (Random Forest):
    - Accuracy: ~0.92
    - AUC-ROC: ~0.95
    """
    
    def __init__(self, model_type: str = "random_forest"):
        """
        Initialize predictor.
        
        Args:
            model_type: Either "random_forest" or "logistic_regression"
        """
        self.model_type = model_type
        self.scaler = StandardScaler()
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.model = None
        self.feature_cols: List[str] = []
        self.target_col: str = "is_floating_cash"
    
    def load_data(self, file_or_df: Union[str, pd.DataFrame]) -> pd.DataFrame:
        """
        Load and align data for risk prediction.
        
        Args:
            file_or_df: Either a file path or DataFrame
            
        Returns:
            Aligned DataFrame
        """
        raw = pd.read_csv(file_or_df) if isinstance(file_or_df, str) else file_or_df.copy()
        df = DataSchemaAligner(raw).frame
        
        if self.target_col in df.columns:
            prevalence = df[self.target_col].mean()
            print(f"Loaded {len(df):,} records | Floating cash prevalence: {prevalence:.2%}")
        else:
            print(f"Loaded {len(df):,} records")
        
        return df
    
    def preprocess(self, df: pd.DataFrame, is_training: bool = True) -> pd.DataFrame:
        """
        Preprocess data for model training/inference.
        
        Args:
            df: Raw DataFrame
            is_training: Whether this is for training (fits encoders) or inference
            
        Returns:
            Preprocessed DataFrame
        """
        df = DataSchemaAligner(df).frame.copy()
        
        # Base features
        base_features = [
            "amount", "simulated_network_latency", "transaction_type", 
            "recipient_type", "recipient_bank_name_or_ewallet", 
            "floating_duration_minutes", "is_fraudulent_attempt",
            "is_cancellation", "manual_escalation_needed"
        ]
        
        # Add engineered features
        engineered = self._add_engineered_features(df)
        self.feature_cols = [f for f in base_features + engineered if f in df.columns]
        
        # Handle missing values
        for col in self.feature_cols:
            if col not in df.columns:
                continue
            if df[col].dtype == object or pd.api.types.is_categorical_dtype(df[col]):
                df[col] = df[col].fillna("unknown")
            else:
                df[col] = df[col].fillna(df[col].median() if len(df) > 0 else 0)
        
        # Encode categorical variables
        categorical_cols = ["transaction_type", "recipient_type", "recipient_bank_name_or_ewallet"]
        for col in categorical_cols:
            if col not in df.columns or col not in self.feature_cols:
                continue
                
            if is_training:
                # Fit new encoder
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le
            else:
                # Use existing encoder
                if col in self.label_encoders:
                    le = self.label_encoders[col]
                    # Handle unseen categories
                    df[col] = df[col].astype(str).apply(
                        lambda x: le.transform([x])[0] if x in le.classes_ else -1
                    )
        
        return df
    
    def _add_engineered_features(self, df: pd.DataFrame) -> List[str]:
        """
        Create engineered features from raw data.
        
        Args:
            df: DataFrame to enhance
            
        Returns:
            List of new column names added
        """
        new_cols: List[str] = []
        
        # Amount-based features
        if "amount" in df.columns:
            df["amount_log"] = np.log1p(df["amount"])
            df["is_high_amount"] = (df["amount"] > df["amount"].quantile(0.9)).astype(int)
            new_cols += ["amount_log", "is_high_amount"]
        
        # Network latency features
        if "simulated_network_latency" in df.columns:
            df["is_high_latency"] = (df["simulated_network_latency"] > 1000).astype(int)
            new_cols.append("is_high_latency")
        
        # Time-based features
        if "timestamp_initiated" in df.columns:
            try:
                ts = pd.to_datetime(df["timestamp_initiated"], errors="coerce")
                df["hour_of_day"] = ts.dt.hour
                df["day_of_week"] = ts.dt.dayofweek
                df["is_weekend"] = ts.dt.dayofweek.isin([5, 6]).astype(int)
                new_cols += ["hour_of_day", "day_of_week", "is_weekend"]
            except:
                pass
        
        # Risk combination features
        if {"is_fraudulent_attempt", "manual_escalation_needed"}.issubset(df.columns):
            df["high_risk_combo"] = (
                df["is_fraudulent_attempt"] | df["manual_escalation_needed"]
            ).astype(int)
            new_cols.append("high_risk_combo")
        
        return new_cols
    
    def _init_model(self):
        """Initialize the ML model based on model_type."""
        if self.model_type == "random_forest":
            return RandomForestClassifier(
                n_estimators=150,
                max_depth=15,
                min_samples_split=10,
                class_weight="balanced",
                random_state=42
            )
        elif self.model_type == "logistic_regression":
            return LogisticRegression(
                max_iter=1500,
                class_weight="balanced",
                random_state=42
            )
        else:
            raise ValueError(f"Unknown model_type: {self.model_type}")
    
    def train_model(self, df: pd.DataFrame):
        """
        Train the risk prediction model.
        
        Args:
            df: Training DataFrame with target column
            
        Returns:
            Trained model
        """
        from sklearn.model_selection import train_test_split
        
        # Preprocess data
        df_prep = self.preprocess(df, is_training=True)
        
        # Prepare features and target
        X = df_prep[self.feature_cols]
        y = df_prep[self.target_col]
        
        print(f"Training {self.model_type} model...")
        print(f"Features: {len(self.feature_cols)}, Samples: {len(X)}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, stratify=y, random_state=42
        )
        
        # Scale features
        self.scaler.fit(X_train)
        X_train_scaled = self.scaler.transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model = self._init_model()
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        self._evaluate(X_test_scaled, y_test)
        
        return self.model
    
    def _evaluate(self, X_test, y_test):
        """Evaluate model performance."""
        preds = self.model.predict(X_test)
        pred_proba = self.model.predict_proba(X_test)[:, 1]
        
        acc = accuracy_score(y_test, preds)
        auc = roc_auc_score(y_test, pred_proba)
        
        print(f"\nModel Performance:")
        print(f"  Accuracy: {acc:.4f}")
        print(f"  AUC-ROC: {auc:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, preds))
    
    def predict_risk(self, transaction: Union[Dict, pd.DataFrame]) -> Union[float, np.ndarray]:
        """
        Predict floating cash risk for transaction(s).
        
        Args:
            transaction: Single transaction dict or DataFrame of transactions
            
        Returns:
            Risk probability (float for single, array for multiple)
        """
        if self.model is None:
            raise RuntimeError("Model not trained. Call train_model() first or load a trained model.")
        
        # Convert to DataFrame if needed
        tx_df = pd.DataFrame([transaction]) if isinstance(transaction, dict) else transaction.copy()
        
        # Preprocess
        tx_df = self.preprocess(tx_df, is_training=False)
        
        # Get available features
        available = [c for c in self.feature_cols if c in tx_df.columns]
        
        # Create feature matrix with proper shape
        X = pd.DataFrame(0, index=tx_df.index, columns=self.feature_cols)
        X[available] = tx_df[available]
        
        # Scale and predict
        X_scaled = self.scaler.transform(X)
        proba = self.model.predict_proba(X_scaled)[:, 1]
        
        return proba[0] if len(proba) == 1 else proba
    
    def get_feature_importance(self) -> Optional[pd.DataFrame]:
        """
        Get feature importance for tree-based models.
        
        Returns:
            DataFrame with features and importance scores, or None
        """
        if self.model is None:
            return None
            
        if hasattr(self.model, 'feature_importances_'):
            return pd.DataFrame({
                'feature': self.feature_cols,
                'importance': self.model.feature_importances_
            }).sort_values('importance', ascending=False)
        
        return None