// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.3;

/// @dev The Multisig contract's address.
address constant MULTISIG_ADDRESS = 0x0000000000000000000000000000000000000903;

/// @dev The Multisig contract's instance.
Multisig constant MULTISIG_CONTRACT = Multisig(MULTISIG_ADDRESS);

/// @author The Moonbeam Team
/// @title Pallet Multisig Interface
/// @custom:address 0x0000000000000000000000000000000000000903
interface Multisig {

    /// Create a new multisig account 
    /// @custom:selector 9d1c184a
    /// @return New multisig created combining msg.sender address and otherSignatories addresses
    function multiAccountId(address[] memory otherSignatories, uint16 threshold) external returns (address);

    /// Dispatch a multi-signature call using a single approval from the caller
    /// @custom:selector f9bcdd45
    function asMultiThreshold1(address[] memory otherSignatories, bytes memory call) external;

    /// Register approval for a dispatch to be made from a deterministic composite account if
	/// approved by a total of `threshold - 1` of `other_signatories`.
    /// @custom:selector afd1426e
    function asMulti(
        address[] memory otherSignatories, 
        uint16 threshold, 
        uint32 height, 
        uint32 index, 
        bytes memory call, 
        uint64 refTime, 
        uint64 proofSize
    ) external;



}