// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SentinelAI audit-anchor registry
/// @notice Stores only a batch hash and timestamp; no identity or biometric data.
contract SentinelAuditAnchor {
    address public owner;

    struct Anchor {
        uint256 timestamp;
        address submittedBy;
    }

    mapping(bytes32 => Anchor) public anchors;

    event AuditAnchored(bytes32 indexed chainHash, uint256 indexed timestamp, address indexed submittedBy);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "SentinelAuditAnchor: unauthorized");
        _;
    }

    constructor(address initialOwner) {
        require(initialOwner != address(0), "SentinelAuditAnchor: zero owner");
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function storeAuditHash(bytes32 chainHash, uint256 timestamp) external onlyOwner {
        require(anchors[chainHash].timestamp == 0, "SentinelAuditAnchor: already anchored");
        anchors[chainHash] = Anchor({timestamp: timestamp, submittedBy: msg.sender});
        emit AuditAnchored(chainHash, timestamp, msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "SentinelAuditAnchor: zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
