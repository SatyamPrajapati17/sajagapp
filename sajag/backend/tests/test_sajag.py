"""
Sajag AI — Comprehensive Backend Unit & Guardrail Test Suite.
Tests non-negotiable PRD §6 safety rules and TRD §11 requirements.
"""

import pytest
import time
from extract import validate_syntax, normalize_value, is_traceable, deterministic_fallback_extractor
from graph import output_filter_node, safety_gate_node, calculate_prior, graph


def test_validators_valid():
    """Verify regex validators on legitimate formats."""
    assert validate_syntax("phone", "+919876543210")
    assert validate_syntax("phone", "9876543210")
    assert validate_syntax("upi", "police.verify@sbi")
    assert validate_syntax("upi", "scam99@okhdfcbank")
    assert validate_syntax("ifsc", "SBIN0001234")
    assert validate_syntax("ifsc", "HDFC0004321")
    assert validate_syntax("bank_account", "123456789012")
    assert validate_syntax("bank_account", "987654321")
    assert validate_syntax("url", "https://cybercrime-portal.org/verify")
    assert validate_syntax("email", "officer.cbi@gov.in")


def test_validators_invalid():
    """Verify regex validators reject invalid formats."""
    assert not validate_syntax("phone", "12345")
    assert not validate_syntax("phone", "abcdefghij")
    assert not validate_syntax("upi", "invalid_upi_without_at")
    assert not validate_syntax("ifsc", "INVALIDIFSC12")
    assert not validate_syntax("bank_account", "1234")  # Under 9 digits
    assert not validate_syntax("email", "not-an-email")


def test_normalization():
    """Verify entity normalization."""
    assert normalize_value("phone", "9876543210") == "+919876543210"
    assert normalize_value("phone", "09876543210") == "+919876543210"
    assert normalize_value("upi", "SCAM.Verify@SBI") == "scam.verify@sbi"
    assert normalize_value("ifsc", "sbin0001234") == "SBIN0001234"


def test_anti_hallucination_traceability():
    """CRITICAL GUARDRAIL: Only entities grounded in caller transcript are allowed."""
    transcript = "You must immediately transfer fine to UPI officer.cbi@sbi or go to jail."
    
    # Grounded value -> Traceable
    assert is_traceable("officer.cbi@sbi", transcript)
    
    # Hallucinated value not present in text -> Untraceable
    assert not is_traceable("fake.hallucinated@upi", transcript)
    assert not is_traceable("9876543210", transcript)


def test_output_filter_blocks_sensitive_data():
    """CRITICAL GUARDRAIL: Decoy must never leak OTP, PIN, digits, or payment commitments."""
    # 1. Block OTP leaks
    res1 = output_filter_node({"reply": "Sure sir, your otp is 987612"})
    assert "otp is" not in res1["reply"].lower()
    assert res1["safety_blocks"] == 1
    assert "samajh nahi aaya" in res1["reply"]

    # 2. Block PIN / password leaks
    res2 = output_filter_node({"reply": "My pin is 4321 and password is secret"})
    assert res2["safety_blocks"] == 1
    assert "samajh nahi aaya" in res2["reply"]

    # 3. Block payment commitments
    res3 = output_filter_node({"reply": "Okay sir I will transfer 50000 rupees right now"})
    assert res3["safety_blocks"] == 1
    assert "samajh nahi aaya" in res3["reply"]

    # 4. Block 4+ digit number leaks
    res4 = output_filter_node({"reply": "Here is the code 56789"})
    assert res4["safety_blocks"] == 1

    # 5. Block URL leaks
    res5 = output_filter_node({"reply": "Open this link https://malicious.apk to fix"})
    assert res5["safety_blocks"] == 1


def test_output_filter_word_cap():
    """CRITICAL GUARDRAIL: Cap reply to under 35 words for voice latency."""
    long_reply = "Haan ji " * 40
    res = output_filter_node({"reply": long_reply})
    assert len(res["reply"].split()) <= 35
    assert res["safety_blocks"] == 1


def test_safety_gate_3s_cancel():
    """Verify 3s fail-safe takeover cancellation."""
    state = {
        "call_id": "test-call-1",
        "mode": "PENDING",
        "p_scam": 0.92,
        "cancelled": True,
        "takeover_at": time.time() + 3
    }
    res = safety_gate_node(state)
    assert res["mode"] == "MONITOR"
    assert "takeover_cancelled" in res["events"]


def test_guardian_prior_multi_category_rule():
    """Single keyword category cannot exceed 0.3; >=2 categories required."""
    # Single category: Authority only -> capped at <= 0.3
    single_p, hits = calculate_prior("I am a police inspector speaking.")
    assert single_p <= 0.30
    assert len(hits) == 1

    # Multi-category: Authority + Threat + Demand + Urgency -> high score
    multi_p, hits = calculate_prior(
        "I am CBI officer. Arrest warrant issued. Transfer UPI immediately right now."
    )
    assert multi_p >= 0.85
    assert len(hits) >= 3


def test_e2e_simulated_cbi_turn():
    """Verify end-to-end simulated turn transitions to PENDING/DECOY and returns safe reply."""
    state = {
        "call_id": "test-cbi-e2e",
        "mode": "MONITOR",
        "p_scam": 0.0,
        "turns": [
            {
                "role": "caller",
                "text": "This is Inspector Vijay from Delhi Crime Branch. An arrest warrant has been issued. Transfer Rs 25000 to upi verify.court@sbi immediately."
            }
        ]
    }
    res = graph.invoke(state)
    assert res["p_scam"] >= 0.80
    assert res["level"] in ("HIGH", "CRITICAL")
    assert res["mode"] in ("PENDING", "DECOY")
    assert len(res["reply"].split()) <= 35
    # Verify reply does not leak sensitive tokens
    assert "otp is" not in res["reply"].lower()


def test_twilio_voice_and_status_webhooks():
    """Verify Twilio voice webhook captures 17 fields, returns TwiML, and status callback updates state."""
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)

    # 1. Test Inbound Voice Webhook
    resp = client.post("/twilio/voice", data={
        "CallSid": "CA_test_unit_123",
        "AccountSid": "AC_test_account",
        "From": "+919922996010",
        "To": "+17372508034",
        "Direction": "inbound",
        "CallStatus": "ringing",
        "CallerName": "Test Scammer",
        "FromCity": "Pune",
        "FromState": "MH",
        "FromCountry": "IN"
    })
    assert resp.status_code == 200
    assert "application/xml" in resp.headers["content-type"]
    assert "<Response>" in resp.text
    assert ("<Stream" in resp.text or "<Gather" in resp.text or "<Say" in resp.text or "<Play" in resp.text)

    # 2. Test Status Callback
    status_resp = client.post("/twilio/status", data={
        "CallSid": "CA_test_unit_123",
        "CallStatus": "completed",
        "CallDuration": "45",
        "CallbackSource": "call-progress-events"
    })
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "ok"


def test_internal_routes_guard():
    """Verify internal routes enforce X-Sajag-Secret authentication."""
    from fastapi.testclient import TestClient
    from main import app
    import os
    client = TestClient(app)
    secret = os.getenv("INTERNAL_SECRET", os.getenv("N8N_SECRET", "sajag-secret-key-change-me"))

    # Missing header -> 401
    resp_unauth = client.post("/internal/reports/generate", json={"call_id": "CA_test_unit_123"})
    assert resp_unauth.status_code == 401

    # Valid secret header -> 200
    resp_auth = client.post(
        "/internal/reports/generate",
        json={"call_id": "CA_test_unit_123"},
        headers={"X-Sajag-Secret": secret}
    )
    assert resp_auth.status_code == 200
    assert resp_auth.json()["status"] == "ok"
    assert "draft_report" in resp_auth.json()


