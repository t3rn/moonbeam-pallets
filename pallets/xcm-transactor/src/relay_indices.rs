use parity_scale_codec::{Decode, Encode};
use scale_info::TypeInfo;

// NEED to be implement {Stake, Hrmp, Utility}EncodeCall somewhere in runtime using these locally stored indices
// s.t. fallback is using the hardcoded ones
// so add to relay-encoder a common impl which uses the stored indices or the others as fallback?

#[derive(Encode, Decode, TypeInfo)]
pub struct RelayIndices {
	pub pallets: PalletIndices,
	pub extrinsics: ExtrinsicIndices,
}

#[derive(Encode, Decode, TypeInfo)]
pub struct PalletIndices {
	pub staking: u8,
	pub utility: u8,
	pub hrmp: u8,
}

#[derive(Encode, Decode, TypeInfo)]
pub struct ExtrinsicIndices {
	pub staking: StakingIndices,
	pub utility: UtilityIndices,
	pub hrmp: HrmpIndices,
}

#[derive(Encode, Decode, TypeInfo)]
pub struct UtilityIndices {
	pub as_derivative: u8,
}

#[derive(Encode, Decode, TypeInfo)]
pub struct StakingIndices {
	pub bond: u16,
	pub bond_extra: u16,
	pub unbond: u16,
	pub withdraw_unbonded: u16,
	pub validate: u16,
	pub nominate: u16,
	pub chill: u16,
	pub set_payee: u16,
	pub set_controller: u16,
	pub rebond: u16,
}

#[derive(Encode, Decode, TypeInfo)]
pub struct HrmpIndices {
	pub init_open_channel: u8,
	pub accept_open_channel: u8,
	pub close_channel: u8,
}
