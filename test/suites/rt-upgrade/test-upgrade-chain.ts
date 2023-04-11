import { describeSuite, beforeAll, expect } from "@moonwall/cli";
import { alith } from "@moonwall/util";
import { ApiPromise } from "@polkadot/api";
import { parseEther } from "ethers";
import "@moonbeam-network/api-augment";

describeSuite({
  id: "CIRT",
  title: "Chopsticks Upgrade",
  foundationMethods: "chopsticks",
  testCases: ({ it, context, log }) => {
    let api: ApiPromise;
    const DUMMY_ACCOUNT = "0x11d88f59425cbc1867883fcf93614bf70e87E854";

    beforeAll(async () => {
      api = context.polkadotJs();

      const rtBefore = api.consts.system.version.specVersion.toNumber();
      await context.upgradeRuntime(context);
      const rtafter = api.consts.system.version.specVersion.toNumber();
      log(`RT upgrade has increased specVersion from ${rtBefore} to ${rtafter}`);

      const specName = api.consts.system.version.specName.toString();
      log(`Currently connected to chain: ${specName}`);
    });

    it({
      id: "T1",
      title: "Can create new blocks",
      test: async () => {
        const currentHeight = (await api.rpc.chain.getBlock()).block.header.number.toNumber();
        await context.createBlock({ count: 2 });
        const newHeight = (await api.rpc.chain.getBlock()).block.header.number.toNumber();
        expect(newHeight - currentHeight).to.be.equal(2);
      },
    });

    it({
      id: "T2",
      title: "Can send balance transfers",
      test: async () => {
        const balanceBefore = (await api.query.system.account(DUMMY_ACCOUNT)).data.free.toBigInt();
        await api.tx.balances.transfer(DUMMY_ACCOUNT, parseEther("1")).signAndSend(alith);
        await context.createBlock();
        const balanceAfter = (await api.query.system.account(DUMMY_ACCOUNT)).data.free.toBigInt();
        expect(balanceBefore < balanceAfter).to.be.true;
      },
    });
  },
});
