//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TicketProxy.sol";
import "./ITicket.sol";

contract TicketFactory {
    address public immutable ticketBeacon;

    address[] public deployedProxies;

    constructor(address _ticketBeacon) {
        ticketBeacon = _ticketBeacon;
    }

    function deployProxy(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint64 _start,
        uint64 _end,
        uint128 _price,
        address payable _randomWinnerAddress,
        uint256 _salt
    ) public {
        address payable newTicketProxy = payable(
            new TicketProxy{salt: bytes32(_salt)}(ticketBeacon)
        );

        ITicket(newTicketProxy).initialize(
            _name,
            _symbol,
            _baseURI,
            _start,
            _end,
            _price,
            _randomWinnerAddress
        );

        deployedProxies.push(newTicketProxy);
    }
}
