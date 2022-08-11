//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

error InsufficientAmount();

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

    function buyTicket() {
        if (msg.value < ticketPrice) revert InsufficientAmount();
        _mint(msg.sender, tokenCount);
        ++tokenCount;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }
}
