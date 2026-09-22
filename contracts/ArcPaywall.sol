// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ArcPaywall
 * @notice Decentralized Micro-Paywall & Tipping Protocol on Circle's Arc Mainnet
 * @dev Arc uses native USDC for gas fees and payments (18 decimals).
 *      This contract allows creators to lock digital assets, secret links, or access codes
 *      behind instant 1-click native USDC micro-payments, or accept direct tips with messages.
 */
contract ArcPaywall {
    // -------------------------------------------------------------
    // DATA STRUCTURES & STORAGE
    // -------------------------------------------------------------

    struct Gate {
        uint256 id;
        address payable creator;
        string title;
        string description;
        string secretPayload; // Secret link, access token, or alpha info
        uint256 priceUsdcWei; // Price in native Arc USDC (18 decimals: 1 USDC = 1e18)
        uint256 unlockCount;
        uint256 createdAt;
        bool active;
    }

    struct GateView {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 priceUsdcWei;
        uint256 unlockCount;
        uint256 createdAt;
        bool active;
        bool isUnlocked;
        string secretPayload; // Empty string if not unlocked by caller
    }

    address payable public immutable owner;
    uint256 public gateCount;
    uint256 public totalVolumeUsdc;
    uint256 public totalUnlocksCount;
    uint256 public totalTipsCount;
    uint256 public totalProtocolFeesCollected;

    // 1% Protocol Fee (99% goes instantly to the content creator)
    uint256 public constant PROTOCOL_FEE_BPS = 100; // 100 basis points = 1%
    uint256 public constant MAX_BPS = 10000;

    mapping(uint256 => Gate) private gates;
    mapping(uint256 => mapping(address => bool)) public hasUnlocked;
    mapping(address => uint256[]) private creatorGates;

    // -------------------------------------------------------------
    // EVENTS
    // -------------------------------------------------------------

    event GateCreated(
        uint256 indexed id,
        address indexed creator,
        string title,
        uint256 priceUsdcWei,
        uint256 timestamp
    );

    event GateUnlocked(
        uint256 indexed id,
        address indexed buyer,
        address indexed creator,
        uint256 amountPaid,
        uint256 timestamp
    );

    event CreatorTipped(
        address indexed creator,
        address indexed tipper,
        uint256 amount,
        string message,
        uint256 timestamp
    );

    event ProtocolFeesWithdrawn(address indexed owner, uint256 amount);

    // -------------------------------------------------------------
    // CONSTRUCTOR & MODIFIERS
    // -------------------------------------------------------------

    constructor() {
        owner = payable(msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    // -------------------------------------------------------------
    // CORE CREATOR & PAYWALL FUNCTIONS
    // -------------------------------------------------------------

    /**
     * @notice Create a new paywalled gate for a secret URL or content
     * @param title Title of the gated item
     * @param description Short description preview
     * @param secretPayload The hidden URL, API key, passcord, or private text
     * @param priceUsdcWei Access fee in native USDC units (18 decimals)
     */
    function createGate(
        string calldata title,
        string calldata description,
        string calldata secretPayload,
        uint256 priceUsdcWei
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(bytes(secretPayload).length > 0, "Secret content required");

        gateCount++;
        uint256 newGateId = gateCount;

        gates[newGateId] = Gate({
            id: newGateId,
            creator: payable(msg.sender),
            title: title,
            description: description,
            secretPayload: secretPayload,
            priceUsdcWei: priceUsdcWei,
            unlockCount: 0,
            createdAt: block.timestamp,
            active: true
        });

        creatorGates[msg.sender].push(newGateId);

        emit GateCreated(newGateId, msg.sender, title, priceUsdcWei, block.timestamp);
        return newGateId;
    }

    /**
     * @notice Unlock a gate by paying the required native USDC fee
     * @dev 99% sent directly to creator immediately. 1% retained as protocol fee.
     * @param gateId ID of the gate to unlock
     */
    function unlockGate(uint256 gateId) external payable {
        Gate storage gate = gates[gateId];
        require(gate.active, "Gate is inactive or not found");
        require(!hasUnlocked[gateId][msg.sender], "Already unlocked");
        require(msg.value >= gate.priceUsdcWei, "Insufficient USDC payment");

        hasUnlocked[gateId][msg.sender] = true;
        gate.unlockCount++;
        totalUnlocksCount++;
        totalVolumeUsdc += msg.value;

        uint256 protocolFee = (msg.value * PROTOCOL_FEE_BPS) / MAX_BPS;
        uint256 creatorAmount = msg.value - protocolFee;
        totalProtocolFeesCollected += protocolFee;

        // Forward payment directly to creator
        (bool sentCreator, ) = gate.creator.call{value: creatorAmount}("");
        require(sentCreator, "Creator payout failed");

        emit GateUnlocked(gateId, msg.sender, gate.creator, msg.value, block.timestamp);
    }

    /**
     * @notice Tip a creator directly with native USDC and an on-chain message
     * @param creator Address of creator to tip
     * @param message Message to include with tip
     */
    function tipCreator(address payable creator, string calldata message) external payable {
        require(creator != address(0), "Invalid recipient");
        require(msg.value > 0, "Tip amount must be > 0");

        totalTipsCount++;
        totalVolumeUsdc += msg.value;

        // 100% of tips go directly to creator
        (bool sent, ) = creator.call{value: msg.value}("");
        require(sent, "Tip transfer failed");

        emit CreatorTipped(creator, msg.sender, msg.value, message, block.timestamp);
    }

    // -------------------------------------------------------------
    // VIEW / READ FUNCTIONS
    // -------------------------------------------------------------

    /**
     * @notice Get single gate details tailored to caller permissions
     */
    function getGate(uint256 gateId) external view returns (GateView memory) {
        Gate storage g = gates[gateId];
        require(g.id != 0, "Gate does not exist");

        bool unlocked = (msg.sender == g.creator || hasUnlocked[gateId][msg.sender] || msg.sender == owner);
        string memory payload = unlocked ? g.secretPayload : "";

        return GateView({
            id: g.id,
            creator: g.creator,
            title: g.title,
            description: g.description,
            priceUsdcWei: g.priceUsdcWei,
            unlockCount: g.unlockCount,
            createdAt: g.createdAt,
            active: g.active,
            isUnlocked: unlocked,
            secretPayload: payload
        });
    }

    /**
     * @notice Fetch paginated gates for the frontend explore view
     */
    function getRecentGates(uint256 offset, uint256 limit) external view returns (GateView[] memory) {
        if (gateCount == 0 || offset >= gateCount) {
            return new GateView[](0);
        }

        uint256 total = gateCount - offset;
        if (total > limit) {
            total = limit;
        }

        GateView[] memory result = new GateView[](total);
        for (uint256 i = 0; i < total; i++) {
            uint256 currentId = gateCount - offset - i;
            Gate storage g = gates[currentId];
            bool unlocked = (msg.sender == g.creator || hasUnlocked[currentId][msg.sender] || msg.sender == owner);

            result[i] = GateView({
                id: g.id,
                creator: g.creator,
                title: g.title,
                description: g.description,
                priceUsdcWei: g.priceUsdcWei,
                unlockCount: g.unlockCount,
                createdAt: g.createdAt,
                active: g.active,
                isUnlocked: unlocked,
                secretPayload: unlocked ? g.secretPayload : ""
            });
        }
        return result;
    }

    /**
     * @notice Fetch protocol overview metrics
     */
    function getProtocolStats() external view returns (
        uint256 totalGates,
        uint256 totalUnlocks,
        uint256 totalTips,
        uint256 totalVolume
    ) {
        return (gateCount, totalUnlocksCount, totalTipsCount, totalVolumeUsdc);
    }

    /**
     * @notice Owner can withdraw accumulated protocol fee reserve
     */
    function withdrawProtocolFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees available");

        (bool sent, ) = owner.call{value: balance}("");
        require(sent, "Withdrawal failed");

        emit ProtocolFeesWithdrawn(owner, balance);
    }

    receive() external payable {
        // Accept incoming native USDC
    }
}
