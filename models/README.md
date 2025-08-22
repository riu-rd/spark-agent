# Machine Learning Models for SPARK

## 🚀 Quick Setup

### Prerequisites
- Python 3.11 or higher
- Google Colab account (for running notebooks)
- Access to root folder `.env` file (for local testing)

### For Google Colab (Recommended)
All notebooks in the `/notebooks` folder are designed to run in Google Colab:
1. Upload notebooks to Google Colab
2. Mount Google Drive if needed for data persistence
3. Install required packages directly in Colab cells

### For Local Development
1. **Navigate to the root folder**:
```bash
cd ..  # Go to trybe-lang root directory
```

2. **Create Python Environment**:

#### Option A: Using venv
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### Option B: Using Conda
```bash
# Create conda environment
conda create -n spark-models python=3.11
conda activate spark-models
```

3. **Install Dependencies**:
```bash
pip install -r requirements.txt
```

4. **Configure Environment**:
Ensure `.env` file is properly configured in the root directory with database credentials and Google API keys.

## 📁 Overview

This folder contains the machine learning models, training notebooks, and synthetic datasets that power SPARK's intelligent transaction monitoring and risk assessment capabilities.

### Important Note on Data
**All data in `/datasets` is synthetically generated** for development and testing purposes. No real banking data is used in model training or experimentation.

### Model Types

1. **Discrepancy Detector** (Rule-based)
   - Deterministic pattern matching
   - Identifies known transaction anomalies
   - Fast, explainable decisions

2. **Risk Predictor** (ML-based)
   - Machine learning model for risk assessment
   - Predicts transaction failure probability
   - Trained on synthetic transaction data

## 📄 Directory Structure

### `/notebooks` - Google Colab Notebooks
All notebooks were developed and run in **Google Colab** for easy reproducibility and cloud-based computing.

#### `1_synthetic_data_generation.ipynb`
- **Platform**: Google Colab
- **Purpose**: Generates synthetic banking transaction data
- **Output**: Creates datasets in `/datasets` folder
- **Features**:
  - Realistic transaction patterns
  - User wallet balance simulation
  - Floating cash anomaly injection
  - Configurable data volume

#### `2_EDA.ipynb`
- **Platform**: Google Colab
- **Purpose**: Exploratory Data Analysis
- **Contents**:
  - Transaction distribution analysis
  - Anomaly pattern identification
  - Feature correlation studies
  - Visualization of synthetic data patterns

#### `3_Trials.ipynb`
- **Platform**: Google Colab
- **Purpose**: Initial model experiments
- **Contents**:
  - Algorithm comparison
  - Hyperparameter exploration
  - Baseline model establishment
  - Performance benchmarking

#### `4_experimentation.ipynb`
- **Platform**: Google Colab
- **Purpose**: Final model development and training
- **Contents**:
  - Data exploration and visualization using synthetic datasets from `/datasets`
  - Feature engineering experiments
  - Model training (both rule-based and ML models)
  - Performance metrics analysis
  - Model export to `.pkl` files

### `/datasets` - Synthetic Data
**Note**: All data is synthetically generated for testing and development.

#### `transactions_fixed.csv`
- **Type**: Synthetic transaction data
- **Contents**: 
  - Transaction IDs, amounts, timestamps
  - Status flags (success, pending, failed)
  - User identifiers
  - Anomaly indicators
- **Records**: 10,000+ synthetic transactions

#### `user_wallet_balances.csv`
- **Type**: Synthetic user wallet data
- **Contents**:
  - User IDs
  - Wallet balances
  - Transaction history summaries
  - Risk profiles

### Core Models

#### `trybe_discrepancy_detector.pkl`
- **Type**: Rule-based detector
- **Training**: Developed in `4_experimentation.ipynb` on Google Colab
- **Purpose**: Identifies floating cash and transaction discrepancies
- **Input**: Transaction metadata (amount, status, timestamps)
- **Output**: Boolean flag indicating discrepancy presence
- **Usage**: Loaded by Host Agent for real-time anomaly detection

#### `trybe_risk_predictor.pkl`
- **Type**: Scikit-learn ML model
- **Training**: Trained in `4_experimentation.ipynb` on Google Colab using synthetic data
- **Purpose**: Predicts transaction risk levels
- **Input**: Transaction features (amount, user history, time patterns)
- **Output**: Risk score (0.0 - 1.0)
- **Usage**: Informs the Reconciler Agent for possible transaction risks

#### `trybe_models.py`
- **Type**: Python module
- **Purpose**: Model loading and inference utilities
- **Functions**:
  - `load_discrepancy_detector()`: Loads the discrepancy detection model
  - `load_risk_predictor()`: Loads the risk prediction model
  - `detect_discrepancy()`: Runs discrepancy detection on transaction
  - `predict_risk()`: Calculates risk score for transaction

#### `trybe_inference_demo.ipynb`
- **Purpose**: Demonstrates model inference pipeline
- **Platform**: Can run locally or on Colab
- **Contents**:
  - Loading pre-trained models
  - Sample transaction processing
  - Real-time prediction examples
  - Integration with agent system

## 🔬 Model Details

### Discrepancy Detector

The rule-based discrepancy detector uses a decision tree approach to identify transaction anomalies:

```python
# Example detection rules
if transaction.status == "pending" and time_elapsed > threshold:
    return "floating_cash_detected"
elif transaction.amount != ledger.amount:
    return "amount_mismatch"
```

**Key Features**:
- Transaction status validation
- Amount reconciliation
- Timestamp consistency checks
- Multi-currency support

### Risk Predictor

The ML-based risk predictor uses ensemble methods to assess transaction risk:

```python
# Feature categories used
features = {
    'transaction': ['amount', 'currency', 'type'],
    'temporal': ['hour', 'day_of_week', 'is_holiday'],
    'user': ['account_age', 'transaction_history', 'failure_rate'],
    'network': ['merchant_risk', 'route_reliability']
}
```

**Model Architecture**:
- Algorithm: Random Forest Classifier
- Features: 10+ engineered features
- Training data: Synthetic dataset

## 🧪 Running the Notebooks

### Google Colab (Recommended)
1. Open [Google Colab](https://colab.research.google.com/)
2. Upload notebook from `/notebooks` folder
3. Run cells sequentially
4. Models will be saved to your Google Drive

### Local Jupyter
```bash
# Start Jupyter
jupyter notebook

# Navigate to notebooks folder
# Run notebooks in numerical order (1-4)
```

### Python Script Usage
```python
from trybe_models import load_discrepancy_detector, detect_discrepancy

# Load model
detector = load_discrepancy_detector()

# Detect discrepancy
transaction = {
    'id': 'TXN_12345',
    'amount': 1000.00,
    'status': 'pending',
    'timestamp': '2024-01-15 10:30:00'
}

result = detect_discrepancy(detector, transaction)
print(f"Discrepancy detected: {result}")
```

## 🔄 Model Update Process

1. **Generate New Synthetic Data**: Run `1_synthetic_data_generation.ipynb` in Colab
2. **Explore Data**: Use `2_EDA.ipynb` for analysis
3. **Experiment**: Test approaches in `3_Trials.ipynb`
4. **Train Models**: Finalize in `4_experimentation.ipynb`
5. **Export Models**: Save as `.pkl` files
6. **Deploy**: Copy to agent tools directory

## 🛠️ Troubleshooting

### Common Issues

**Google Colab Package Installation**:
```python
# Run in first cell of Colab notebook
!pip install scikit-learn pandas numpy matplotlib seaborn
```

**ImportError when loading models locally**:
```bash
# Ensure scikit-learn is installed
pip install scikit-learn pandas numpy
```

**Model version mismatch**:
```bash
# Check scikit-learn version
python -c "import sklearn; print(sklearn.__version__)"
```

## 🔗 Integration Points

The models in this folder integrate with:
- **Host Agent**: Real-time anomaly detection
- **Reconciler Agent**: Risk-based retry prioritization
- **Frontend**: Risk visualization and alerts
- **Database**: Transaction feature extraction

## 📚 References

- [Google Colab](https://colab.research.google.com/)
- [Scikit-learn Documentation](https://scikit-learn.org/)
- [Pandas Documentation](https://pandas.pydata.org/)

---

For questions or issues, refer to the main [SPARK documentation](../README.md) or contact the development team.