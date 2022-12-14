//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./TicketProxy.sol";
import "./ITicket.sol";

contract TicketFactory {
    address public immutable ticketBeacon;
    address[] public _deployedProxies;

    event ProxyDeployed(address ticketProxyAddress);

    constructor(address _ticketBeacon) {
        ticketBeacon = _ticketBeacon;
    }

    /// @notice deploy ticket proxy
    function deployTicketProxy(
        string memory _name,
        string memory _symbol,
        uint64 _start,
        uint64 _end,
        uint128 _price,
        address payable _randomWinnerAddress
    ) public {
        deployTicketProxyDeterministic(
            _name,
            _symbol,
            _start,
            _end,
            _price,
            _randomWinnerAddress,
            0
        );
    }

    /// @notice deploy using create2
    /// @dev if _salt is 0 deploy ticket proxy without using create2
    function deployTicketProxyDeterministic(
        string memory _name,
        string memory _symbol,
        uint64 _start,
        uint64 _end,
        uint128 _price,
        address payable _randomWinnerAddress,
        uint256 _salt
    ) public {
        address payable ticketProxyAddress = _salt == 0
            ? payable(new TicketProxy(ticketBeacon))
            : payable(new TicketProxy{salt: bytes32(_salt)}(ticketBeacon));

        ITicket(ticketProxyAddress).initialize(
            _name,
            _symbol,
            _start,
            _end,
            _price,
            _randomWinnerAddress
        );

        _deployedProxies.push(ticketProxyAddress);
        emit ProxyDeployed(ticketProxyAddress);
    }

    function getAllDeployedProxies() external view returns (address[] memory) {
        return _deployedProxies;
    }
}
