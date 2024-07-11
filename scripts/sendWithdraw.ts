import { Address, toNano } from '@ton/core';
import { Main } from '../wrappers/Main';
import { NetworkProvider, sleep } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse("EQC_qhykAvxnJ50KsXSfRB7bH_VQthAa4xUNYjUAFbsy18pW");

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const main = provider.open(Main.createFromAddress(address));

    await main.sendWithdraw(
        provider.sender(),
        toNano('0.05'),
        toNano('0.5'),
    )

    ui.clearActionPrompt();
    ui.write('Balance withdrawn successfully!');
}