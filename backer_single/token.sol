pragma solidity 0.5.0;


library SafeMath {
    function add(uint a, uint b) internal pure returns (uint c) {
        c = a + b;
        require(c >= a);
    }
    function sub(uint a, uint b) internal pure returns (uint c) {
        require(b <= a);
        c = a - b;
    }
    function mul(uint a, uint b) internal pure returns (uint c) {
        c = a * b;
        require(a == 0 || c / a == b);
    }
    function div(uint a, uint b) internal pure returns (uint c) {
        require(b > 0);
        c = a / b;
    }
}

contract ERC20 {
 // modifiers

 // mitigate short address attack
 // thanks to https://github.com/numerai/contract/blob/c182465f82e50ced8dacb3977ec374a892f5fa8c/contracts/Safe.sol#L30-L34.
 // TODO: doublecheck implication of >= compared to ==
    modifier onlyPayloadSize(uint numWords) {
        assert(msg.data.length >= numWords * 32 + 4);
        _;
    }
    /*
      *  Public functions
      */
    function balanceOf(address who) public view returns (uint256);
    function transfer(address to, uint256 value) public returns (bool);

    function allowance(address owner, address spender) public view returns (uint256);
    function transferFrom(address from, address to, uint256 value) public returns (bool);
    function approve(address spender, uint256 value) public returns (bool);

    /*
      *  Events
      */
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Burn(address indexed from, uint256 value);
    event SaleContractActivation(address saleContract, uint256 tokensForSale);
}

contract Owned {
    address public owner;
    address public newOwner;

    event OwnershipTransferred(address indexed from, address indexed _to);

    constructor(address _owner) public {
        owner = _owner;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }
    function acceptOwnership() public {
        require(msg.sender == newOwner);
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        newOwner = address(0);
    }
}

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

contract StandardToken is ERC20 {
    using SafeMath for uint256;

    mapping (address => uint256) private _balances;

    mapping (address => mapping (address => uint256)) private _allowances;

    uint256 private _totalSupply;

    /**
     * @dev See `IERC20.totalSupply`.
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See `IERC20.balanceOf`.
     */
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }


    /**
     * @dev See `IERC20.allowance`.
     */
    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See `IERC20.approve`.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 value) public returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }


    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to `approve` that can be used as a mitigation for
     * problems described in `IERC20.approve`.
     *
     * Emits an `Approval` event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender].add(addedValue));
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to `approve` that can be used as a mitigation for
     * problems described in `IERC20.approve`.
     *
     * Emits an `Approval` event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` must have allowance for the caller of at least
     * `subtractedValue`.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender].sub(subtractedValue));
        return true;
    }

    /**
     * @dev Moves tokens `amount` from `sender` to `recipient`.
     *
     * This is internal function is equivalent to `transfer`, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a `Transfer` event.
     *
     * Requirements:
     *
     * - `sender` cannot be the zero address.
     * - `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     */
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        _balances[sender] = _balances[sender].sub(amount);
        _balances[recipient] = _balances[recipient].add(amount);
        emit Transfer(sender, recipient, amount);
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a `Transfer` event with `from` set to the zero address.
     *
     * Requirements
     *
     * - `to` cannot be the zero address.
     */
    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply = _totalSupply.add(amount);
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, amount);
    }


    /**
     * @dev See `IERC20.transferFrom`.
     *
     * Emits an `Approval` event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of `ERC20`;
     *
     * Requirements:
     * - `sender` and `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `value`.
     * - the caller must have allowance for `sender`'s tokens of at least
     * `amount`.
     */
    function _transferFrom(address sender, address recipient, uint256 amount) internal returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, _allowances[sender][msg.sender].sub(amount));
        return true;
    }


    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner`s tokens.
     *
     * This is internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an `Approval` event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(address owner, address spender, uint256 value) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = value;
        emit Approval(owner, spender, value);
    }
    

}

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

