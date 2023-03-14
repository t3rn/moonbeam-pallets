// Copyright 2019-2022 PureStake Inc.
// This file is part of Moonbeam.

// Moonbeam is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Moonbeam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Moonbeam.  If not, see <http://www.gnu.org/licenses/>.

#![cfg_attr(not(feature = "std"), no_std)]
#![feature(assert_matches)]

extern crate alloc;

// Allows to use inside this crate `EvmData` derive macro,which depends on
// `precompile_utils` being in the list of imported crates.
extern crate self as precompile_utils;

pub mod costs;
pub mod handle;
pub mod logs;
pub mod modifier;
pub mod precompile_set;
pub mod substrate;

pub mod solidity;

#[cfg(feature = "testing")]
pub mod testing;

#[cfg(test)]
mod tests;

use fp_evm::PrecompileFailure;

// pub mod data;

// pub use data::{EvmData, Reader, Writer};
pub use fp_evm::Precompile;
pub use precompile_utils_macro::{
	generate_function_selector, keccak256, precompile, precompile_name_from_address,
};

/// Alias for Result returning an EVM precompile error.
pub type EvmResult<T = ()> = Result<T, PrecompileFailure>;

pub mod prelude {
	pub use {
		crate::{
			handle::{with_precompile_handle, PrecompileHandleExt},
			logs::{log0, log1, log2, log3, log4, LogExt},
			modifier::{check_function_modifier, FunctionModifier},
			// We export solidity itself to encourage using `solidity::Codec` to avoid confusion
			// with parity_scale_codec,
			solidity,
			solidity::codec::{
				Address, BoundedBytes, BoundedString, BoundedVec, Convert, Reader, UnboundedBytes,
				UnboundedString, Writer,
			},
			solidity::revert::{
				revert, BacktraceExt, InjectBacktrace, MayRevert, Revert, RevertExt, RevertReason,
			},
			substrate::{RuntimeHelper, TryDispatchError},
			EvmResult,
		},
		alloc::string::String,
		pallet_evm::{PrecompileHandle, PrecompileOutput},
		precompile_utils_macro::{generate_function_selector, keccak256, precompile},
	};
}
