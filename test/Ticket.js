const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployMockedRandomWinner } = require("./utils/mock");
const VRFConsumerBaseData = require('./utils/VRFConsumerBaseData');

describe('Ticket', async function () {
  let Ticket;
  let ticketData;
  let RandomWinner;
  let RandomWinnerSigner;
  let RandomWinnerMOCK;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    RandomWinnerMOCK = await deployMockedRandomWinner();

    RandomWinner = await (await ethers.getContractFactory("RandomWinner")).deploy(VRFConsumerBaseData.vrfCoordinator, VRFConsumerBaseData.link, VRFConsumerBaseData.keyHash);

    ticketData = ['Ticket', 'T1', 'test', 0, 100, 1000000000, RandomWinnerMOCK.address];

    Ticket = await (await ethers.getContractFactory("Ticket")).deploy();
    await Ticket.initialize(...ticketData);

    TicketBeacon = await (await ethers.getContractFactory("TicketBeacon")).deploy(Ticket.address);
    TicketProxy = await (await ethers.getContractFactory("TicketProxy")).deploy(TicketBeacon.address);

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [RandomWinner.address],
    });
    RandomWinnerSigner = await ethers.getSigner(RandomWinner.address);
    await deployer.sendTransaction({ to: RandomWinner.address, value: ethers.utils.parseEther("1") });

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

    it('should return change', async () => {
      await expect(Ticket.buyTicket({ value: 2000000000 })).not.to.reverted;
    });

    it('should emit ChangeReturn', async () => {
      await expect(Ticket.buyTicket({ value: 2000000000 })).to
        .emit(Ticket, 'ChangeReturn')
        .withArgs(1000000000, deployer.address);
    });
  });

  describe("Pick winner", async function () {
    it('should emit PickWinner', async () => {
      await expect(Ticket.pickWinner()).to.emit(Ticket, 'PickWinner');
    });

    it('pick small win', async () => {
      await Ticket.buyTicket({ value: 1000000000 });
      await hre.network.provider.send("hardhat_mine", ["0x10"]);

      await Ticket.pickWinner();

      expect(await Ticket.isPickedSmall()).to.be.true;
    });

    it('pick big win', async () => {
      await Ticket.buyTicket({ value: 1000000000 });
      await hre.network.provider.send("hardhat_mine", ["0x200"]);

      await Ticket.pickWinner();

      expect(await Ticket.isPickedBig()).to.be.true;
    });
  });

  describe("Win", async function () {
    it('should emit Win event', async () => {
      const Ticket = await (await ethers.getContractFactory("Ticket")).deploy();
      await Ticket.initialize(...['Ticket', 'T1', 'test', 0, 100000, 1000000000, RandomWinner.address]);

      await Ticket.buyTicket({ value: 1000000000 });
      await expect(Ticket.connect(RandomWinnerSigner).win(12491824)).to.emit(Ticket, 'Win').withArgs(deployer.address, '500000000', '0');
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

      const balanceBefore = await ethers.provider.getBalance(deployer.address);

      await expect(Ticket.connect(RandomWinnerSigner).win(12491824)).to.not.reverted;

      const balanceAfter = await ethers.provider.getBalance(deployer.address);
      expect(balanceAfter.sub(balanceBefore)).to.be.eq(1000000000 / 2);
    });

    it('should get big win', async () => {
      const Ticket = await (await ethers.getContractFactory("Ticket")).deploy();
      await Ticket.initialize(...['Ticket', 'T1', 'test', 0, 100000, 1000000000, RandomWinner.address]);

      await Ticket.buyTicket({ value: 1000000000 });

      const balanceBefore = await ethers.provider.getBalance(deployer.address);

      await hre.network.provider.send("hardhat_mine", ["0x3B9ACA00"]);

      await expect(Ticket.connect(RandomWinnerSigner).win(12491824)).to.not.reverted;

      const balanceAfter = await ethers.provider.getBalance(deployer.address);
      expect(balanceAfter.sub(balanceBefore)).to.be.eq(1000000000);
    });
  });
});
