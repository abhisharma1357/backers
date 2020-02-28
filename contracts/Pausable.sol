pragma solidity 0.5.0;
import './Owned.sol';
contract Pausable is Owned {
    event Pause();
    event Unpause();

    bool public paused = false;

    modifier whenNotPaused() {
      require(!paused,'Contract activities are Not paused');
      _;
    }

    modifier whenPaused() {
      require(paused,'contract activities are paused');
      _;
    }

    function pause() onlyOwner whenNotPaused public {
      paused = true;
      emit Pause();
    }

    function unpause() onlyOwner whenPaused public {
      paused = false;
      emit Unpause();
    }
}