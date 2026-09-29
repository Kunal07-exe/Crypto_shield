import requests
import json
import time
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"
HEALTH_URL = "http://127.0.0.1:8000/health"

results = {
    "passed": 0,
    "failed": 0,
    "tests": []
}

def log_test(name, success, details=""):
    status = "PASS" if success else "FAIL"
    results["tests"].append({"name": name, "status": status, "details": details})
    if success:
        results["passed"] += 1
        print(f"  [+] {name}: PASS")
    else:
        results["failed"] += 1
        print(f"  [-] {name}: FAIL - {details}")

print("===============================================================================")
print(" CRYPTOSHIELD FULL END-TO-END AUTOMATED VERIFICATION SUITE")
print("===============================================================================")

# -----------------------------------------------------------------------------
# 1. System Health Check
# -----------------------------------------------------------------------------
print("\n[1/10] Verifying System Core Health...")
try:
    r = requests.get(HEALTH_URL, timeout=5)
    if r.status_code == 200:
        data = r.json()
        log_test("System Health Endpoint", True, f"Service: {data.get('service')}, Version: {data.get('version')}")
    else:
        log_test("System Health Endpoint", False, f"Status: {r.status_code}")
except Exception as e:
    log_test("System Health Endpoint", False, str(e))

# -----------------------------------------------------------------------------
# 2. Authentication & Security Layer
# -----------------------------------------------------------------------------
print("\n[2/10] Verifying Authentication & Access Control...")
inv_token = None
user_token = None

# Test: Valid Investigator Login
try:
    payload = {
        "organization_id": "CYBER-INTEL-HQ",
        "investigator_id": "investigator@agency.gov",
        "password": "Shield@2026",
        "otp_code": "123456"
    }
    r = requests.post(f"{BASE_URL}/auth/investigator-login", json=payload, timeout=5)
    if r.status_code == 200 and "access_token" in r.json():
        inv_token = r.json()["access_token"]
        log_test("Investigator Valid MFA Login", True, f"User: {r.json()['user']['name']}")
    else:
        log_test("Investigator Valid MFA Login", False, f"Status: {r.status_code}, Body: {r.text}")
except Exception as e:
    log_test("Investigator Valid MFA Login", False, str(e))

# Test: Invalid Password
try:
    payload = {
        "organization_id": "CYBER-INTEL-HQ",
        "investigator_id": "investigator@agency.gov",
        "password": "WrongPassword!",
        "otp_code": "123456"
    }
    r = requests.post(f"{BASE_URL}/auth/investigator-login", json=payload, timeout=5)
    if r.status_code == 401:
        log_test("Security: Rejection on Invalid Password", True)
    else:
        log_test("Security: Rejection on Invalid Password", False, f"Expected 401, got {r.status_code}")
except Exception as e:
    log_test("Security: Rejection on Invalid Password", False, str(e))

# Test: Invalid OTP Code
try:
    payload = {
        "organization_id": "CYBER-INTEL-HQ",
        "investigator_id": "investigator@agency.gov",
        "password": "Shield@2026",
        "otp_code": "999999"
    }
    r = requests.post(f"{BASE_URL}/auth/investigator-login", json=payload, timeout=5)
    if r.status_code == 401:
        log_test("Security: Rejection on Invalid OTP", True)
    else:
        log_test("Security: Rejection on Invalid OTP", False, f"Expected 401, got {r.status_code}")
except Exception as e:
    log_test("Security: Rejection on Invalid OTP", False, str(e))

# Test: Wallet User Login
try:
    payload = {
        "wallet_address": "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
        "wallet_provider": "MetaMask"
    }
    r = requests.post(f"{BASE_URL}/auth/wallet-login", json=payload, timeout=5)
    if r.status_code == 200 and "access_token" in r.json():
        user_token = r.json()["access_token"]
        log_test("Wallet Connect Authentication", True, f"Address: {r.json()['user']['wallet_address']}")
    else:
        log_test("Wallet Connect Authentication", False, f"Status: {r.status_code}")
except Exception as e:
    log_test("Wallet Connect Authentication", False, str(e))

# -----------------------------------------------------------------------------
# 3. Database Layer & Model Integrity
# -----------------------------------------------------------------------------
print("\n[3/10] Verifying Database CRUD & Schema Integrity...")

# Test: Fetch Wallet Stats
try:
    r = requests.get(f"{BASE_URL}/wallets/stats", timeout=5)
    if r.status_code == 200:
        data = r.json()
        valid = (data["total_wallets"] > 0 and data["total_transactions"] > 0 and "risk_distribution" in data)
        log_test("DB: Query Live Wallet Overview Stats", valid, f"Wallets: {data['total_wallets']}, Txs: {data['total_transactions']}")
    else:
        log_test("DB: Query Live Wallet Overview Stats", False, f"Status: {r.status_code}")
except Exception as e:
    log_test("DB: Query Live Wallet Overview Stats", False, str(e))

# Test: Fetch Specific Wallet Profile & Dynamic Security Score
try:
    r = requests.get(f"{BASE_URL}/wallets/0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3", timeout=5)
    if r.status_code == 200:
        data = r.json()
        w = data["wallet"]
        has_sec = "security_score" in w and "balance_eth" in w
        log_test("DB: Fetch Wallet Profile & Behavioral Baseline", has_sec, f"Balance: {w['balance_eth']} ETH, Sec Score: {w['security_score']}/100")
    else:
        log_test("DB: Fetch Wallet Profile & Behavioral Baseline", False, f"Status: {r.status_code}")
except Exception as e:
    log_test("DB: Fetch Wallet Profile & Behavioral Baseline", False, str(e))

# -----------------------------------------------------------------------------
# 4. Fraud Detection & 6-Layer Risk Engine
# -----------------------------------------------------------------------------
print("\n[4/10] Verifying 6-Layer Risk Engine & Pre-Tx Checks...")

# Scenario A: Normal Safe Transfer (Low Risk)
try:
    payload = {
        "sender": "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
        "recipient": "0x55c68997a3915124019a97f39442011929997f3",
        "amount": 0.15,
        "currency": "ETH",
        "blockchain": "Ethereum"
    }
    r = requests.post(f"{BASE_URL}/transactions/pre-check", json=payload, timeout=5)
    if r.status_code == 200:
        res = r.json()
        is_low = res["risk_level"] == "LOW" or res["risk_score"] < 40
        log_test("Risk Engine: Legitimate Transaction Classification (Low Risk)", is_low, f"Score: {res['risk_score']}, Level: {res['risk_level']}")
    else:
        log_test("Risk Engine: Legitimate Transaction Classification (Low Risk)", False, f"Status: {r.status_code}")
except Exception as e:
    log_test("Risk Engine: Legitimate Transaction Classification (Low Risk)", False, str(e))

# Scenario B: High-Risk Drainer Address (High Risk Flag)
try:
    payload = {
        "sender": "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
        "recipient": "0x71C8F794B2a6886e088a29A7228800Fc92779A42",
        "amount": 1.5,
        "currency": "ETH",
        "blockchain": "Ethereum"
    }
    r = requests.post(f"{BASE_URL}/transactions/pre-check", json=payload, timeout=5)
    if r.status_code == 200:
        res = r.json()
        is_high = res["is_dangerous"] and res["risk_score"] >= 70
        log_test("Risk Engine: Drainer Threat Detection & Interceptor Warning", is_high, f"Score: {res['risk_score']}, Reasons: {len(res['reasons'])}")
    else:
        log_test("Risk Engine: Drainer Threat Detection & Interceptor Warning", False, f"Status: {r.status_code}")
except Exception as e:
    log_test("Risk Engine: Drainer Threat Detection & Interceptor Warning", False, str(e))

# -----------------------------------------------------------------------------
# 5. Live Payment Flow & Dynamic Balance Deduction
# -----------------------------------------------------------------------------
print("\n[5/10] Verifying Live Transaction Execution & Balance Updates...")
try:
    # 1. Check initial balance
    w_before = requests.get(f"{BASE_URL}/wallets/0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3").json()["wallet"]
    init_bal = w_before["balance_eth"]

    # 2. Execute Payment
    pay_payload = {
        "sender_wallet": "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
        "recipient_wallet": "0x55c68997a3915124019a97f39442011929997f3",
        "amount": 0.05,
        "currency": "ETH",
        "force_proceed": True
    }
    pay_res = requests.post(f"{BASE_URL}/transactions/execute-payment", json=pay_payload, timeout=5)
    if pay_res.status_code == 200:
        p_data = pay_res.json()
        new_bal = p_data["new_balance"]
        bal_correct = round(init_bal - 0.05, 4) == round(new_bal, 4)
        log_test("User Flow: Execute Payment & Balance Deduction", bal_correct, f"Old Bal: {init_bal} ETH -> New Bal: {new_bal} ETH (Tx: {p_data['tx_hash'][:14]}...)")
    else:
        log_test("User Flow: Execute Payment & Balance Deduction", False, f"Status: {pay_res.status_code}")
except Exception as e:
    log_test("User Flow: Execute Payment & Balance Deduction", False, str(e))

# -----------------------------------------------------------------------------
# 6. Fraud Report Filing & Automated Case Escalation
# -----------------------------------------------------------------------------
print("\n[6/10] Verifying User Fraud Reporting & Auto-Case Generation...")
created_case_id = None
try:
    report_payload = {
        "reporter_wallet": "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
        "target_wallet_or_tx": "0x19b08f8832a82914101e1882361b17a102712804",
        "fraud_type": "Mule Layering & Mixer Laundering",
        "amount_lost": 3.75,
        "currency": "ETH",
        "incident_date": "2026-08-26",
        "description": "Funds were layered across 4 mule hops immediately after victim transferred investment collateral."
    }
    rep_res = requests.post(f"{BASE_URL}/reports/user-fraud-report", json=report_payload, timeout=5)
    if rep_res.status_code == 200:
        r_data = rep_res.json()
        created_case_id = r_data.get("case_id")
        rep_valid = "report_id" in r_data and created_case_id is not None and "risk_check" in r_data
        log_test("User Flow: Submit Fraud Report + Auto-Case Escalation", rep_valid, f"Report: {r_data.get('report_id')} -> Case: {created_case_id}")
    else:
        log_test("User Flow: Submit Fraud Report + Auto-Case Escalation", False, f"Status: {rep_res.status_code}")
except Exception as e:
    log_test("User Flow: Submit Fraud Report + Auto-Case Escalation", False, str(e))

# -----------------------------------------------------------------------------
# 7. Blockchain Immutable Evidence & SHA-256 Anchoring
# -----------------------------------------------------------------------------
print("\n[7/10] Verifying Blockchain Evidence Anchoring & Proof Verification...")
try:
    ev_list = requests.get(f"{BASE_URL}/evidence", timeout=5).json()
    if len(ev_list) > 0:
        target_ev = ev_list[0]
        ev_id = target_ev["evidence_id"]
        v_res = requests.get(f"{BASE_URL}/evidence/verify/{ev_id}", timeout=5)
        if v_res.status_code == 200:
            proof = v_res.json()
            is_valid_proof = proof.get("is_immutable_and_verified") is True and "evidence_hash" in proof
            log_test("Blockchain Layer: Off-Chain SHA-256 Digest -> Smart Contract Verification", is_valid_proof, f"Evidence: {ev_id}, Anchor Block: #{proof.get('block_number')}")
        else:
            log_test("Blockchain Layer: Off-Chain SHA-256 Digest -> Smart Contract Verification", False, f"Status: {v_res.status_code}")
    else:
        log_test("Blockchain Layer: Off-Chain SHA-256 Digest -> Smart Contract Verification", False, "No evidence records found")
except Exception as e:
    log_test("Blockchain Layer: Off-Chain SHA-256 Digest -> Smart Contract Verification", False, str(e))

# -----------------------------------------------------------------------------
# 8. Investigator Dossier & Follow the Money Multi-Hop Tracing
# -----------------------------------------------------------------------------
print("\n[8/10] Verifying Investigation Dossier & Follow Money BFS Tracer...")

# Test: Case Dossier Report
try:
    case_to_test = created_case_id or "CR-2026-00182"
    d_res = requests.get(f"{BASE_URL}/cases/{case_to_test}/report", timeout=5)
    if d_res.status_code == 200:
        dossier = d_res.json()
        has_sections = ("case_information" in dossier and "primary_wallet" in dossier and "risk_analysis" in dossier and "recommended_action" in dossier)
        log_test("Investigator Flow: Generate Court-Ready Forensic Dossier", has_sections, f"Case: {case_to_test}")
    else:
        log_test("Investigator Flow: Generate Court-Ready Forensic Dossier", False, f"Status: {d_res.status_code}")
except Exception as e:
    log_test("Investigator Flow: Generate Court-Ready Forensic Dossier", False, str(e))

# Test: Follow the Money (BFS Multi-Hop)
try:
    trace_payload = {
        "start_wallet": "0x71C8F794B2a6886e088a29A7228800Fc92779A42",
        "max_hops": 4,
        "min_amount": 0.0
    }
    t_res = requests.post(f"{BASE_URL}/graph/follow-money", json=trace_payload, timeout=5)
    if t_res.status_code == 200:
        trace_data = t_res.json()
        has_hops = "timeline" in trace_data and "subgraph" in trace_data and "total_amount_traced_eth" in trace_data
        log_test("Investigator Flow: Follow the Money Recursive Multi-Hop BFS Trace", has_hops, f"Hops: {len(trace_data.get('timeline', []))}, Amount Traced: {trace_data.get('total_amount_traced_eth')} ETH")
    else:
        log_test("Investigator Flow: Follow the Money Recursive Multi-Hop BFS Trace", False, f"Status: {t_res.status_code}")
except Exception as e:
    log_test("Investigator Flow: Follow the Money Recursive Multi-Hop BFS Trace", False, str(e))

# -----------------------------------------------------------------------------
# 9. Attack Simulation Injection & Real-Time Telemetry
# -----------------------------------------------------------------------------
print("\n[9/10] Verifying Cyber Attack Vector Simulation Gateway...")
for sim_type in ["ADDRESS_POISONING", "WALLET_DRAINER_SWEEP", "MULE_LAYERING", "EXCHANGE_DEPOSIT"]:
    try:
        s_res = requests.post(f"{BASE_URL}/simulation/trigger?scenario={sim_type}", timeout=5)
        if s_res.status_code == 200:
            s_data = s_res.json()
            tx = s_data.get("transaction", {})
            valid_sim = tx.get("risk_score") is not None and "tx_hash" in tx
            log_test(f"Attack Simulator: Vector Injection [{sim_type}]", valid_sim, f"Risk: {tx.get('risk_score')}/100, Type: {tx.get('fraud_type')}")
        else:
            log_test(f"Attack Simulator: Vector Injection [{sim_type}]", False, f"Status: {s_res.status_code}")
    except Exception as e:
        log_test(f"Attack Simulator: Vector Injection [{sim_type}]", False, str(e))

# -----------------------------------------------------------------------------
# 10. ML Custom Model Training Pipeline
# -----------------------------------------------------------------------------
print("\n[10/10] Verifying Machine Learning Model Training Pipeline...")
try:
    m_info = requests.get(f"{BASE_URL}/ml/model-info", timeout=5)
    if m_info.status_code == 200:
        info_data = m_info.json()
        log_test("ML Pipeline: Active Model Information & Hot-Reload Status", info_data.get("is_trained") is True, f"Features: {len(info_data.get('features', []))}")
    else:
        log_test("ML Pipeline: Active Model Information & Hot-Reload Status", False, f"Status: {m_info.status_code}")
except Exception as e:
    log_test("ML Pipeline: Active Model Information & Hot-Reload Status", False, str(e))

# Test Live ML Inference
try:
    inf_payload = {
        "indegree": 15,
        "outdegree": 30,
        "in_btc": 12.0,
        "out_btc": 11.9,
        "total_btc": 23.9,
        "mean_in_btc": 0.8,
        "mean_out_btc": 0.39,
        "in_malicious": 1,
        "out_malicious": 1,
        "out_and_tx_malicious": 0.9,
        "all_malicious": 0.9
    }
    inf_res = requests.post(f"{BASE_URL}/ml/predict", json=inf_payload, timeout=5)
    if inf_res.status_code == 200:
        pred = inf_res.json()
        log_test("ML Pipeline: Real-Time Vector Inference (XGBoost + RF Ensemble)", True, f"Fraud Prob: {pred.get('ml_fraud_prob')*100:.1f}%, Prediction: {pred.get('prediction')}")
    else:
        log_test("ML Pipeline: Real-Time Vector Inference (XGBoost + RF Ensemble)", False, f"Status: {inf_res.status_code}")
except Exception as e:
    log_test("ML Pipeline: Real-Time Vector Inference (XGBoost + RF Ensemble)", False, str(e))

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
print("\n===============================================================================")
print(f" TOTAL TESTS COMPLETED: {len(results['tests'])}")
print(f" PASSED: {results['passed']}  |  FAILED: {results['failed']}")
print("===============================================================================")
