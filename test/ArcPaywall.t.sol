// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../contracts/ArcPaywall.sol";

/// Minimal hevm cheatcode interface (no forge-std dependency).
interface Vm {
    function prank(address) external;
    function deal(address, uint256) external;
    function expectRevert(bytes calldata) external;
    function expectEmit(bool, bool, bool, bool) external;
    function label(address, string calldata) external;
}

/// Creator contract whose receive() can be toggled. Used to prove the
/// pendingBalances escrow fallback: with receiving disabled, the creator
/// payout in unlockGate() fails and is credited to escrow instead of
/// reverting; re-enabling receive lets the creator pull via
/// withdrawCreatorEarnings().
contract ToggleReceiver {
    ArcPaywall public paywall;
    bool public accepting;

    constructor(ArcPaywall _p) {
        paywall = _p;
    }

    function setAccepting(bool b) external {
        accepting = b;
    }

    function claimEarnings() external {
        paywall.withdrawCreatorEarnings();
    }

    receive() external payable {
        require(accepting, "not accepting");
    }
}

contract ArcPaywallTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    // Local redeclaration for expectEmit (same signature as ArcPaywall.GateCreated).
    event GateCreated(
        uint256 indexed id,
        address indexed creator,
        string title,
        uint256 priceUsdcWei,
        uint256 timestamp
    );

    ArcPaywall paywall;
    address owner;
    address creator;
    address buyer;
    address stranger;

    uint256 constant PRICE = 1 ether; // test ether stands in for native USDC (18 decimals)
    string constant SECRET = "enc:aes-gcm:deadbeef";

    receive() external payable {}

    // --- minimal assertions (no forge-std) ---
    function assertEq(uint256 a, uint256 b, string memory why) internal {
        require(a == b, string(abi.encodePacked("assertEq(uint256) failed: ", why)));
    }
    function assertEq(address a, address b, string memory why) internal {
        require(a == b, string(abi.encodePacked("assertEq(address) failed: ", why)));
    }
    function assertEq(string memory a, string memory b, string memory why) internal {
        require(
            keccak256(bytes(a)) == keccak256(bytes(b)),
            string(abi.encodePacked("assertEq(string) failed: ", why))
        );
    }
    function assertTrue(bool c, string memory why) internal {
        require(c, string(abi.encodePacked("assertTrue failed: ", why)));
    }
    function assertFalse(bool c, string memory why) internal {
        require(!c, string(abi.encodePacked("assertFalse failed: ", why)));
    }

    function setUp() public {
        paywall = new ArcPaywall();
        owner = address(this);
        creator = address(0xC0EA7E);
        buyer = address(0xB07E);
        stranger = address(0x57A6E);
        vm.deal(creator, 10 ether);
        vm.deal(buyer, 10 ether);
        vm.deal(stranger, 10 ether);
        vm.label(creator, "creator");
        vm.label(buyer, "buyer");
        vm.label(stranger, "stranger");
    }

    function _createGate() internal returns (uint256) {
        vm.prank(creator);
        return paywall.createGate("Demo Gate", "A demo description", SECRET, PRICE);
    }

    // 1. Gate creation stores id, price, creator and starts active.
    function test_CreateGate_SetsIdPriceAndActive() public {
        uint256 id = _createGate();
        assertEq(id, 1, "first gate id");
        assertEq(paywall.gateCount(), 1, "gateCount");
        ArcPaywall.GateView memory g = paywall.getGate(id);
        assertEq(g.creator, creator, "creator");
        assertEq(g.priceUsdcWei, PRICE, "price");
        assertTrue(g.active, "active");
        assertEq(g.unlockCount, 0, "unlockCount");
    }

    // 2. Zero-price gates are rejected.
    function test_CreateGate_RevertsOnZeroPrice() public {
        vm.prank(creator);
        vm.expectRevert(bytes("Price must be > 0"));
        paywall.createGate("T", "D", SECRET, 0);
    }

    // 3. GateCreated event is emitted with the right fields.
    function test_CreateGate_EmitsGateCreated() public {
        vm.expectEmit(true, true, false, true);
        emit GateCreated(1, creator, "Demo Gate", PRICE, block.timestamp);
        vm.prank(creator);
        paywall.createGate("Demo Gate", "D", SECRET, PRICE);
    }

    // 4. A successful unlock pays the creator 99% and accrues 1% protocol fee.
    function test_Unlock_Splits99ToCreator1ToProtocol() public {
        uint256 id = _createGate();
        uint256 creatorBefore = creator.balance;

        vm.prank(buyer);
        paywall.unlockGate{value: PRICE}(id);

        assertEq(creator.balance - creatorBefore, 0.99 ether, "creator got 99%");
        assertEq(paywall.protocolFeesAvailable(), 0.01 ether, "protocol fee 1%");
        assertTrue(paywall.hasUnlocked(id, buyer), "hasUnlocked");
        assertEq(paywall.getGate(id).unlockCount, 1, "unlockCount");
        assertEq(paywall.totalVolumeUsdc(), PRICE, "totalVolumeUsdc");
        assertEq(paywall.totalUnlocksCount(), 1, "totalUnlocksCount");
    }

    // 5. Underpayment reverts.
    function test_Unlock_RevertsOnUnderpayment() public {
        uint256 id = _createGate();
        vm.prank(buyer);
        vm.expectRevert(bytes("Insufficient USDC payment"));
        paywall.unlockGate{value: PRICE - 1}(id);
    }

    // 6. Unlocking a paused gate reverts.
    function test_Unlock_RevertsWhenPaused() public {
        uint256 id = _createGate();
        vm.prank(creator);
        paywall.setGateActive(id, false);
        vm.prank(buyer);
        vm.expectRevert(bytes("Gate is inactive or not found"));
        paywall.unlockGate{value: PRICE}(id);
    }

    // 7. The same buyer cannot unlock the same gate twice.
    function test_Unlock_RevertsOnDoubleUnlock() public {
        uint256 id = _createGate();
        vm.prank(buyer);
        paywall.unlockGate{value: PRICE}(id);
        vm.prank(buyer);
        vm.expectRevert(bytes("Already unlocked"));
        paywall.unlockGate{value: PRICE}(id);
    }

    // 8. Overpayment is refunded; the buyer is charged exactly the price.
    function test_Unlock_RefundsExcessPayment() public {
        uint256 id = _createGate();
        uint256 buyerBefore = buyer.balance;
        vm.prank(buyer);
        paywall.unlockGate{value: PRICE + 0.5 ether}(id);
        assertEq(buyerBefore - buyer.balance, PRICE, "charged exactly price");
        assertEq(paywall.pendingBalances(buyer), 0, "no buyer escrow");
    }

    // 9. Only the owner can withdraw protocol fees; empty withdrawals revert.
    function test_WithdrawProtocolFees_OnlyOwner() public {
        uint256 id = _createGate();
        vm.prank(stranger);
        vm.expectRevert(bytes("Only owner can call"));
        paywall.withdrawProtocolFees();

        vm.prank(buyer);
        paywall.unlockGate{value: PRICE}(id);

        uint256 ownerBefore = owner.balance;
        vm.prank(owner);
        paywall.withdrawProtocolFees();
        assertEq(owner.balance - ownerBefore, 0.01 ether, "owner got fees");
        assertEq(paywall.protocolFeesAvailable(), 0, "fees drained");

        vm.prank(owner);
        vm.expectRevert(bytes("No protocol fees available"));
        paywall.withdrawProtocolFees();
    }

    // 10. If the creator payout transfer fails, funds land in escrow (no revert).
    function test_Unlock_CreatorTransferFailureCreditsEscrow() public {
        ToggleReceiver fussy = new ToggleReceiver(paywall);
        address fussyCreator = address(fussy);
        vm.prank(fussyCreator);
        uint256 id = paywall.createGate("T", "D", SECRET, PRICE);

        vm.prank(buyer);
        paywall.unlockGate{value: PRICE}(id);

        assertEq(paywall.pendingBalances(fussyCreator), 0.99 ether, "creator escrow");
        assertEq(paywall.protocolFeesAvailable(), 0.01 ether, "fee still accrued");
        assertTrue(paywall.hasUnlocked(id, buyer), "unlock still recorded");
    }

    // 11. Escrowed creator earnings are pull-withdrawable and isolated from
    //     protocol fee sweeps.
    function test_WithdrawCreatorEarnings_PullsEscrow() public {
        ToggleReceiver fussy = new ToggleReceiver(paywall);
        address fussyCreator = address(fussy);
        vm.prank(fussyCreator);
        uint256 id = paywall.createGate("T", "D", SECRET, PRICE);
        vm.prank(buyer);
        paywall.unlockGate{value: PRICE}(id);

        // Owner sweeping protocol fees must not touch creator escrow.
        vm.prank(owner);
        paywall.withdrawProtocolFees();
        assertEq(paywall.pendingBalances(fussyCreator), 0.99 ether, "escrow isolated");

        // Creator opts back into receiving and pulls the escrow.
        fussy.setAccepting(true);
        uint256 before = fussyCreator.balance;
        fussy.claimEarnings();
        assertEq(fussyCreator.balance - before, 0.99 ether, "creator withdrew");
        assertEq(paywall.pendingBalances(fussyCreator), 0, "escrow drained");
    }

    // 12. Only the gate creator can change its price; zero price rejected.
    function test_SetGatePrice_AccessControl() public {
        uint256 id = _createGate();
        vm.prank(stranger);
        vm.expectRevert(bytes("Only creator can update price"));
        paywall.setGatePrice(id, 2 ether);
        vm.prank(creator);
        vm.expectRevert(bytes("Price must be > 0"));
        paywall.setGatePrice(id, 0);
        vm.prank(creator);
        paywall.setGatePrice(id, 2 ether);
        assertEq(paywall.getGate(id).priceUsdcWei, 2 ether, "price updated");
    }

    // 13. Tips carry a 0% protocol fee and reach the creator in full.
    function test_TipCreator_ZeroProtocolFee() public {
        uint256 creatorBefore = creator.balance;
        vm.prank(buyer);
        paywall.tipCreator{value: 0.5 ether}(payable(creator), "great stuff");
        assertEq(creator.balance - creatorBefore, 0.5 ether, "full tip received");
        assertEq(paywall.totalTipsCount(), 1, "totalTipsCount");
        assertEq(paywall.protocolFeesAvailable(), 0, "no fee on tips");
    }

    // 14. The secret payload is hidden until the caller is creator or buyer.
    function test_GetGate_HidesSecretUntilUnlock() public {
        uint256 id = _createGate();
        vm.prank(stranger);
        ArcPaywall.GateView memory hidden = paywall.getGate(id);
        assertEq(hidden.secretPayload, "", "secret hidden");
        assertFalse(hidden.isUnlocked, "not unlocked");

        vm.prank(buyer);
        paywall.unlockGate{value: PRICE}(id);
        vm.prank(buyer);
        ArcPaywall.GateView memory revealed = paywall.getGate(id);
        assertEq(revealed.secretPayload, SECRET, "secret revealed to buyer");
        assertTrue(revealed.isUnlocked, "unlocked");

        vm.prank(creator);
        assertEq(paywall.getGate(id).secretPayload, SECRET, "creator sees secret");
    }
}
