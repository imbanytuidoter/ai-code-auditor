"""
Tests for AICodeAuditor Intelligent Contract
Run with: cd test && python -m pytest -v
Requires: pip install genlayer-testing
"""

import pytest
import json
from genlayer import Address

# Vulnerable Solidity contract for testing
VULNERABLE_CONTRACT = """
pragma solidity ^0.8.0;

contract VulnerableVault {
    mapping(address => uint256) public balances;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        // Reentrancy: external call before state update
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount;
    }

    // No access control
    function emergencyWithdraw() public {
        payable(msg.sender).transfer(address(this).balance);
    }

    // tx.origin auth
    function adminTransfer(address to, uint256 amount) public {
        require(tx.origin == owner, "Not owner");
        payable(to).transfer(amount);
    }
}
"""

SAFE_CONTRACT = """
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecureVault is ReentrancyGuard, Ownable {
    mapping(address => uint256) private _balances;

    constructor() Ownable(msg.sender) {}

    function deposit() external payable {
        require(msg.value > 0);
        _balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(_balances[msg.sender] >= amount);
        _balances[msg.sender] -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok);
    }

    function balanceOf(address user) external view returns (uint256) {
        return _balances[user];
    }
}
"""

SHORT_CODE = "// too short"

DEFAULT_POLICY = "Check all vulnerability categories thoroughly."


@pytest.fixture(scope="module")
def contract():
    """Deploy the contract for testing"""
    try:
        from genlayer.testing import ContractRunner
    except ImportError:
        pytest.skip("genlayer-testing not installed. Run: pip install genlayer-testing")

    runner = ContractRunner("contracts/ai_code_auditor.py")
    runner.deploy([])
    return runner


# ─────────────────────────────────────────────────────────────
# Test 1: Reject empty code
# ─────────────────────────────────────────────────────────────
def test_reject_empty_code(contract):
    with pytest.raises(Exception, match="too short|empty"):
        contract.call("submit_audit", ["audit-empty", "", DEFAULT_POLICY])


# ─────────────────────────────────────────────────────────────
# Test 2: Reject duplicate submission ID
# ─────────────────────────────────────────────────────────────
def test_reject_duplicate_id(contract):
    contract.call("submit_audit", ["audit-dup", VULNERABLE_CONTRACT, DEFAULT_POLICY])
    with pytest.raises(Exception, match="already exists"):
        contract.call("submit_audit", ["audit-dup", VULNERABLE_CONTRACT, DEFAULT_POLICY])


# ─────────────────────────────────────────────────────────────
# Test 3: Vulnerable contract gets high/critical risk score
# ─────────────────────────────────────────────────────────────
def test_vulnerable_contract_high_risk(contract):
    contract.call("submit_audit", ["audit-vuln", VULNERABLE_CONTRACT, DEFAULT_POLICY])
    report = contract.call("get_report", ["audit-vuln"])

    assert "error" not in report, f"Unexpected error: {report}"
    assert report["risk_score"] >= 6, f"Expected high risk, got {report['risk_score']}"
    assert report["safe_to_deploy"] is False
    assert report["overall_risk"] in ("high", "critical")


# ─────────────────────────────────────────────────────────────
# Test 4: Vulnerable contract has reentrancy finding
# ─────────────────────────────────────────────────────────────
def test_vulnerable_has_reentrancy(contract):
    # Reuse audit-vuln from previous test
    findings = contract.call("get_findings", ["audit-vuln"])
    assert isinstance(findings, list)

    categories = [f["category"] for f in findings]
    severities = [f["severity"] for f in findings]

    # Should detect reentrancy
    assert "reentrancy" in categories, f"Expected reentrancy, found: {categories}"

    # Should have at least one high or critical
    assert any(s in ("high", "critical") for s in severities), \
        f"Expected high/critical findings, got: {severities}"


# ─────────────────────────────────────────────────────────────
# Test 5: Safe contract has low risk
# ─────────────────────────────────────────────────────────────
def test_safe_contract_low_risk(contract):
    contract.call("submit_audit", ["audit-safe", SAFE_CONTRACT, DEFAULT_POLICY])
    report = contract.call("get_report", ["audit-safe"])

    assert "error" not in report
    assert report["risk_score"] <= 4, f"Expected low risk, got {report['risk_score']}"
    assert report["overall_risk"] in ("low", "medium")


# ─────────────────────────────────────────────────────────────
# Test 6: Report structure is correct
# ─────────────────────────────────────────────────────────────
def test_report_structure(contract):
    report = contract.call("get_report", ["audit-vuln"])

    required_fields = [
        "submission_id", "submitter",
        "language", "overall_risk", "risk_score",
        "safe_to_deploy", "summary", "findings_count",
        "critical_count", "high_count", "medium_count",
        "low_count", "status"
    ]
    for field in required_fields:
        assert field in report, f"Missing field: {field}"

    assert report["submission_id"] == "audit-vuln"
    assert report["status"] == "accepted"
    assert isinstance(report["risk_score"], int)
    assert 0 <= report["risk_score"] <= 10


# ─────────────────────────────────────────────────────────────
# Test 7: Findings structure is correct
# ─────────────────────────────────────────────────────────────
def test_findings_structure(contract):
    findings = contract.call("get_findings", ["audit-vuln"])
    assert isinstance(findings, list)

    for f in findings:
        assert "id" in f
        assert "severity" in f
        assert f["severity"] in ("critical", "high", "medium", "low", "info")
        assert "category" in f
        assert "title" in f
        assert "location" in f
        assert "description" in f
        assert "recommendation" in f
        assert len(f["description"]) > 10
        assert len(f["recommendation"]) > 10


# ─────────────────────────────────────────────────────────────
# Test 8: get_all_reports returns list
# ─────────────────────────────────────────────────────────────
def test_get_all_reports(contract):
    reports = contract.call("get_all_reports", [])
    assert isinstance(reports, list)
    assert len(reports) >= 2  # we submitted at least audit-vuln and audit-safe

    ids = [r["submission_id"] for r in reports]
    assert "audit-vuln" in ids
    assert "audit-safe" in ids


# ─────────────────────────────────────────────────────────────
# Test 9: Audit count increases
# ─────────────────────────────────────────────────────────────
def test_audit_count(contract):
    count_before = contract.call("get_audit_count", [])
    contract.call("submit_audit", ["audit-count-test", SAFE_CONTRACT, DEFAULT_POLICY])
    count_after = contract.call("get_audit_count", [])
    assert count_after == count_before + 1


# ─────────────────────────────────────────────────────────────
# Test 10: Missing report returns error
# ─────────────────────────────────────────────────────────────
def test_missing_report(contract):
    result = contract.call("get_report", ["nonexistent-id"])
    assert "error" in result


# ─────────────────────────────────────────────────────────────
# Test 11: Language detection
# ─────────────────────────────────────────────────────────────
def test_language_detection_solidity(contract):
    report = contract.call("get_report", ["audit-vuln"])
    assert report["language"].lower() in ("solidity", "unknown"), \
        f"Expected solidity, got {report['language']}"
