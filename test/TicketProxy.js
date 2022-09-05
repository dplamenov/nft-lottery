const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployMockedRandomWinner } = require("./utils/mock");

describe('TicketProxy', async function () {
  let TicketBeacon;
  let TicketProxy;
  let Ticket;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();

    RandomWinner = await deployMockedRandomWinner();
    ticketData = ['Ticket', 'T1', 0, 150, 1000000000, RandomWinner.address];

    Ticket = await (await ethers.getContractFactory("Ticket")).deploy();
    await Ticket.initialize(...ticketData);

    TicketBeacon = await (await ethers.getContractFactory("TicketBeacon")).deploy(Ticket.address);
    TicketProxy = await (await ethers.getContractFactory("TicketProxy")).deploy(TicketBeacon.address);
  });

  describe("Test beacon", async function () {
    it('Should return correct beacon', async () => {
      expect(await TicketProxy.beacon()).to.be.eq(TicketBeacon.address);
    });
  });

  describe("Test implementation", async function () {
    it('Should return correct implementation', async () => {
      expect(await TicketProxy.implementation()).to.be.eq(Ticket.address);
    });
  });

  describe("New implementation", async function () {
    it('Should return new implementation', async () => {
      const Ticket = await (await ethers.getContractFactory("Ticket")).deploy();
      await Ticket.initialize(...ticketData);

      await TicketBeacon.upgradeTo(Ticket.address);

      expect(await TicketProxy.implementation()).to.be.eq(Ticket.address);
    });
  });
});
