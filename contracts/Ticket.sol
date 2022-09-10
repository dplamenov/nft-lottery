//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./RandomWinner.sol";
import "./ITicket.sol";

error InsufficientAmount();
error WinnerAlreadyChosen();
error Unavailable();
error GameNotStarted();
error OnlyRandomWinnerContract();

contract Ticket is
    OwnableUpgradeable,
    ITicket,
    ERC721Upgradeable,
    ReentrancyGuardUpgradeable
{
    uint64 public startBlock;
    uint64 public endBlock;
    uint256 public ticketPrice;
    uint256 public tokenCount;
    bool public isPickedSmall;
    bool public isPickedBig;
    RandomWinner randomWinner;

    event TicketBought(uint256 tokenId, address indexed user);
    event ChangeReturn(uint256 change, address indexed user);
    event PickWinner();
    event Win(
        address indexed winnerAddress,
        uint256 rewardAmount,
        uint256 indexed winningTokenId
    );

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
        uint64 _startBlock,
        uint64 _endBlock,
        uint128 _ticketPrice,
        address _randomWinnerAddress
    ) external initializer {
        __ERC721_init(_name, _symbol);
        __Ownable_init();

        startBlock = _startBlock;
        endBlock = _endBlock;
        ticketPrice = _ticketPrice;
        randomWinner = RandomWinner(_randomWinnerAddress);
    }

    /// @notice buy ticket
    function buyTicket() external payable active nonReentrant {
        if (msg.value != ticketPrice) revert InsufficientAmount();
        _mint(msg.sender, tokenCount);
        ++tokenCount;
        emit TicketBought(tokenCount, msg.sender);
    }

    /// @notice buy ticket
    /// @dev call getRandomNumber on randomWinner and pass it callback signature to call with randomness
    function pickWinner() external gameStarted onlyOwner {
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
        emit PickWinner();
    }

    /// @notice proccess win
    /// @param randomness random number
    function win(uint256 randomness)
        external
        payable
        gameStarted
        onlyRandomWinner
        nonReentrant
    {
        //get winning token based on recieved random number
        uint256 winningTokenId = randomness % tokenCount;
        //get address of winner
        address winnerAddress = ownerOf(winningTokenId);

        uint256 rewardAmount = block.number < endBlock
            ? address(this).balance / 2
            : address(this).balance;

        // transfer reward
        payable(winnerAddress).transfer(rewardAmount);

        emit Win(winnerAddress, rewardAmount, winningTokenId);
    }
}
