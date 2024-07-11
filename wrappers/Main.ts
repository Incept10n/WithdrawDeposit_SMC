import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from '@ton/core';

export type MainConfig = {
    ownerAddress: Address,
};

export function mainConfigToCell(config: MainConfig): Cell {
    return beginCell()
            .storeAddress(config.ownerAddress) 
    .endCell();
}

export class Main implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Main(address);
    }

    static createFromConfig(config: MainConfig, code: Cell, workchain = 0) {
        const data = mainConfigToCell(config);
        const init = { code, data };
        return new Main(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(1, 32).endCell(),
        });
    }

    async getData(provider: ContractProvider) {
        const { stack } = await provider.get("getOwner", []);
        return stack.readAddress();
    }

    async getBalance(provider: ContractProvider) {
        const { stack } = await provider.get("getAmountOfFunds", [])
        return stack.readNumber();
    }

    async sendWithdraw(
        provider: ContractProvider, 
        via: Sender, 
        value: bigint, 
        amountToWithdraw: bigint) {

            await provider.internal(via, {
                value,
                body: beginCell()
                        .storeUint(2, 32)
                        .storeCoins(amountToWithdraw)
                        .endCell()
            })
    }

    async sendChangeTheOwner(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        newOwnerAddress: Address,
    ) {
        await provider.internal(via, {
            value,
            body: beginCell()
                    .storeUint(3, 32)
                    .storeAddress(newOwnerAddress)
                    .endCell()
        })
    }


    async sendDeposit(
        provider: ContractProvider, 
        via: Sender, 
        value: bigint, 
        ) {
            await provider.internal(via, {
                value,
                body: beginCell()
                        .storeUint(1, 32)
                        .endCell()
            })
    }


}
