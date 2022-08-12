//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./RandomWinner.sol";
import "./ITicket.sol";

error InsufficientAmount();
error WinnerAlreadyChosen();
error Unavailable();
error GameNotStarted();
error OnlyRandomWinnerContract();

contract Ticket is ITicket, ERC721Upgradeable, ReentrancyGuardUpgradeable {
    uint64 public startBlock;
    uint64 public endBlock;
    uint256 public ticketPrice;
    uint256 public tokenCount;
    bool public isPickedSmall;
    bool public isPickedBig;
    string baseURI;
    RandomWinner randomWinner;

    event TicketBought(uint256 tokenId, address user);

    modifier active() {
        if (block.number < startBlock || block.number > endBlock)
            revert Unavailable();
        _;
    }

    modifier onlyRandomWinner() {
        if (msg.sender != address(randomWinner))
            revert OnlyRandomWinnerContract();
        _;
    }

    modifier gameStarted() {
        if (block.number < startBlock) revert GameNotStarted();
        _;
    }

    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint64 _startBlock,
        uint64 _endBlock,
        uint128 _ticketPrice,
        address payable _randomWinnerAddress
    ) external initializer {
        __ERC721_init(_name, _symbol);
        baseURI = _baseURI;
        startBlock = _startBlock;
        endBlock = _endBlock;
        ticketPrice = _ticketPrice;
        randomWinner = RandomWinner(_randomWinnerAddress);
    }

    function buyTicket() external payable active nonReentrant {
        if (msg.value < ticketPrice) revert InsufficientAmount();
        _mint(msg.sender, tokenCount);
        emit TicketBought(tokenCount, msg.sender);
        ++tokenCount;

        uint256 change = msg.value - ticketPrice;

        if (change >= 1 wei) {
            payable(msg.sender).transfer(change);
        }
    }

    function pickWinner() external gameStarted {
        if (
            (block.number < endBlock && isPickedSmall) ||
            (block.number >= endBlock && isPickedBig)
        ) revert WinnerAlreadyChosen();

        if (block.number < endBlock) {
            isPickedSmall = true;
        } else {
            isPickedBig = true;
        }

        randomWinner.getRandomNumber("win(uint256)");
    }

    function win(uint256 randomness)
        external
        payable
        gameStarted
        onlyRandomWinner
        nonReentrant
    {
        uint256 winningTokenId = randomness % tokenCount;
        address winnerAddress = ownerOf(winningTokenId);

        uint256 rewardAmount = block.number < endBlock
            ? address(this).balance / 2
            : address(this).balance;

        payable(winnerAddress).transfer(rewardAmount);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }
}
