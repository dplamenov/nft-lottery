//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error InsufficientAmount();
error WinnerAlreadyChosen();
error Unavailable();
error GameNotStarted();

contract Ticket is ERC721Upgradeable {
    uint64 public startBlock;
    uint64 public endBlock;
    uint256 public ticketPrice;
    uint256 public tokenCount;

    string baseURI;

    modifier active() {
        if (block.number < startBlock || block.numer > endBlock)
            revert Unavailable();
        _;
    }

    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint64 _start,
        uint64 _end,
        uint128 _ticketPrice
    ) external initializer {
        __ERC721_init(_name, _symbol);
        baseURI = _baseURI;
        startBlock = _start;
        endBlock = _end;
        ticketPrice = _ticketPrice;
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

    function pickWinner() external initializer {
        if (block.number < startBlock) revert GameNotStarted();

        if (
            (block.number < end && pickedSmall) ||
            (block.number >= end && pickedBig)
        ) revert WinnerAlreadyChosen();
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }
}
