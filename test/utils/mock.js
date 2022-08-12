const { waffle } = require("hardhat");

const RandomWinner = require('../../artifacts/contracts/RandomWinner.sol/RandomWinner.json');

module.exports.deployMockedRandomWinner = async function () {
  return waffle.deployMockContract((await hre.ethers.getSigners())[0], RandomWinner.abi);
};
