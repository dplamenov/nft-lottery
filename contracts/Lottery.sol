//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./TicketBeacon.sol";

contract Lottery is Ownable {
    TicketBeacon public ticketBeacon;

    constructor(address _ticketAddress) {
        ticketBeacon = new TicketBeacon(_ticketAddress);
    }

    function changeImplementation(address _ticketAddress) public onlyOwner {
        ticketBeacon.upgradeTo(_ticketAddress);
    }

    function getTicketImplementationAddress() public view returns (address) {
        return ticketBeacon.implementation();
    }
}
