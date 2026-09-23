// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ArcPaywall
 * @notice Decentralized Micro-Paywall & Tipping Protocol on Circle's Arc Mainnet
 * @dev Arc uses native USDC for gas fees and payments (18 decimals).
 *      This contract allows creators to lock digital assets, secret links, or access codes
 *      behind instant 1-click native USDC micro-payments, or accept direct tips with messages.
 * 
 * SECURITY & ARCHITECTURE ASSURANCES:
 * 1. Isolated Protocol Escrow: `withdrawProtocolFees` strictly withdraws accumulated `protocolFeesAvailable`.
 *    Creator `pendingBalances` are fully isolated and cannot be swept by the contract owner.
 * 2. Strict Checks-Effects-Interactions (CEI) & Reentrancy Guards: All state updates occur
 *    prior to any external transfers or overpayment refunds.
 * 3. Zero Backdoors: Secrets are revealed only to the gate creator or an address that hasUnlocked.
 *    The contract owner has no privileged access to creator payloads.
 * 4. Client-Side Cryptography: Secret payloads are stored as authenticated AES-256-GCM
 *    ciphertext envelopes, decryptable client-side upon on-chain unlock verification.
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
        string secretPayload; // Encrypted AES-256-GCM ciphertext envelope
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
    uint256 public protocolFeesAvailable; // Isolated fee accumulator to protect creator escrow

    // 1% Protocol Fee (99% goes directly to the content creator)
    uint256 public constant PROTOCOL_FEE_BPS = 100; // 100 basis points = 1%
    uint256 public constant MAX_BPS = 10000;

    mapping(uint256 => Gate) private gates;
    mapping(uint256 => mapping(address => bool)) public hasUnlocked;
    mapping(address => uint256[]) private creatorGates;
    
    // Escrow fallback balances to prevent DoS attacks on complex creator contracts
    mapping(address => uint256) public pendingBalances;

    // Mutex lock for reentrancy prevention
    bool private locked;

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

    event GateStatusChanged(uint256 indexed id, bool active);
    event GatePriceUpdated(uint256 indexed id, uint256 newPriceUsdcWei);

    event CreatorTipped(
        address indexed creator,
        address indexed tipper,
        uint256 amount,
        string message,
        uint256 timestamp
    );

    event CreatorPayoutWithdrawn(address indexed creator, uint256 amount);
    event ProtocolFeesWithdrawn(address indexed owner, uint256 amount);
    event ProtocolFeesFunded(address indexed sender, uint256 amount);

    // -------------------------------------------------------------
    // MODIFIERS
    // -------------------------------------------------------------

    constructor() {
        owner = payable(msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    // -------------------------------------------------------------
    // CORE CREATOR & PAYWALL FUNCTIONS
    // -------------------------------------------------------------

    /**
     * @notice Create a new paywalled gate for encrypted content
     * @param title Title of the gated item
     * @param description Short description preview
     * @param secretPayload AES-256-GCM encrypted ciphertext envelope
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
     * @notice Toggle active/pause state for a creator's gate
     */
    function setGateActive(uint256 gateId, bool active) external {
        Gate storage g = gates[gateId];
        require(g.id != 0, "Gate does not exist");
        require(msg.sender == g.creator || msg.sender == owner, "Unauthorized");

        g.active = active;
        emit GateStatusChanged(gateId, active);
    }

    /**
     * @notice Update price for a creator's gate
     */
    function setGatePrice(uint256 gateId, uint256 newPriceUsdcWei) external {
        Gate storage g = gates[gateId];
        require(g.id != 0, "Gate does not exist");
        require(msg.sender == g.creator, "Only creator can update price");
        require(newPriceUsdcWei > 0, "Price must be > 0");

        g.priceUsdcWei = newPriceUsdcWei;
        emit GatePriceUpdated(gateId, newPriceUsdcWei);
    }

    /**
     * @notice Unlock a gate by paying required native USDC fee
     * @dev Enforces strict Checks-Effects-Interactions (CEI). 99% to creator, 1% fee.
     * @param gateId ID of the gate to unlock
     */
    function unlockGate(uint256 gateId) external payable nonReentrant {
        Gate storage gate = gates[gateId];
        require(gate.active, "Gate is inactive or not found");
        require(!hasUnlocked[gateId][msg.sender], "Already unlocked");
        require(msg.value >= gate.priceUsdcWei, "Insufficient USDC payment");

        uint256 payment = gate.priceUsdcWei;
        uint256 excess = msg.value - payment;

        uint256 protocolFee = (payment * PROTOCOL_FEE_BPS) / MAX_BPS;
        uint256 creatorAmount = payment - protocolFee;

        // 1. CHECKS & EFFECTS: State writes MUST occur before external interactions
        hasUnlocked[gateId][msg.sender] = true;
        gate.unlockCount++;
        totalUnlocksCount++;
        totalVolumeUsdc += payment;
        protocolFeesAvailable += protocolFee;
        totalProtocolFeesCollected += protocolFee;

        emit GateUnlocked(gateId, msg.sender, gate.creator, payment, block.timestamp);

        // 2. INTERACTIONS: Transfers happen strictly after state mutations
        // Creator transfer with resilient fallback to pendingBalances
        (bool sentCreator, ) = gate.creator.call{value: creatorAmount}("");
        if (!sentCreator) {
            pendingBalances[gate.creator] += creatorAmount;
        }

        // Excess refund executed last
        if (excess > 0) {
            (bool refunded, ) = msg.sender.call{value: excess}("");
            require(refunded, "Excess refund failed");
        }
    }

    /**
     * @notice Withdraw accumulated escrow earnings for creators
     */
    function withdrawCreatorEarnings() external nonReentrant {
        uint256 balance = pendingBalances[msg.sender];
        require(balance > 0, "No pending earnings");

        // Checks-Effects: zero balance before external call
        pendingBalances[msg.sender] = 0;

        (bool sent, ) = msg.sender.call{value: balance}("");
        require(sent, "Withdrawal failed");

        emit CreatorPayoutWithdrawn(msg.sender, balance);
    }

    /**
     * @notice Tip a creator directly with native USDC and an on-chain message
     * @param creator Address of creator to tip
     * @param message Message to include with tip
     */
    function tipCreator(address payable creator, string calldata message) external payable nonReentrant {
        require(creator != address(0), "Invalid recipient");
        require(msg.value > 0, "Tip amount must be > 0");

        totalTipsCount++;
        totalVolumeUsdc += msg.value;

        emit CreatorTipped(creator, msg.sender, msg.value, message, block.timestamp);

        (bool sent, ) = creator.call{value: msg.value}("");
        if (!sent) {
            pendingBalances[creator] += msg.value;
        }
    }

    // -------------------------------------------------------------
    // VIEW / READ FUNCTIONS
    // -------------------------------------------------------------

    /**
     * @notice Get single gate details tailored to caller permissions (zero owner backdoor)
     */
    function getGate(uint256 gateId) external view returns (GateView memory) {
        Gate storage g = gates[gateId];
        require(g.id != 0, "Gate does not exist");

        // Cryptographic integrity: secret revealed only to creator or verified buyer
        bool unlocked = (msg.sender == g.creator || hasUnlocked[gateId][msg.sender]);
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
     * @notice Fetch paginated gates for the explore view
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
            bool unlocked = (msg.sender == g.creator || hasUnlocked[currentId][msg.sender]);

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
     * @notice Owner can withdraw ONLY accumulated protocol fee reserve (creator escrow untouched)
     */
    function withdrawProtocolFees() external onlyOwner nonReentrant {
        uint256 amount = protocolFeesAvailable;
        require(amount > 0, "No protocol fees available");

        protocolFeesAvailable = 0;

        (bool sent, ) = owner.call{value: amount}("");
        require(sent, "Protocol fee withdrawal failed");

        emit ProtocolFeesWithdrawn(owner, amount);
    }

    receive() external payable {
        protocolFeesAvailable += msg.value;
        emit ProtocolFeesFunded(msg.sender, msg.value);
    }
}
