// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title  DatasetRegistry
 * @notice Immutable on-chain registry for AI training dataset provenance.
 *         Each dataset is identified by its SHA-256 hash (as bytes32).
 *         Metadata URI points to IPFS / off-chain store.
 *         Risk score (0-100) is set by the DataPassport backend AI.
 *
 * @dev    Deployed on Shardeum Sphinx testnet (chainId 8082).
 */
contract DatasetRegistry {

    // ── Structs ────────────────────────────────────────────────────────────

    struct DatasetRecord {
        address  owner;       // wallet that registered the dataset
        string   metadataUri; // ipfs://CID or https:// link to metadata JSON
        uint8    riskScore;   // 0 = lowest risk, 100 = highest risk
        uint256  timestamp;   // block.timestamp at registration
        bool     exists;      // sentinel for existence checks
        string   name;        // human-readable name (stored for convenience)
    }

    struct ProvenanceEntry {
        address  actor;
        string   action;      // e.g. "Registered", "Updated Risk", "Verified"
        uint256  timestamp;
        string   notes;
    }

    // ── State ──────────────────────────────────────────────────────────────

    /// @notice Registry owner (deployer) — can pause in emergencies
    address public immutable registryOwner;

    /// @notice Maps dataset hash → record
    mapping(bytes32 => DatasetRecord) private _datasets;

    /// @notice Maps dataset hash → ordered provenance entries
    mapping(bytes32 => ProvenanceEntry[]) private _provenance;

    /// @notice All registered hashes, in order (for enumeration)
    bytes32[] private _allHashes;

    /// @notice Count of datasets registered by each address
    mapping(address => uint256) public datasetCountByOwner;

    /// @notice Pause flag — only registryOwner can set
    bool public paused;

    // ── Events ─────────────────────────────────────────────────────────────

    event DatasetRegistered(
        bytes32 indexed datasetHash,
        address indexed owner,
        string  name,
        string  metadataUri,
        uint8   riskScore,
        uint256 timestamp
    );

    event DatasetUpdated(
        bytes32 indexed datasetHash,
        address indexed updater,
        uint8   newRiskScore,
        string  metadataUri,
        uint256 timestamp
    );

    event ProvenanceLogged(
        bytes32 indexed datasetHash,
        address indexed actor,
        string  action,
        uint256 timestamp
    );

    event RegistryPaused(address indexed by, uint256 timestamp);
    event RegistryUnpaused(address indexed by, uint256 timestamp);

    // ── Errors ─────────────────────────────────────────────────────────────

    error AlreadyRegistered(bytes32 datasetHash);
    error NotFound(bytes32 datasetHash);
    error NotOwner(bytes32 datasetHash, address caller);
    error InvalidHash();
    error InvalidRiskScore(uint8 score);
    error RegistryIsPaused();
    error Unauthorized();

    // ── Modifiers ──────────────────────────────────────────────────────────

    modifier whenNotPaused() {
        if (paused) revert RegistryIsPaused();
        _;
    }

    modifier onlyRegistryOwner() {
        if (msg.sender != registryOwner) revert Unauthorized();
        _;
    }

    modifier datasetExists(bytes32 datasetHash) {
        if (!_datasets[datasetHash].exists) revert NotFound(datasetHash);
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────────

    constructor() {
        registryOwner = msg.sender;
    }

    // ── Write functions ────────────────────────────────────────────────────

    /**
     * @notice Register a new dataset. Caller becomes the owner.
     * @param  datasetHash   SHA-256 hash of the dataset metadata (bytes32)
     * @param  name          Human-readable dataset name
     * @param  metadataUri   URI pointing to the full metadata JSON (IPFS/HTTPS)
     * @param  riskScore     AI-computed risk score 0-100
     */
    function registerDataset(
        bytes32 datasetHash,
        string  calldata name,
        string  calldata metadataUri,
        uint8   riskScore
    ) external whenNotPaused {
        if (datasetHash == bytes32(0)) revert InvalidHash();
        if (riskScore > 100) revert InvalidRiskScore(riskScore);
        if (_datasets[datasetHash].exists) revert AlreadyRegistered(datasetHash);

        _datasets[datasetHash] = DatasetRecord({
            owner:       msg.sender,
            metadataUri: metadataUri,
            riskScore:   riskScore,
            timestamp:   block.timestamp,
            exists:      true,
            name:        name
        });

        _allHashes.push(datasetHash);
        datasetCountByOwner[msg.sender]++;

        // First provenance entry
        _provenance[datasetHash].push(ProvenanceEntry({
            actor:     msg.sender,
            action:    "Registered",
            timestamp: block.timestamp,
            notes:     "Initial registration via DataPassport."
        }));

        emit DatasetRegistered(
            datasetHash,
            msg.sender,
            name,
            metadataUri,
            riskScore,
            block.timestamp
        );
    }

    /**
     * @notice Update metadata URI and/or risk score. Only dataset owner.
     * @param  datasetHash  Hash of the dataset to update
     * @param  metadataUri  New URI (pass empty string to keep existing)
     * @param  riskScore    New risk score
     * @param  notes        Human-readable reason for update
     */
    function updateDataset(
        bytes32 datasetHash,
        string  calldata metadataUri,
        uint8   riskScore,
        string  calldata notes
    ) external whenNotPaused datasetExists(datasetHash) {
        DatasetRecord storage record = _datasets[datasetHash];
        if (record.owner != msg.sender) revert NotOwner(datasetHash, msg.sender);
        if (riskScore > 100) revert InvalidRiskScore(riskScore);

        if (bytes(metadataUri).length > 0) {
            record.metadataUri = metadataUri;
        }
        record.riskScore = riskScore;

        _provenance[datasetHash].push(ProvenanceEntry({
            actor:     msg.sender,
            action:    "Updated",
            timestamp: block.timestamp,
            notes:     notes
        }));

        emit DatasetUpdated(
            datasetHash,
            msg.sender,
            riskScore,
            record.metadataUri,
            block.timestamp
        );
    }

    /**
     * @notice Append a custom provenance note. Only dataset owner.
     */
    function logProvenance(
        bytes32 datasetHash,
        string  calldata action,
        string  calldata notes
    ) external whenNotPaused datasetExists(datasetHash) {
        if (_datasets[datasetHash].owner != msg.sender)
            revert NotOwner(datasetHash, msg.sender);

        _provenance[datasetHash].push(ProvenanceEntry({
            actor:     msg.sender,
            action:    action,
            timestamp: block.timestamp,
            notes:     notes
        }));

        emit ProvenanceLogged(datasetHash, msg.sender, action, block.timestamp);
    }

    // ── View functions ─────────────────────────────────────────────────────

    /**
     * @notice Retrieve a dataset record by its hash.
     */
    function getDataset(bytes32 datasetHash)
        external
        view
        datasetExists(datasetHash)
        returns (
            address  owner,
            string   memory name,
            string   memory metadataUri,
            uint8    riskScore,
            uint256  timestamp
        )
    {
        DatasetRecord storage r = _datasets[datasetHash];
        return (r.owner, r.name, r.metadataUri, r.riskScore, r.timestamp);
    }

    /**
     * @notice Check whether a dataset hash is registered.
     */
    function isRegistered(bytes32 datasetHash) external view returns (bool) {
        return _datasets[datasetHash].exists;
    }

    /**
     * @notice Get the full provenance chain for a dataset.
     */
    function getProvenance(bytes32 datasetHash)
        external
        view
        datasetExists(datasetHash)
        returns (ProvenanceEntry[] memory)
    {
        return _provenance[datasetHash];
    }

    /**
     * @notice Total number of registered datasets.
     */
    function totalDatasets() external view returns (uint256) {
        return _allHashes.length;
    }

    /**
     * @notice Get registered hash at a given index (for enumeration).
     */
    function hashAt(uint256 index) external view returns (bytes32) {
        require(index < _allHashes.length, "Index out of bounds");
        return _allHashes[index];
    }

    // ── Admin ──────────────────────────────────────────────────────────────

    function pause() external onlyRegistryOwner {
        paused = true;
        emit RegistryPaused(msg.sender, block.timestamp);
    }

    function unpause() external onlyRegistryOwner {
        paused = false;
        emit RegistryUnpaused(msg.sender, block.timestamp);
    }
}
