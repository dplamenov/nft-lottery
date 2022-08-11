//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./RandomWinner.sol";

error InsufficientAmount();
error WinnerAlreadyChosen();
error Unavailable();
error GameNotStarted();
error OnlyRandomWinnerContract();

contract Ticket is ERC721Upgradeable {
    uint64 public startBlock;
    uint64 public endBlock;
    uint256 public ticketPrice;
    uint256 public tokenCount;

    string baseURI;
    RandomWinner randomWinner;

    modifier active() {
        if (block.number < startBlock || block.numer > endBlock)
            revert Unavailable();
        _;
    }

    modifier onlyRandomWinner() {
        if (msg.sender != address(randomWinner))
            revert OnlyRandomWinnerContract();
    }

    modifier gameStarted() {
        if (block.number < startBlock) revert GameNotStarted();
    }

    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint64 _start,
        uint64 _end,
        uint128 _ticketPrice,
        address _randomWinnerAddress
    ) external initializer {
        __ERC721_init(_name, _symbol);
        baseURI = _baseURI;
        startBlock = _start;
        endBlock = _end;
        ticketPrice = _ticketPrice;
        randomWinner = RandomWinner(_randomWinnerAddress);
    }

    function buyTicket() external active nonReentrant {
        if (msg.value < ticketPrice) revert InsufficientAmount();
        _mint(msg.sender, tokenCount);
        ++tokenCount;

        uint256 change = ticketPrice - msg.value;

        if (change >= 1 wei) {
            payable(msg.sender).transfer(change);
        }
    }

    function pickWinner() external gameStarted initializer {
        if (
            (block.number < end && pickedSmall) ||
            (block.number >= end && pickedBig)
        ) revert WinnerAlreadyChosen();

        randomWinner.getRandomNumber("win(uint256)");
    }

    function win(uint256 randomness)
        external
        payable
        gameStarted
        onlyRandomWinner
    {
        uint256 winningTokenId = _randomness % tokenCount;
        address winnerAddress = ownerOf(winningTokenId);

        uint256 rewardAmount = block.number < end
            ? address(this).balance / 2
            : address(this).balance;

        payable(owner).transfer(rewardAmount);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }
}
