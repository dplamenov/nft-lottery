const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployMockedRandomWinner } = require("./utils/mock");

describe('Lottery', async function () {
  let Ticket;
  let Lottery;
  let ticketData;

  beforeEach(async function () {
    [deployer, addr2] = await ethers.getSigners();
    RandomWinnerMOCK = await deployMockedRandomWinner();
    ticketData = ['Ticket', 'T1', 0, 100, 1000000000, RandomWinnerMOCK.address];

    Ticket = await (await ethers.getContractFactory("Ticket")).deploy();
    await Ticket.initialize(...ticketData);

    Lottery = await (await ethers.getContractFactory("Lottery")).deploy(Ticket.address);
  });

  describe("Constructor", async function () {
    it('should create new TicketBeacon instance', async () => {
      expect(await Lottery.ticketBeacon()).to.be.not.empty;
    });
  });

  describe("changeImplementation", async function () {
    it('should revert with "caller is not the owner" if not owner make transcation', async () => {
      await expect(Lottery.connect(addr2).changeImplementation('0x' + Array(41).join('0'))).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should change implementation', async () => {
      const Ticket = await (await ethers.getContractFactory("Ticket")).deploy();
      await Ticket.initialize(...ticketData);

      await Lottery.changeImplementation(Ticket.address);

      await expect(await Lottery.getTicketImplementationAddress()).to.be.equal(Ticket.address);
    });
  });
});
