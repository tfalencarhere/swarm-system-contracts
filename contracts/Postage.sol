pragma solidity ^0.5.13;
import "./ProofOfBurn.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";

contract Postage {
  
  ProofOfBurn public burn;

  constructor(address _burn) public {
    burn = ProofOfBurn(_burn);
  }
  
  function postage(
    bytes32 payloadHash,
    uint256 postagePaid,
    uint256 beginValidity,
    uint256 endValidity,
    uint8 witnessType,
    bytes calldata witness
  ) external view returns (bool) {    
    if (now < beginValidity) return false;
    if (now >= endValidity) return false;

    bytes memory encodedStamp = abi.encodePacked(payloadHash, postagePaid, beginValidity, endValidity);

    if (witnessType == 0) {
      address signer = ECDSA.recover(keccak256(encodedStamp), witness);      
      if (signer == address(0)) return false;   
      return burn.burned(signer) >= postagePaid;
    }

    return false;
  }
}
