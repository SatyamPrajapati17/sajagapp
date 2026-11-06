"""
Sajag AI — Seed Script for Demo Data.
Seeds 2 past scam calls sharing the same UPI ("mule.account@sbi")
and 1 benign call to demonstrate the cross-incident overlap graph and wall metrics.
"""

import os
import sys
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from store import create_or_init_call, update_call, save_turn, save_risk, upsert_identifier, MEM, USE_REAL_SUPABASE

def seed():
    print("[*] Seeding demo calls and intelligence records...")

    # Call 1: Past CBI Digital Arrest (Shared UPI: mule.account@sbi)
    c1_id = "call-past-cbi-01"
    create_or_init_call(c1_id, channel="phone", from_num="+919811223344", to_num="+919876543210")
    update_call(c1_id, {
        "state": "ENDED",
        "p_scam": 0.94,
        "risk_level": "CRITICAL",
        "scam_category": "DIGITAL_ARREST",
        "signals": ["authority", "threat", "demand", "secrecy"],
        "decoy_seconds": 184,
        "duration_s": 240,
        "script_fp": "cbi-arrest-v1",
        "summary": "Scammer impersonated CBI Officer Rathore threatening immediate arrest. Decoy engaged for 3m 4s and captured UPI."
    })
    save_turn(c1_id, 1, "caller", "I am CBI Officer. Transfer Rs 20000 to verify account mule.account@sbi or go to jail.")
    save_turn(c1_id, 2, "agent", "Sahab main diary mein likh raha hoon, spelling boliye.")
    upsert_identifier(c1_id, 1, "upi", "mule.account@sbi", "mule.account@sbi", True, "transfer to mule.account@sbi")
    upsert_identifier(c1_id, 1, "phone", "+919811223344", "+919811223344", True, "from number")
    upsert_identifier(c1_id, 1, "case_no", "CBI/2026/894", "CBI/2026/894", True, "FIR CBI/2026/894")

    # Call 2: Fake Customs Parcel (Shares same UPI: mule.account@sbi)
    c2_id = "call-past-customs-02"
    create_or_init_call(c2_id, channel="phone", from_num="+919722334455", to_num="+919876543210")
    update_call(c2_id, {
        "state": "ENDED",
        "p_scam": 0.91,
        "risk_level": "CRITICAL",
        "scam_category": "TRAI_SIM_BLOCK",
        "signals": ["authority", "urgency", "demand"],
        "decoy_seconds": 142,
        "duration_s": 190,
        "script_fp": "customs-parcel-v1",
        "summary": "Caller claimed customs seizure at airport, demanding clearance duty into the same mule UPI."
    })
    save_turn(c2_id, 1, "caller", "Delhi Airport Customs. Pay custom duty immediately to mule.account@sbi.")
    save_turn(c2_id, 2, "agent", "Bahu market gayi hai sahab, mobile app chal nahi raha.")
    upsert_identifier(c2_id, 1, "upi", "mule.account@sbi", "mule.account@sbi", True, "duty to mule.account@sbi")
    upsert_identifier(c2_id, 1, "phone", "+919722334455", "+919722334455", True, "customs hotline")

    # Call 3: Benign Bank Inquiry Call
    c3_id = "call-past-benign-03"
    create_or_init_call(c3_id, channel="phone", from_num="+911800112211", to_num="+919876543210")
    update_call(c3_id, {
        "state": "ENDED",
        "p_scam": 0.08,
        "risk_level": "LOW",
        "scam_category": "BENIGN",
        "signals": [],
        "decoy_seconds": 0,
        "duration_s": 45,
        "summary": "State Bank automated balance alert call. No intervention required."
    })
    save_turn(c3_id, 1, "caller", "This is State Bank balance enquiry. Your balance is 24500 rupees.")
    save_turn(c3_id, 2, "agent", "Haan ji theek hai, dhanyavaad.")

    print(f"[SUCCESS] Seeded 3 calls into store. Active calls count: {len(MEM.calls)}")


if __name__ == "__main__":
    seed()

