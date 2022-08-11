const hre = require("hardhat");

const VRFConsumerBaseData = {
  vrfCoordinator: '0x271682DEB8C4E0901D1a1550aD2e64D568E69909',
  link: '0x514910771af9ca656af840dff83e8264ecf986ca',
  keyHash: '0x9fe0eebf5e446e3c998ec9bb19951541aee00bb90ea201ae456421a2ded86805'
};

async function main() {
  const RandomWinner = await hre.ethers.getContractFactory("RandomWinner");
  const randomWinner = await RandomWinner.deploy(VRFConsumerBaseData.vrfCoordinator, VRFConsumerBaseData.link, VRFConsumerBaseData.keyHash);

  await randomWinner.deployed();

  console.log("RandomWinner deployed to:", randomWinner.address);

  const Ticket = await hre.ethers.getContractFactory("Ticket");
  const ticket = await Ticket.deploy();

  await ticket.deployed();
  await ticket.initialize('Ticket', 'T1', 'test', 0, 150, 1000000000, randomWinner.address);

  console.log("Ticket deployed to:", ticket.address);

  const Lottery = await hre.ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(ticket.address);

  await lottery.deployed();

  console.log("Lottery deployed to:", lottery.address);

  const TicketBeacon = await hre.ethers.getContractFactory("TicketBeacon");
  const ticketBeacon = await TicketBeacon.deploy(ticket.address);

  await ticketBeacon.deployed();
  console.log("TicketBeacon deployed to:", ticketBeacon.address);

  const TicketProxy = await hre.ethers.getContractFactory("TicketProxy");
  const ticketProxy = await TicketProxy.deploy(ticketBeacon.address);

  await ticketProxy.deployed();
  console.log("TicketProxy deployed to:", ticketProxy.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
