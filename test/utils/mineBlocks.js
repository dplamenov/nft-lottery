module.exports.mineBlocks = async function mineBlocks(hre, decimal) {
  const hex = decimal.toString(16);
  await hre.network.provider.send("hardhat_mine", ['0x' + hex]);
};
