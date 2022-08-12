const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployMockedRandomWinner } = require("./utils/mock");

describe('TicketBeacon', async function () {
  let TicketBeacon;
  let Ticket;
  let RandomWinner;
  let ticketData;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();

    RandomWinner = await deployMockedRandomWinner();
    ticketData = ['Ticket', 'T1', 'test', 0, 150, 1000000000, RandomWinner.address];

    Ticket = await (await ethers.getContractFactory("Ticket")).deploy();
    await Ticket.initialize(...ticketData);

    TicketBeacon = await (await ethers.getContractFactory("TicketBeacon")).deploy(Ticket.address);
  });

  describe("Change implementation", async function () {
    it('Should change implementation', async () => {
      const newTicketData = ['Ticket2', 'T2', 'test', 0, 150, 1000000000, RandomWinner.address];

      const Ticket = await (await ethers.getContractFactory("Ticket")).deploy();
      Ticket.initialize(newTicketData);

      expect(TicketBeacon.upgradeTo(Ticket.address)).to.not.reverted;
      expect(await TicketBeacon.implementation()).to.be.eq(Ticket.address);
    });
  });
});
