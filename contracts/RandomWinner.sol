//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

error SenderMustBeAContract();

contract RandomWinner is VRFConsumerBase {
    bytes32 internal keyHash;
    uint256 internal fee;

    mapping(bytes32 => address) internal requestToSender;
    mapping(bytes32 => string) internal requestToCallbackSignature;

    constructor(
        address _vrfCoordinator,
        address _link,
        bytes32 _keyHash
    ) VRFConsumerBase(_vrfCoordinator, _link) {
        keyHash = _keyHash;
        fee = 0.25 * 10**18;
    }

    function getRandomNumber(string memory callbackSignature)
        public
        returns (bytes32 requestId)
    {
        uint32 size;
        address _addr = msg.sender;
        assembly {
            size := extcodesize(_addr)
        }
        if (size <= 0) revert SenderMustBeAContract();

        requestId = requestRandomness(keyHash, fee);
        requestToSender[requestId] = msg.sender;
        requestToCallbackSignature[requestId] = callbackSignature;
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        (bool success, ) = requestToSender[requestId].call(
            abi.encodeWithSignature(
                requestToCallbackSignature[requestId],
                randomness
            )
        );
        if (!success) revert();
    }

    fallback() external payable {}
}
