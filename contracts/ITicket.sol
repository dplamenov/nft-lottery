//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ITicket {
    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint64 _startBlock,
        uint64 _endBlock,
        uint128 _ticketPrice,
        address payable _randomWinnerAddress
    ) external;

    function buyTicket() external payable;

    function pickWinner() external;

    function win(uint256 randomness) external payable;
}
