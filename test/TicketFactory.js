const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployMockedRandomWinner } = require("./utils/mock");

describe('TicketFactory', async function () {
  let TicketFactory;
  let RandomWinner;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();

    RandomWinner = await deployMockedRandomWinner();
    const ticketData = ['Ticket', 'T1', 0, 150, 1000000000, RandomWinner.address];

    const Ticket = await (await ethers.getContractFactory("Ticket")).deploy();
    await Ticket.initialize(...ticketData);

    const TicketBeacon = await (await ethers.getContractFactory("TicketBeacon")).deploy(Ticket.address);

    const TicketProxy = await (await ethers.getContractFactory("TicketProxy")).deploy(TicketBeacon.address);
    TicketFactory = await (await ethers.getContractFactory("TicketFactory")).deploy(TicketProxy.address);
  });

  describe('Properties', async function () {
    it('deployedProxies should be empty', async () => {
      expect(await TicketFactory.getAllDeployedProxies()).to.deep.equal([]);
    });
  });

  describe('deployProxy method', async function () {
    it('should deploy new proxy', async () => {
      await TicketFactory.deployProxy('Ticket', 'T1', 0, 150, 1000000000, RandomWinner.address, 185121256);
      expect((await TicketFactory.getAllDeployedProxies()).length).to.deep.equal(1);
    });

    it('should deploy 2 new proxies', async () => {
      await TicketFactory.deployProxy('Ticket', 'T1', 0, 150, 1000000000, RandomWinner.address, 12412512);
      await TicketFactory.deployProxy('Ticket', 'T2', 0, 150, 1000000000, RandomWinner.address, 59424901);
      expect((await TicketFactory.getAllDeployedProxies()).length).to.deep.equal(2);
    });

    it('should emit ProxyDeployed event', async () => {
      await expect(TicketFactory.deployProxy('Ticket', 'T1', 0, 150, 1000000000, RandomWinner.address, 185121256))
        .to.emit(TicketFactory, 'ProxyDeployed');
    });
  });
});
