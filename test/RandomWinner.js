const { expect } = require("chai");
const { ethers } = require("hardhat");
const VRFConsumerBaseData = require('./utils/VRFConsumerBaseData');

describe('RandomWinner', async function () {
  let RandomWinner;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();

    RandomWinner = await (await ethers.getContractFactory("RandomWinner")).deploy(VRFConsumerBaseData.vrfCoordinator, VRFConsumerBaseData.link, VRFConsumerBaseData.keyHash);
  });

  describe('Should revert', async function () {
    it('should revert with error: SenderMustBeAContract', async () => {
      await expect(RandomWinner.getRandomNumber('test()')).to.revertedWith('SenderMustBeAContract');
    });
  });
});
