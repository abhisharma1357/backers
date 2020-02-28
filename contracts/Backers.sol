pragma solidity 0.5.0;


import "./Pausable.sol";
import "./Owned.sol";
import "./ERC20.sol";
import "./SafeMath.sol";
import "./StandardToken.sol";


contract Backers is StandardToken, Owned, Pausable {

    using SafeMath for uint256;
    // token name 
    string public constant name = "Backers";
    // token symbol
    string public constant symbol = "Backers";
    // decimal
    uint256 public constant decimals = 18;
    // owner address 
    address public _owner = address(0x4102871807695e132E0A25C981a53937057641D6);   
    // owner address
    uint256 public constant mintValue = 20000000 * 10 ** decimals;
    
    bool public crowdsaleStarted = false;
    bool public crowdsaleEnded = false;    
    address public crowdSaleAddress;
    uint256 public crowdSaleEndTime;


   mapping (address => bool) public whitelistedContributors;
   mapping (address => bool) public accrediatedInvestors;

    constructor() public Owned(_owner){
         
        _mint(address(this), mintValue);
    
    }


   function freezeAccount(address target, bool freeze) public onlyOwner {

        whitelistedContributors[target] = freeze;

    }

   function setCrowdSaleAddress(address _CrowdSaleAddress) public onlyOwner {

        require(_CrowdSaleAddress != address(0));
        require(crowdSaleAddress == address(0));
        require(crowdsaleStarted == false);
        crowdsaleStarted = true;
        crowdSaleAddress = _CrowdSaleAddress;

    }

    function issueTokens(address recipient, uint256 amount, bool accrediated ) public whenNotPaused returns (bool) {

        require(msg.sender == crowdSaleAddress,'function caller is not crowdsale address');
        require(amount>0,'Amount to send should be greater than Zero');
        require(recipient != address(0),'Recipient address should not be zero');
        whitelistedContributors[recipient] = true;
        accrediatedInvestors[recipient] = accrediated;        
        super._transfer(address(this), recipient, amount);
        return true;

   }    

    function forceTransfer(address sender, address recipient, uint256 amount) public onlyOwner returns (bool) {

        require(amount>0,'Amount to send should be greater than Zero');
        require(sender != address(0),'Sender address should not be zero');
        require(super.balanceOf(sender)>=amount,'blanace of sender is less');
        require(recipient != address(0),'Recipient address should not be zero');
        require(whitelistedContributors[recipient],'recipient is not a whitelisted investor');
        require(whitelistedContributors[recipient],'recipient is not a whitelisted investor');
        super._transfer(sender, recipient, amount);

   }    

    function checkTransfer(address recipient, uint256 amount) public view whenNotPaused returns (bool) {

        require(amount>0,'Amount to send should be greater than Zero');
        require(recipient != address(0),'Recipient address should not be zero');
        require(whitelistedContributors[recipient],'recipient is not a whitelisted investor');
        require(balanceOf(msg.sender)>=amount,'');
        return true;
    }

    function transfer(address recipient, uint256 amount) public whenNotPaused returns (bool) {

        require(crowdsaleStarted,'crowdsale is not started');
        require(crowdsaleEnded,'crowdsale is not ended');
        require(crowdSaleEndTime > 0,'crowdSaleEndTime is less then zero');
        require(now >= crowdSaleEndTime.add(15552000),'Lock period is not ended');
        require(amount>0,'Amount to send should be greater than Zero');
        require(recipient != address(0),'Recipient address should not be zero');
        require(whitelistedContributors[recipient],'recipient is not a whitelisted investor');
        super._transfer(msg.sender, recipient, amount);           
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public whenNotPaused returns (bool) {
        require(amount>0,'Amount to send should be greater than Zero');
        require(sender != address(0),'Sender address should not be zero');
        require(recipient != address(0),'Recipient address should not be zero');
        require(whitelistedContributors[recipient],'recipient is not a whitelisted investor');
        super._transferFrom(sender, recipient, amount);
        return true;
    }

    /**
    * @dev this function will closes the sale ,after this anyone can transfer their tokens to others.
    */
    function finalize() external whenNotPaused returns(bool){
        require(!crowdsaleEnded);
        require(crowdsaleStarted);
        crowdSaleEndTime = now;
        crowdsaleEnded = true;

        return true;
    }


}

