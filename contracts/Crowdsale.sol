pragma solidity  0.5.0;

contract Backers {

    function issueTokens(address, uint256, bool) external returns(bool);
    function finalize() external returns (bool);
}

/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow
 * checks.
 *
 * Arithmetic operations in Solidity wrap on overflow. This can easily result
 * in bugs, because programmers usually assume that an overflow raises an
 * error, which is the standard behavior in high level programming languages.
 * `SafeMath` restores this intuition by reverting the transaction when an
 * operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }


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


contract Crowdsale is Owned { 
  
  using SafeMath for uint256;
  uint256 public ethPrice; // 1 Ether price in USD cents.

   mapping (address => bool) public whitelistedContributors;
   mapping (address => bool) public accrediatedInvestors;


  // The token being sold
  Backers public token;

  uint256 public hardCap = 600000;

  uint256 public tokensForSale = 2000000 ether;

  uint256 public roundOnetokenSold = 0;
  uint256 public roundTwoTokenSold = 0;
  uint256 public roundThreeTokenSold = 0;  
  uint256 public roundFourTokenSold = 0;


  uint256 public roundOneTokensForSale;
  uint256 public roundTwoTokensForSale;
  uint256 public roundThreeTokensForSale;  
  uint256 public roundFourTokensForSale;

  //tokens per dollar  
  uint256 public tokensPerDollarInCurrentSale;  

  // Address where funds are collected
  address public wallet;

  //Sale minimum maximum values for accrdiated and non accredoiated investors
  uint256 public minimumUsdCents = 30000;
  uint256 public maximumUsdCentsForNonAccreditedInvestor = 250000;
  uint256 public maximumUsdCentsForAccreditedInvestor = 2500000;
  
  bool public crowdSaleStarted = false;

  // Amount of USD raised in cents
  uint256 public totalRaisedInCents;
  
  enum Stages {CrowdSaleNotStarted, Pause, RoundOneStart,RoundOneEnd,RoundtwoStart,RoundTwoEnd,RoundThreeStart,RoundThreeEnd,RoundFourStart,RoundFourEnd}
 
  Stages currentStage;
  Stages previousStage;
  bool public Paused;

   modifier CrowdsaleStarted(){

      require(crowdSaleStarted);
      _;
   }
 
    /**
    * Event for token purchase logging
    * @param purchaser who paid for the tokens
    * @param beneficiary who got the tokens
    * @param value weis paid for purchase
    * @param amount amount of tokens purchased
    */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

    /**
    *@dev initializes the crowdsale contract 
    * @param _newOwner Address who has special power to change the ether price in cents according to the market price
    * @param _wallet Address where collected funds will be forwarded to
    * @param _token Address of the token being sold
    */
    constructor(address _newOwner, address _wallet, Backers _token) Owned(_newOwner) public {

        require(_wallet != address(0));
        //require(_token != address(0));
        wallet = _wallet;
        owner = _newOwner;
        token = _token;
        currentStage = Stages.CrowdSaleNotStarted;

    }

    /**
    * @dev whitelist addresses of investors.
    * @param addrs ,array of addresses of investors to be whitelisted
    * Note:= Array length must be less than 200.process
    */
    function authorizeKyc(address[] memory addrs) public onlyOwner returns (bool success) {

        uint arrayLength = addrs.length;
        for (uint x = 0; x < arrayLength; x++) 
        {
            whitelistedContributors[addrs[x]] = true;
        }
        return true;
    }

    /**
    * @dev whitelist addresses of investors.
    * @param addrs ,array of addresses of investors to be whitelisted
    * Note:= Array length must be less than 200.process
    */
    function approveAccrediatedInvestors(address[] memory addrs) public onlyOwner returns (bool success) {

        uint arrayLength = addrs.length;
        for (uint x = 0; x < arrayLength; x++) 
        {
            accrediatedInvestors[addrs[x]] = true;
        }
        return true;
    }


    /**
    * @dev fallback function ***DO NOT OVERRIDE***
    */
    function () external payable {
    
     revert();
     
    }

    /**
    * @dev calling this function will pause the sale
    */
    
    function pause() public onlyOwner {
      require(Paused == false);
      require(crowdSaleStarted == true);
      previousStage=currentStage;
      currentStage=Stages.Pause;
      Paused = true;
    }
  
    function restartSale() public onlyOwner {
      require(currentStage == Stages.Pause);
      currentStage=previousStage;
      Paused = false;
    }

    function startRoundOneSale(uint256 _roundOneTokensForSale, uint256 _tokensPerDollarInCurrentSale) public onlyOwner {

      require(!crowdSaleStarted,'Crowdsale already started');
      require(_tokensPerDollarInCurrentSale > 0);
      require(_roundOneTokensForSale<tokensForSale);
      crowdSaleStarted = true;
      currentStage = Stages.RoundOneStart;
      roundOneTokensForSale = _roundOneTokensForSale.mul(1 ether);
      tokensPerDollarInCurrentSale = _tokensPerDollarInCurrentSale.mul(1 ether);
      
    }

    function endRoundOneSale() public onlyOwner {

      require(currentStage == Stages.RoundOneStart);
      require(roundOneTokensForSale == roundOnetokenSold);
      currentStage = Stages.RoundOneEnd;
      tokensPerDollarInCurrentSale = 0;

    }

    function startRoundTwoSale(uint256 _roundtwoTokensForSale, uint256 _tokensPerDollarInCurrentSale) public onlyOwner {
    
    require(_tokensPerDollarInCurrentSale > 0,'tokens per dollar should be greater then zero');
    require(_roundtwoTokensForSale.add(roundOneTokensForSale)<tokensForSale,'round two tokens sshould be less then token for sale');
    require(currentStage == Stages.RoundOneEnd,'current stage is not round one end');
    currentStage = Stages.RoundtwoStart;
    tokensPerDollarInCurrentSale = _tokensPerDollarInCurrentSale.mul(1 ether);
    roundTwoTokensForSale = _roundtwoTokensForSale.mul(1 ether);   

    }

    function endRoundtwoSale() public onlyOwner {

    require(currentStage == Stages.RoundtwoStart);
    require(roundTwoTokensForSale == roundTwoTokenSold);
    currentStage = Stages.RoundTwoEnd;
    tokensPerDollarInCurrentSale = 0;
   
    }

    function startRoundThreeSale(uint256 _roundThreeTokensForSale, uint256 _tokensPerDollarInCurrentSale) public onlyOwner {

    require(_tokensPerDollarInCurrentSale > 0);
    require(_roundThreeTokensForSale.add(roundOneTokensForSale).add(roundTwoTokensForSale)<tokensForSale);
    require(currentStage == Stages.RoundTwoEnd);
    currentStage = Stages.RoundThreeStart;
    tokensPerDollarInCurrentSale = _tokensPerDollarInCurrentSale.mul(1 ether);
    roundThreeTokensForSale = _roundThreeTokensForSale.mul(1 ether);   

    }

    function endRoundThreeSale() public onlyOwner {

    require(currentStage == Stages.RoundThreeStart);
    require(roundThreeTokensForSale == roundThreeTokenSold);
    currentStage = Stages.RoundThreeEnd;
    tokensPerDollarInCurrentSale = 0;

    }

    function startRoundFourSale(uint256 _roundFourTokensForSale, uint256 _tokensPerDollarInCurrentSale) public onlyOwner {

    require(_tokensPerDollarInCurrentSale > 0);
    require(_roundFourTokensForSale.add(roundOneTokensForSale).add(roundTwoTokensForSale).add(roundThreeTokensForSale)<tokensForSale);
    require(currentStage == Stages.RoundThreeEnd);
    currentStage = Stages.RoundFourStart;
    tokensPerDollarInCurrentSale = _tokensPerDollarInCurrentSale.mul(1 ether);
    roundFourTokensForSale = _roundFourTokensForSale.mul(1 ether);   

    }

    function endRoundFourSale() public onlyOwner {

    require(currentStage == Stages.RoundFourStart);
    require(roundFourTokensForSale == roundFourTokenSold);
    currentStage = Stages.RoundFourEnd;
    tokensPerDollarInCurrentSale = 0;
        
    }


    function getStage() public view returns (string memory) {

    if (currentStage == Stages.RoundOneStart) return 'Round One Start';
    else if (currentStage == Stages.RoundOneEnd) return 'Round One End';
    else if (currentStage == Stages.RoundtwoStart) return 'Round two Start';
    else if (currentStage == Stages.RoundTwoEnd) return 'Round Two End';
    else if (currentStage == Stages.RoundThreeStart) return 'Round Three Start';    
    else if (currentStage == Stages.RoundThreeEnd) return 'Round Three End';   
    else if (currentStage == Stages.RoundFourStart) return 'Round Four Start';    
    else if (currentStage == Stages.RoundFourEnd) return 'Round Four End';
    else if (currentStage == Stages.Pause) return 'paused';
    else if (currentStage == Stages.CrowdSaleNotStarted) return 'CrowdSale Not Started';    

    }
    

   /**
   * @param _beneficiary Address performing the token purchase
   */
   function buyTokens(address _beneficiary,uint256 usdCents) CrowdsaleStarted public {
    require(whitelistedContributors[_beneficiary],'Not white listed');
    require(Paused != true,'Crowdsale is paused');
    _preValidatePurchase(_beneficiary,usdCents);
    uint256 tokens = _getTokenAmount(usdCents);
    _validateCapLimits(usdCents,tokens);
    _processPurchase(_beneficiary,tokens);
    emit TokenPurchase(msg.sender, _beneficiary, usdCents, tokens);

   }
  
   /**
   * @dev Validation of an incoming purchase. Use require statemens to revert state when conditions are not met. Use super to concatenate validations.
   * @param _usdCents Value in usdincents involved in the purchase
   */
   function _preValidatePurchase(address _beneficiary, uint256 _usdCents) internal view { 

    if(accrediatedInvestors[_beneficiary] == true)
    {

        require(_usdCents >= minimumUsdCents && _usdCents <= maximumUsdCentsForAccreditedInvestor,'Either amount is less then minimum or more them maximum for AccreditedInvestor');

    }
    else if(accrediatedInvestors[_beneficiary] == false){

        require(_usdCents >= minimumUsdCents && _usdCents <= maximumUsdCentsForNonAccreditedInvestor,'Either amount is less then minimum or more them maximum for Non AccreditedInvestor');

    }

    }
    
    /**
    * @dev Validation of the capped restrictions.
    * @param _cents cents amount
    */

    function _validateCapLimits(uint256 _cents, uint256 _tokens) internal {

      totalRaisedInCents = totalRaisedInCents.add(_cents);
      require(totalRaisedInCents <= hardCap,'hardcap is reached');

        if (currentStage == Stages.RoundOneStart) 
        {

         roundOnetokenSold = roundOnetokenSold.add(_tokens);
         require(roundOnetokenSold <= roundOneTokensForSale);

        }
        else if (currentStage == Stages.RoundtwoStart) 

        {         
         roundTwoTokenSold = roundTwoTokenSold.add(_tokens);
         require(roundTwoTokenSold <= roundTwoTokensForSale);}
        
        else if (currentStage == Stages.RoundThreeStart)

        {

         roundThreeTokenSold = roundThreeTokenSold.add(_tokens);
         require(roundThreeTokenSold <= roundOneTokensForSale);}

        else if (currentStage == Stages.RoundFourStart) 
        {

         roundFourTokenSold = roundFourTokenSold.add(_tokens);
         require(roundFourTokenSold <= roundFourTokensForSale);}
    

        }
      
   
   
   /**
   * @dev Source of tokens. Override this method to modify the way in which the crowdsale ultimately gets and sends its tokens.
   * @param _beneficiary Address performing the token purchase
   * @param _tokenAmount Number of tokens to be emitted
   */
   function _deliverTokens(address _beneficiary, uint256 _tokenAmount) internal {
    
    if(accrediatedInvestors[_beneficiary]){
        
    require(token.issueTokens(_beneficiary,_tokenAmount,true),'could not be able to deliver tokens');

    }else{

    require(token.issueTokens(_beneficiary,_tokenAmount,false),'could not be able to deliver tokens');
        
    }
    

   }

   /**
   * @dev Executed when a purchase has been validated and is ready to be executed. Not necessarily emits/sends tokens.
   * @param _beneficiary Address receiving the tokens
   * @param _tokenAmount Number of tokens to be purchased
   */
   function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
    _deliverTokens(_beneficiary, _tokenAmount);
   }
  
    /**
    * @param _usdCents Value in usd cents to be converted into tokens
    * @return Number of tokens that can be purchased with the specified _usdCents
    */
    function _getTokenAmount(uint256 _usdCents) CrowdsaleStarted public view returns (uint256) {

    uint256 tokens;

    tokens = _usdCents.div(100).mul(tokensPerDollarInCurrentSale);
    return tokens;
    
    }

    /**
    * @dev finalize the crowdsale.After finalizing ,tokens transfer can be done.
    */
    function finalizeSale() public  onlyOwner {
        require(currentStage == Stages.RoundFourEnd);
        require(token.finalize());
        
    }

    //Usd

}
