import { Blockchain, SandboxContract, TreasuryContract, toSandboxContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Main } from '../wrappers/Main';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Main', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Main');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;
    let ownerWallet: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        ownerWallet = await blockchain.treasury("owner");

        main = blockchain.openContract(Main.createFromConfig({
            ownerAddress: ownerWallet.address,
        }, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await main.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: main.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and main are ready to use
    });

    it('should Deposit funds', async () => {

        let randomWallet: SandboxContract<TreasuryContract>;
        randomWallet = await blockchain.treasury("randomWallet");

        let beforeBalance = await main.getBalance();

        const depositResult = await main.sendDeposit(randomWallet.getSender(), toNano('0.03'));

        let afterBalance = await main.getBalance();

        expect(depositResult.transactions).toHaveTransaction({
            from: randomWallet.address,
            to: main.address,
            success: true,
        })

        expect(beforeBalance).toBeLessThan(afterBalance)
    }
    );

    it('should not accespt withdraw', async () => {

        let randomWallet: SandboxContract<TreasuryContract>;
        randomWallet = await blockchain.treasury("randomWallet");

        const depositResult = await main.sendDeposit(randomWallet.getSender(), toNano('5'));

        const withdrawResult = await main.sendWithdraw(randomWallet.getSender(), toNano('0.03'), toNano('1'));

        expect(withdrawResult.transactions).toHaveTransaction({
            from: randomWallet.address,
            to: main.address,
            success: false
        });
    });

    it('should get correct owner from storage', async () => {

        const getOwnerResult = await main.getData();

        expect(getOwnerResult.toString()).toBe(ownerWallet.address.toString());
    })

    it('should accept withdraw from contract and transfer funds to the owner', async () => {

        let randomWallet: SandboxContract<TreasuryContract>;
        randomWallet = await blockchain.treasury("randomWallet");

        const depositResult = await main.sendDeposit(randomWallet.getSender(), toNano('10'));
        
        let beforeBalance = await main.getBalance();

        // console.log(await ownerWallet.getBalance())

        const withDrawResult = await main.sendWithdraw(
            ownerWallet.getSender(),
            toNano('0.05'),
            toNano('5'),
        )
        
        // console.log(await ownerWallet.getBalance())

        expect(withDrawResult.transactions).toHaveTransaction({
            from: ownerWallet.address,
            to: main.address,
            success: true 
        });

        let afterBalance = await main.getBalance();
        
        // console.log("==================\n==================\n==================")
        // console.log(beforeBalance);
        // console.log(afterBalance);
        // console.log("==================\n==================\n==================")

        expect(beforeBalance).toBeGreaterThan(afterBalance);




    });

    it('should not let to change the owner to random user', async () => {
        let randomWallet : SandboxContract<TreasuryContract>;
        randomWallet = await blockchain.treasury("randomWallet");

        const cahngeTheOwnerResult = await main.sendChangeTheOwner(
            randomWallet.getSender(), 
            toNano('0.05'), 
            randomWallet.address,
        );

        expect(cahngeTheOwnerResult.transactions).toHaveTransaction({
            from: randomWallet.address,
            to: main.address,
            success: false,
            exitCode: 999,
        })

    })

    it('should change the owner', async () => {
        let randomWallet : SandboxContract<TreasuryContract>;
        randomWallet = await blockchain.treasury("randomWallet");

        let beforeOwner = (await main.getData()).toString();

        const changeTheOwnerResult = await main.sendChangeTheOwner(
            ownerWallet.getSender(),
            toNano('0.05'),
            randomWallet.address,
        )

        let afterOwner = (await main.getData()).toString();

        let isEquals = beforeOwner.toString() == afterOwner.toString();

        // expect(beforeOwner.toString()).(afterOwner.toString())

        expect(isEquals).toBeFalsy();


    })


});
