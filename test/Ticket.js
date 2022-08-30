const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mineBlocks } = require("./utils/mineBlocks");
const { deployMockedRandomWinner } = require("./utils/mock");
const VRFConsumerBaseData = require('./utils/VRFConsumerBaseData');

describe('Ticket', async function () {
  let Ticket;
  let RandomWinner;
  let RandomWinnerMOCK;
  let ticketData;

  beforeEach(async function () {
    [deployer, addr2] = await ethers.getSigners();
    RandomWinnerMOCK = await deployMockedRandomWinner();

    RandomWinner = await (await ethers.getContractFactory("RandomWinner")).deploy(VRFConsumerBaseData.vrfCoordinator, VRFConsumerBaseData.link, VRFConsumerBaseData.keyHash);

    ticketData = ['Ticket', 'T1', 'test', 0, 100, 1000000000, RandomWinnerMOCK.address];

    Ticket = await (await ethers.getContractFactory("Ticket")).deploy();
    await Ticket.initialize(...ticketData);

    TicketBeacon = await (await ethers.getContractFactory("TicketBeacon")).deploy(Ticket.address);
    TicketProxy = await (await ethers.getContractFactory("TicketProxy")).deploy(TicketBeacon.address);

    await Promise.all([
      RandomWinnerMOCK.mock.getRandomNumber.returns("0x" + Array(65).join('0')),
    ]);
  });

  describe("Properties", async function () {
    it('check properties', async () => {
      expect(await Ticket.name()).to.be.eq(ticketData[0]);
      expect(await Ticket.symbol()).to.be.eq(ticketData[1]);
      expect(await Ticket.startBlock()).to.be.eq(ticketData[3]);
      expect(await Ticket.endBlock()).to.be.eq(ticketData[4]);
      expect(await Ticket.ticketPrice()).to.be.eq(ticketData[5]);
    });
  });

  describe("Buy tickets", async function () {
    it('should emit TicketBought event', async () => {
      await expect(Ticket.buyTicket({ value: 1000000000 })).to
        .emit(Ticket, 'TicketBought')
        .withArgs("1", deployer.address);
    });

    it('check owner', async () => {
      await Ticket.buyTicket({ value: 1000000000 });
      expect(await Ticket.ownerOf(0)).to.be.eq(deployer.address);
    });

    it('should revert with InsufficientAmount', async () => {
      await expect(Ticket.buyTicket({ value: 125 })).to.be.revertedWith('InsufficientAmount');
    });
  });

  describe("Pick winner", async function () {
    it('should emit PickWinner', async () => {
      await expect(Ticket.pickWinner()).to.emit(Ticket, 'PickWinner');
    });

    it('pick small win', async () => {
      await Ticket.buyTicket({ value: 1000000000 });
      await mineBlocks(hre, 15);

      await Ticket.pickWinner();

      expect(await Ticket.isPickedSmall()).to.be.true;
    });

    it('pick big win', async () => {
      await Ticket.buyTicket({ value: 1000000000 });
      await mineBlocks(hre, 512);

      await Ticket.pickWinner();

      expect(await Ticket.isPickedBig()).to.be.true;
    });
  });

  describe("Win", async function () {
    it('should emit Win event', async () => {
      const Ticket = await (await ethers.getContractFactory("Ticket")).deploy();
      await Ticket.initialize(...['Ticket', 'T1', 'test', 0, 100000, 1000000000, RandomWinner.address]);

      await Ticket.buyTicket({ value: 1000000000 });
      Ticket.changeRandomWinner(addr2.address);

      await expect(Ticket.connect(addr2).win(12491824)).to.emit(Ticket, 'Win').withArgs(deployer.address, '500000000', '0');
    });

    it('should revert with OnlyRandomWinnerContract', async () => {
      const Ticket = await (await ethers.getContractFactory("Ticket")).deploy();
      await Ticket.initialize(...['Ticket', 'T1', 'test', 0, 100000, 1000000000, RandomWinnerMOCK.address]);

      await Ticket.buyTicket({ value: 1000000000 });
      await expect(Ticket.win(12491824)).to.revertedWith('OnlyRandomWinnerContract');
    });

    it('should get small win', async () => {
      const Ticket = await (await ethers.getContractFactory("Ticket")).deploy();
      await Ticket.initialize(...['Ticket', 'T1', 'test', 0, 100000, 1000000000, RandomWinner.address]);

      await Ticket.buyTicket({ value: 1000000000 });
      await Ticket.changeRandomWinner(addr2.address);

      const balanceBefore = await ethers.provider.getBalance(deployer.address);

      await expect(Ticket.connect(addr2).win(12491824)).to.not.reverted;

      const balanceAfter = await ethers.provider.getBalance(deployer.address);
      console.log(balanceBefore, balanceAfter);

      expect(balanceAfter.sub(balanceBefore)).to.be.eq(1000000000 / 2);
    });

    it('should get big win', async () => {
      const Ticket = await (await ethers.getContractFactory("Ticket")).deploy();
      await Ticket.initialize(...['Ticket', 'T1', 'test', 0, 100000, 1000000000, RandomWinner.address]);
      await Ticket.buyTicket({ value: 1000000000 });
      await Ticket.changeRandomWinner(addr2.address);

      const balanceBefore = await ethers.provider.getBalance(deployer.address);

      await mineBlocks(hre, 1000000000);

      await expect(Ticket.connect(addr2).win(12491824)).to.not.reverted;

      const balanceAfter = await ethers.provider.getBalance(deployer.address);
      expect(balanceAfter.sub(balanceBefore)).to.be.eq(1000000000);
    });
  });
});
