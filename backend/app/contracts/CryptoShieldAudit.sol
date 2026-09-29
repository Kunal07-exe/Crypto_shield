// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CryptoShieldAudit
 * @dev Immutable on-chain audit and evidence anchoring ledger for CryptoShield.
 * Implements security requirements: reentrancy-safe, integer-overflow resistant (Solidity >= 0.8),
 * role-governed authorization, and tamper-evident cryptographic fingerprint storage.
 */
contract CryptoShieldAudit {
    address public owner;
    
    struct InvestigationRecord {
        string caseId;
        string txHash;
        uint256 riskScore;
        string evidenceHash;     // SHA-256 fingerprint of investigation package
        uint256 timestamp;
        address recordedBy;
        string primaryClassification;
        bool exists;
    }

    // Mapping from caseId => list of record IDs
    mapping(string => bytes32[]) private _caseRecordIds;
    // Mapping from recordId (keccak256(caseId, evidenceHash)) => InvestigationRecord
    mapping(bytes32 => InvestigationRecord) public records;
    // Array of all record IDs for global public auditability
    bytes32[] public allRecordIds;

    // Authorized investigator registries
    mapping(address => bool) public authorizedInvestigators;

    event InvestigationRecorded(
        bytes32 indexed recordId,
        string indexed caseId,
        string txHash,
        uint256 riskScore,
        string evidenceHash,
        uint256 timestamp,
        address recordedBy
    );

    event InvestigatorAuthorized(address indexed investigator, bool authorized);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only CryptoShield owner can execute");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedInvestigators[msg.sender], "Unauthorized investigator");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedInvestigators[msg.sender] = true;
    }

    function setInvestigatorAuthorization(address investigator, bool authorized) external onlyOwner {
        require(investigator != address(0), "Invalid address");
        authorizedInvestigators[investigator] = authorized;
        emit InvestigatorAuthorized(investigator, authorized);
    }

    /**
     * @notice Records an investigation audit event on the blockchain.
     * @param caseId Unique case reference (e.g. CR-2026-00182)
     * @param txHash Target cryptocurrency transaction hash
     * @param riskScore Calculated risk score (0-100)
     * @param evidenceHash SHA-256 cryptographic hash of the off-chain evidence bundle
     * @param primaryClassification Category of detected fraud / pattern
     */
    function recordInvestigation(
        string calldata caseId,
        string calldata txHash,
        uint256 riskScore,
        string calldata evidenceHash,
        string calldata primaryClassification
    ) external onlyAuthorized returns (bytes32) {
        require(bytes(caseId).length > 0, "Case ID required");
        require(bytes(evidenceHash).length == 64, "Evidence hash must be 64-char SHA-256 hex");
        require(riskScore <= 100, "Risk score must be 0-100");

        bytes32 recordId = keccak256(abi.encodePacked(caseId, evidenceHash, block.timestamp, msg.sender));
        require(!records[recordId].exists, "Record already exists");

        records[recordId] = InvestigationRecord({
            caseId: caseId,
            txHash: txHash,
            riskScore: riskScore,
            evidenceHash: evidenceHash,
            timestamp: block.timestamp,
            recordedBy: msg.sender,
            primaryClassification: primaryClassification,
            exists: true
        });

        _caseRecordIds[caseId].push(recordId);
        allRecordIds.push(recordId);

        emit InvestigationRecorded(
            recordId,
            caseId,
            txHash,
            riskScore,
            evidenceHash,
            block.timestamp,
            msg.sender
        );

        return recordId;
    }

    /**
     * @notice Verifies if a given evidence hash and case ID exist immutably on-chain.
     */
    function verifyEvidence(string calldata caseId, string calldata evidenceHash) external view returns (bool, uint256, address) {
        bytes32[] memory ids = _caseRecordIds[caseId];
        for (uint256 i = 0; i < ids.length; i++) {
            InvestigationRecord memory rec = records[ids[i]];
            if (keccak256(bytes(rec.evidenceHash)) == keccak256(bytes(evidenceHash))) {
                return (true, rec.timestamp, rec.recordedBy);
            }
        }
        return (false, 0, address(0));
    }

    function getCaseRecordCount(string calldata caseId) external view returns (uint256) {
        return _caseRecordIds[caseId].length;
    }

    function getTotalRecordCount() external view returns (uint256) {
        return allRecordIds.length;
    }
}
