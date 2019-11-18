pragma solidity ^0.5.13;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ProofOfBurn {
  using SafeMath for uint256;
  
  ERC20 public token;
  mapping (address => uint256) public burned;

  constructor(address _token) public {
    token = ERC20(_token);
  }

  function burn(address target, uint amount) public {
    require(token.transferFrom(msg.sender, address(this), amount), "token transfer failed");
    burned[target] = burned[target].add(amount);
  }

}
