import "@moonbeam-network/api-augment/moonbase";
import { u128 } from "@polkadot/types";
import { BN, hexToU8a, u8aToHex } from "@polkadot/util";
import { expect, DevModeContext } from "@moonwall/cli";
import { ApiPromise } from "@polkadot/api";
import { blake2AsU8a, xxhashAsU8a } from "@polkadot/util-crypto";
import { KeyringPair } from "@polkadot/keyring/types";
import type { PalletAssetsAssetAccount, PalletAssetsAssetDetails } from "@polkadot/types/lookup";
import type { AccountId20 } from "@polkadot/types/interfaces/runtime";

export const DUMMY_REVERT_BYTECODE = "0x60006000fd";
export const RELAY_SOURCE_LOCATION = { Xcm: { parents: 1, interior: "Here" } };
export const RELAY_SOURCE_LOCATION2 = { Xcm: { parents: 2, interior: "Here" } };
export const RELAY_V3_SOURCE_LOCATION = { V3: { parents: 1, interior: "Here" } } as any;
export const PARA_1000_SOURCE_LOCATION = {
  Xcm: { parents: 1, interior: { X1: { Parachain: 1000 } } },
};
export const PARA_2000_SOURCE_LOCATION = {
  Xcm: { parents: 1, interior: { X1: { Parachain: 2000 } } },
};
export const PARA_1001_SOURCE_LOCATION = {
  Xcm: { parents: 1, interior: { X1: { Parachain: 1001 } } },
};

export interface AssetMetadata {
  name: string;
  symbol: string;
  decimals: BN;
  isFrozen: boolean;
}

export const relayAssetMetadata: AssetMetadata = {
  name: "DOT",
  symbol: "DOT",
  decimals: new BN(12),
  isFrozen: false,
};

export async function mockAssetBalance(
  context: DevModeContext,
  assetBalance: PalletAssetsAssetAccount,
  assetDetails: PalletAssetsAssetDetails,
  sudoAccount: KeyringPair,
  assetId: u128,
  account: string | AccountId20,
  is_sufficient = false
) {
  const api = context.polkadotJs({ type: "moon" });
  // Register the asset
  await context.createBlock(
    api.tx.sudo
      .sudo(
        api.tx.assetManager.registerForeignAsset(
          RELAY_SOURCE_LOCATION,
          relayAssetMetadata,
          new BN(1),
          is_sufficient
        )
      )
      .signAsync(sudoAccount)
  );

  const assets = await api.query.assetManager.assetIdType(assetId);
  // make sure we created it
  expect(assets.unwrap().asXcm.parents.toNumber()).to.equal(1);

  // Get keys to modify balance
  const module = xxhashAsU8a(new TextEncoder().encode("Assets"), 128);
  const account_key = xxhashAsU8a(new TextEncoder().encode("Account"), 128);
  const blake2concatAssetId = new Uint8Array([
    ...blake2AsU8a(assetId.toU8a(), 128),
    ...assetId.toU8a(),
  ]);

  const blake2concatAccount = new Uint8Array([
    ...blake2AsU8a(hexToU8a(account.toString()), 128),
    ...hexToU8a(account.toString()),
  ]);
  const overallAccountKey = new Uint8Array([
    ...module,
    ...account_key,
    ...blake2concatAssetId,
    ...blake2concatAccount,
  ]);

  // Get keys to modify total supply & dummyCode (TODO: remove once dummy code inserted by node)
  const assetKey = xxhashAsU8a(new TextEncoder().encode("Asset"), 128);
  const overallAssetKey = new Uint8Array([...module, ...assetKey, ...blake2concatAssetId]);
  const evmCodeAssetKey = api.query.evm.accountCodes.key("0xFfFFfFff" + assetId.toHex().slice(2));

  await context.createBlock(
    api.tx.sudo
      .sudo(
        api.tx.system.setStorage([
          [u8aToHex(overallAccountKey), u8aToHex(assetBalance.toU8a())],
          [u8aToHex(overallAssetKey), u8aToHex(assetDetails.toU8a())],
          [
            evmCodeAssetKey,
            `0x${((DUMMY_REVERT_BYTECODE.length - 2) * 2)
              .toString(16)
              .padStart(2)}${DUMMY_REVERT_BYTECODE.slice(2)}`,
          ],
        ])
      )
      .signAsync(sudoAccount)
  );
  return;
}

export interface RegisterLocalAssetOptions {
  name?: string;
  symbol?: string;
  decimals?: number;
  registrerAccount: KeyringPair;
  mints?: { account: KeyringPair | string; amount: bigint }[];
}

export async function registerLocalAssetWithMeta(
  context: DevModeContext,
  sudoAccount: KeyringPair,
  {
    name = "Local",
    symbol = "Local",
    decimals = 12,
    registrerAccount,
    mints = [],
  }: RegisterLocalAssetOptions
): Promise<{ assetId: string; assetAddress: string }> {
  const api = context.polkadotJs({ type: "moon" });
  const { result } = await context.createBlock(
    api.tx.sudo
      .sudo(
        api.tx.assetManager.registerLocalAsset(
          registrerAccount.address,
          registrerAccount.address,
          true,
          new BN(1)
        )
      )
      .signAsync(sudoAccount)
  );

  // Look for assetId in events
  const assetId = result?.events
    .find(({ event: { section } }) => section.toString() === "assetManager")!
    .event.data[0].toHex()
    .replace(/,/g, "");
  const assetAddress = u8aToHex(new Uint8Array([...hexToU8a("0xFFFFFFFE"), ...hexToU8a(assetId)]));

  // Set metadata
  await context.createBlock(
    api.tx.localAssets
      .setMetadata(assetId, name, symbol, new BN(decimals))
      .signAsync(registrerAccount)
  );

  // mint accounts
  for (const { account, amount } of mints) {
    await context.createBlock(
      api.tx.localAssets
        .mint(assetId, typeof account == "string" ? account : account.address, amount)
        .signAsync(registrerAccount)
    );
  }

  return {
    assetId,
    assetAddress,
  };
}
