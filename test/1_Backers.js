const Backers = artifacts.require('Backers.sol');
const Crowdsale = artifacts.require('Crowdsale.sol');
const { increaseTimeTo, duration } = require('openzeppelin-solidity/test/helpers/increaseTime');
const { latestTime } = require('openzeppelin-solidity/test/helpers/latestTime');
var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var Web3Utils = require('web3-utils');

contract('Backers Contract', async (accounts) => {

  it('Should correctly initialize constructor values of Backers Token Contract', async () => {

    this.tokenhold = await Backers.new(accounts[0], { gas: 600000000 });
    let totalSupply = await this.tokenhold.totalSupply.call();
    let name = await this.tokenhold.name.call();
    let symbol = await this.tokenhold.symbol.call();
    let owner = await this.tokenhold.owner.call();
    let decimal = await this.tokenhold.decimals.call();
    assert.equal(totalSupply / 10 ** 18, 20000000);
    assert.equal(name, 'Backers');
    assert.equal(symbol, 'Backers');
    assert.equal(decimal, 18);
    assert.equal(owner, accounts[0]);

  });

  it('Should check Owner of Token contract', async () => {

    let Owner = await this.tokenhold.owner.call();
    assert.equal(Owner, accounts[0]);
  });

  it('Should check balance of Token contract', async () => {

    var balanceOfContract = await this.tokenhold.balanceOf.call(this.tokenhold.address);
    assert.equal(balanceOfContract / 10 ** 18, 20000000);
  });

  it('Should check name of Token contract', async () => {

    let name = await this.tokenhold.name.call();
    assert.equal(name, 'Backers');
  });

  it('Should check crowdsale started or not in Token contract', async () => {

    let crowdsaleStarted = await this.tokenhold.crowdsaleStarted.call();
    assert.equal(crowdsaleStarted, false);
  });

  it('Should check crowdsale Ended or not in Token contract before starting', async () => {

    let crowdsaleEnded = await this.tokenhold.crowdsaleEnded.call();
    assert.equal(crowdsaleEnded, false);
  });

  it('Should check crowdsale Ended time in Token contract before starting', async () => {

    let crowdSaleEndTime = await this.tokenhold.crowdSaleEndTime.call();
    assert.equal(crowdSaleEndTime, 0);
  });

  it('Should check Symbol of Token contract', async () => {

    let symbol = await this.tokenhold.symbol.call();
    assert.equal(symbol, 'Backers');
  });

  it('Should check decimal of Token contract', async () => {

    let decimal = await this.tokenhold.decimals.call();
    assert.equal(decimal, 18);
  });

  it('Should check crowd Sale Address in Token contract when not set', async () => {

    let crowdSaleAddress = await this.tokenhold.crowdSaleAddress.call();
    assert.equal(crowdSaleAddress, 0x0);
  });

  it("Should Not be able to pause Token contract from Non Owner accounts", async () => {

    try {
      var pauseStatusBefore = await this.tokenhold.paused.call();
      assert.equal(pauseStatusBefore, false);
      await this.tokenhold.pause({ from: accounts[1] });
    } catch (error) {
      var error_ = 'Returned error: VM Exception while processing transaction: revert';
      assert.equal(error.message, error_, 'Reverted ');
    }

  });

  it("Should be able to pause Token contract", async () => {

    var pauseStatusBefore = await this.tokenhold.paused.call();
    assert.equal(pauseStatusBefore, false);
    await this.tokenhold.pause({ from: accounts[0] });
    var pauseStatusAfter = await this.tokenhold.paused.call();
    assert.equal(pauseStatusAfter, true);
  });

  it("Should Not be able to unpause Token contract from Non Owner accounts", async () => {

    try {
      var pauseStatusBefore = await this.tokenhold.paused.call();
      assert.equal(pauseStatusBefore, true);
      await this.tokenhold.unpause({ from: accounts[1] });
    } catch (error) {
      var error_ = 'Returned error: VM Exception while processing transaction: revert';
      assert.equal(error.message, error_, 'Reverted ');
    }

  });

  it("Should be able to unpause Token contract", async () => {

    var pauseStatusBefore = await this.tokenhold.paused.call();
    assert.equal(pauseStatusBefore, true);
    await this.tokenhold.unpause({ from: accounts[0] });
    var pauseStatusAfter = await this.tokenhold.paused.call();
    assert.equal(pauseStatusAfter, false);
  });

  it('Should correctly initialize constructor values of Crowdsale Contract', async () => {

    this.crowdhold = await Crowdsale.new(accounts[0], accounts[1], this.tokenhold.address, { gas: 60000000 });

  });

  it("Should Not Authorize KYC for account 2 from non owner account", async () => {

    try {
      var whiteListAddress = await this.crowdhold.whitelistedContributors.call(accounts[2], { gas: 500000000 });
      assert.equal(whiteListAddress, false, 'not white listed');
      await this.crowdhold.authorizeKyc([accounts[2]], { from: accounts[1] });
    } catch (error) {
      var error_ = 'Returned error: VM Exception while processing transaction: revert';
      assert.equal(error.message, error_, 'Reverted ');
    }

  });

  it("Should Authorize KYC for account 2", async () => {

    var whiteListAddress = await this.crowdhold.whitelistedContributors.call(accounts[2], { gas: 500000000 });
    assert.equal(whiteListAddress, false, 'not white listed');
    await this.crowdhold.authorizeKyc([accounts[2]], { from: accounts[0] });
    var whiteListAddressNow = await this.crowdhold.whitelistedContributors.call(accounts[2]);
    assert.equal(whiteListAddressNow, true, ' now white listed');

  });

  it("Should Authorize KYC for accounts more then one", async () => {

    var whiteListAddress = await this.crowdhold.whitelistedContributors.call(accounts[3], { gas: 500000000 });
    assert.equal(whiteListAddress, false, 'not white listed');
    var whiteListAddressNext = await this.crowdhold.whitelistedContributors.call(accounts[4], { gas: 500000000 });
    assert.equal(whiteListAddressNext, false, 'not white listed');
    await this.crowdhold.authorizeKyc([accounts[3], accounts[4]], { from: accounts[0] });
    var whiteListAddressNow = await this.crowdhold.whitelistedContributors.call(accounts[3]);
    assert.equal(whiteListAddressNow, true, ' now white listed');
    var whiteListAddressNowNew = await this.crowdhold.whitelistedContributors.call(accounts[4]);
    assert.equal(whiteListAddressNowNew, true, ' now white listed');

  });

  it("Should Not Authorize accrediated for account 2 from non owner account", async () => {

    try {
      var accrediatedInvestors = await this.crowdhold.accrediatedInvestors.call(accounts[2], { gas: 500000000 });
      assert.equal(accrediatedInvestors, false, 'not white listed');
      await this.crowdhold.approveAccrediatedInvestors([accounts[2]], { from: accounts[1] });
    } catch (error) {
      var error_ = 'Returned error: VM Exception while processing transaction: revert';
      assert.equal(error.message, error_, 'Reverted ');
    }

  });

  it("Should add investor to accrediated investor list for account 2", async () => {

    var accrediatedInvestors = await this.crowdhold.accrediatedInvestors.call(accounts[2], { gas: 500000000 });
    assert.equal(accrediatedInvestors, false, 'not white listed');
    await this.crowdhold.approveAccrediatedInvestors([accounts[2]], { from: accounts[0] });
    var accrediatedInvestorsNow = await this.crowdhold.accrediatedInvestors.call(accounts[2]);
    assert.equal(accrediatedInvestorsNow, true, ' now white listed');

  });

  it('Should check hard cap of sale', async () => {

    let hardCap = await this.crowdhold.hardCap.call();
    assert.equal(hardCap / 10 ** 2, 6000);
  });

  it('Should check Owner of crowdsale contract', async () => {

    let Owner = await this.crowdhold.owner.call();
    assert.equal(Owner, accounts[0]);
  });

  it('Should check wallet of crowdsale contract', async () => {

    let wallet = await this.crowdhold.wallet.call();
    assert.equal(wallet, accounts[1]);
  });

  it('Should check token of crowdsale contract', async () => {

    let token = await this.crowdhold.token.call();
    assert.equal(token, this.tokenhold.address);
  });

  it('Should check stage of crowdsale contract', async () => {

    let currentStage = await this.crowdhold.getStage();
    assert.equal(currentStage, 'CrowdSale Not Started');
  });

  it('Should check minimum Usd Cents of Investment for all investors', async () => {

    let minimumUsdCents = await this.crowdhold.minimumUsdCents();
    assert.equal(minimumUsdCents / 100, 300);
  });

  it('Should check maximum Usd Cents For Non Accredited Investor', async () => {

    let maximumUsdCentsForNonAccreditedInvestor = await this.crowdhold.maximumUsdCentsForNonAccreditedInvestor();
    assert.equal(maximumUsdCentsForNonAccreditedInvestor / 100, 2500);
  });

  it('Should check maximum Usd Cents For Accredited Investor', async () => {

    let maximumUsdCentsForAccreditedInvestor = await this.crowdhold.maximumUsdCentsForAccreditedInvestor();
    assert.equal(maximumUsdCentsForAccreditedInvestor / 100, 25000);
  });

  it('Should check total Raised In Cents before crowdsale started', async () => {

    let totalRaisedInCents = await this.crowdhold.totalRaisedInCents();
    assert.equal(totalRaisedInCents, 0);
  });

  it('Should check crowdSaleStarted or not', async () => {

    let crowdSaleStarted = await this.crowdhold.crowdSaleStarted();
    assert.equal(crowdSaleStarted, false);
  });

  it('Should check round One token Sold before crowdsale started', async () => {

    let roundOnetokenSold = await this.crowdhold.roundOnetokenSold();
    assert.equal(roundOnetokenSold, 0);
  });

  it('Should check round Two token Sold before crowdsale started', async () => {

    let roundTwoTokenSold = await this.crowdhold.roundTwoTokenSold();
    assert.equal(roundTwoTokenSold, 0);
  });

  it('Should check round Three token Sold before crowdsale started', async () => {

    let roundThreeTokenSold = await this.crowdhold.roundThreeTokenSold();
    assert.equal(roundThreeTokenSold, 0);
  });

  it('Should check round Four token Sold before crowdsale started', async () => {

    let roundFourTokenSold = await this.crowdhold.roundFourTokenSold();
    assert.equal(roundFourTokenSold, 0);
  });

  it('Should check tokens Per Dollar In Current Sale before crowdsale started', async () => {

    let tokensPerDollarInCurrentSale = await this.crowdhold.tokensPerDollarInCurrentSale();
    assert.equal(tokensPerDollarInCurrentSale, 0);
  });

  it('Should check round One Tokens For Sale before crowdsale Round one is started', async () => {

    let roundOneTokensForSale = await this.crowdhold.roundOneTokensForSale();
    assert.equal(roundOneTokensForSale / 10 ** 18, 0);
  });

  it('Should check round Two Tokens For Sale before crowdsale Round one is started', async () => {

    let roundTwoTokensForSale = await this.crowdhold.roundTwoTokensForSale();
    assert.equal(roundTwoTokensForSale / 10 ** 18, 0);
  });

  it('Should check round Three Tokens For Sale before crowdsale Round one is started', async () => {

    let roundThreeTokensForSale = await this.crowdhold.roundThreeTokensForSale();
    assert.equal(roundThreeTokensForSale / 10 ** 18, 0);
  });

  it('Should check round Four Tokens For Sale before crowdsale Round one is started', async () => {

    let roundFourTokensForSale = await this.crowdhold.roundFourTokensForSale();
    assert.equal(roundFourTokensForSale / 10 ** 18, 0);
  });

  it("Should Not be able to pause Crowdsale contract when sale is not started", async () => {

    try {

      let crowdSaleStarted = await this.crowdhold.crowdSaleStarted();
      assert.equal(crowdSaleStarted, false);
      await this.crowdhold.pause({ from: accounts[0] });
    } catch (error) {

      var error_ = 'Returned error: VM Exception while processing transaction: revert';
      assert.equal(error.message, error_, 'Reverted ');
    }

  });

  it("Should Not be able to restart Crowdsale contract when sale is not paused", async () => {

    try {

      let crowdSaleStarted = await this.crowdhold.crowdSaleStarted();
      assert.equal(crowdSaleStarted, false);
      let currentStage = await this.crowdhold.getStage();
      assert.equal(currentStage, 'CrowdSale Not Started');
      await this.crowdhold.restartSale({ from: accounts[0] });
    } catch (error) {

      var error_ = 'Returned error: VM Exception while processing transaction: revert';
      assert.equal(error.message, error_, 'Reverted ');
    }

  });

  it("Should Not Activate Sale contract by Non Owner ", async () => {

    try {
      await this.tokenhold.setCrowdSaleAddress(this.crowdhold.address, { gas: 500000000, from: accounts[1] });
      let crowdSaleAddress = await this.tokenhold.crowdSaleAddress.call();
      assert.equal(crowdSaleAddress, this.crowdhold.address);

    } catch (error) {

      var error_ = 'Returned error: VM Exception while processing transaction: revert';
      assert.equal(error.message, error_, 'Reverted ');
    }

  });

  it("Should Activate Sale contract by Crowdsale Owner only", async () => {
    let crowdSaleAddress = await this.tokenhold.crowdSaleAddress.call();
    assert.equal(crowdSaleAddress, 0x0);
    await this.tokenhold.setCrowdSaleAddress(this.crowdhold.address, { gas: 500000000, from: accounts[0] });

  });

  it("Should check Sale contract address in token contract", async () => {

    let crowdSaleAddress = await this.tokenhold.crowdSaleAddress.call();
    assert.equal(crowdSaleAddress, this.crowdhold.address);

  });

  it("Should Not be able to Start CrowdSale by Non Owner Account", async () => {

    try {
      var noOfTokenForFirstRound = 5000000;
      var getTheStagebefore = await this.crowdhold.getStage.call();
      var stageBefore = 'CrowdSale Not Started';
      assert.equal(getTheStagebefore, stageBefore);
      await this.crowdhold.startRoundOneSale(noOfTokenForFirstRound, 20, { from: accounts[1], gas: 500000000 });
    } catch (error) {

      var error_ = 'Returned error: VM Exception while processing transaction: revert';
      assert.equal(error.message, error_, 'Reverted ');
    }

  });

  it("Should be able to Start CrowdSale ", async () => {
    var noOfTokenForFirstRound = 20000;
    var getTheStagebefore = await this.crowdhold.getStage.call();
    var stageBefore = 'CrowdSale Not Started';
    assert.equal(getTheStagebefore, stageBefore);
    await this.crowdhold.startRoundOneSale(noOfTokenForFirstRound, 20, { from: accounts[0], gas: 500000000 });
    var getTheStage = await this.crowdhold.getStage.call();
    var _presale = 'Round One Start';
    assert.equal(getTheStage, _presale);

  });

  it('Should check stage of crowdsale contract after crowdsale is started', async () => {

    let currentStage = await this.crowdhold.getStage();
    assert.equal(currentStage, 'Round One Start');
  });

  it('Should check tokens Per Dollar In Current Sale after crowdsale Round one is started', async () => {

    let tokensPerDollarInCurrentSale = await this.crowdhold.tokensPerDollarInCurrentSale();
    assert.equal(tokensPerDollarInCurrentSale / 10 ** 18, 20);
  });

  it('Should check round One Tokens For Sale after crowdsale Round one is started', async () => {

    let roundOneTokensForSale = await this.crowdhold.roundOneTokensForSale();
    assert.equal(roundOneTokensForSale / 10 ** 18, 20000);
  });

  it("Should Not be able to End CrowdSale before all tokens not sell", async () => {

    try {
      var getTheStage = await this.crowdhold.getStage.call();
      var _presale = 'Round One Start';
      assert.equal(getTheStage, _presale);
      await this.crowdhold.endRoundOneSale({ from: accounts[0], gas: 500000000 });
    } catch (error) {

      var error_ = 'Returned error: VM Exception while processing transaction: revert';
      assert.equal(error.message, error_, 'Reverted ');
    }

  });

  it("Should check balance of Crowdsale after, crowdsale activate from token contract", async () => {

    var balanceOftokenContract = await this.tokenhold.balanceOf.call(this.tokenhold.address);
    assert.equal(balanceOftokenContract / 10 ** 18, 20000000);

  });

  it("Should Not be able to buy Tokens according to Round one by Non Accrediated investor, investment less then minimum amount", async () => {

    try {
      var balanceOfAccountTwo = await this.tokenhold.balanceOf.call(accounts[2]);
      assert.equal(balanceOfAccountTwo.toNumber() / 10 ** 18, 0);

      let roundOneTokensForSale = await this.crowdhold.roundOneTokensForSale();
      assert.equal(roundOneTokensForSale / 10 ** 18, 20000);

      await this.crowdhold.buyTokens(accounts[2], 10000, { from: accounts[0] });
    } catch (error) {

      var error_ = 'Returned error: VM Exception while processing transaction: revert Either amount is less then minimum or more them maximum for AccreditedInvestor -- Reason given: Either amount is less then minimum or more them maximum for AccreditedInvestor.';
      assert.equal(error.message, error_, 'Reverted ');
    }

  });

  it("Should Not be able to buy Tokens according to Round one by Non Accrediated investor,investment More then maximum amount", async () => {

    try {

      var balanceOfAccountTwo = await this.tokenhold.balanceOf.call(accounts[2]);
      assert.equal(balanceOfAccountTwo.toNumber() / 10 ** 18, 0);

      let roundOneTokensForSale = await this.crowdhold.roundOneTokensForSale();
      assert.equal(roundOneTokensForSale / 10 ** 18, 20000);

      await this.crowdhold.buyTokens(accounts[2], 5000000, { from: accounts[0] });
    } catch (error) {

      var error_ = 'Returned error: VM Exception while processing transaction: revert Either amount is less then minimum or more them maximum for AccreditedInvestor -- Reason given: Either amount is less then minimum or more them maximum for AccreditedInvestor.';
      assert.equal(error.message, error_, 'Reverted ');
    }

  });

  it("Should be able to buy Tokens  according to Round one by Accrediated investor", async () => {

    var balanceOfAccountTwo = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceOfAccountTwo.toNumber() / 10 ** 18, 0);

    let roundOneTokensForSale = await this.crowdhold.roundOneTokensForSale();
    assert.equal(roundOneTokensForSale / 10 ** 18, 20000);

    await this.crowdhold.buyTokens(accounts[2], 50000, { from: accounts[0] });

  });

  it("Should check account balance", async () => {

    var balanceOfAccountTwo = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceOfAccountTwo / 10 ** 18, 10000);

  });

  it("Should check white list for account 2 in tokens", async () => {

    var whitelistedContributors = await this.tokenhold.whitelistedContributors.call(accounts[2], { gas: 500000000 });
    assert.equal(whitelistedContributors, true, 'not white listed');

  });

  it("Should be able to buy Tokens  according to Round one by Non Accrediated investor", async () => {

    var balanceOfAccountTwo = await this.tokenhold.balanceOf.call(accounts[3]);
    assert.equal(balanceOfAccountTwo / 10 ** 18, 0);

    let roundOneTokensForSale = await this.crowdhold.roundOneTokensForSale();
    assert.equal(roundOneTokensForSale / 10 ** 18, 20000);

    let roundOneTokensSold = await this.crowdhold.roundOnetokenSold();
    assert.equal(roundOneTokensSold / 10 ** 18, 10000);

    await this.crowdhold.buyTokens(accounts[3], 50000, { from: accounts[0] });

  });

  it("Should check account balance of Non Accrediated Investor", async () => {

    var balanceOfAccountThree = await this.tokenhold.balanceOf.call(accounts[3]);
    assert.equal(balanceOfAccountThree / 10 ** 18, 10000);

  });

  it("Should check tokens left", async () => {

    let roundOneTokensForSale = await this.crowdhold.roundOneTokensForSale();
    assert.equal(roundOneTokensForSale / 10 ** 18, 20000);
    let roundOnetokenSold = await this.crowdhold.roundOnetokenSold();
    assert.equal(roundOnetokenSold / 10 ** 18, 20000);

  });

  it("Should be able to End CrowdSale ", async () => {

    let roundOneTokensForSale = await this.crowdhold.roundOneTokensForSale();
    assert.equal(roundOneTokensForSale / 10 ** 18, 20000);
    let roundOnetokenSold = await this.crowdhold.roundOnetokenSold();
    assert.equal(roundOnetokenSold / 10 ** 18, 20000);
    var getTheStagebefore = await this.crowdhold.getStage.call();
    var stageBefore = 'Round One Start';
    assert.equal(getTheStagebefore, stageBefore);
    await this.crowdhold.endRoundOneSale({ from: accounts[0], gas: 500000000 });
    let currentStage = await this.crowdhold.getStage();
    assert.equal(currentStage, 'Round One End');

  });

  it('Should check stage of crowdsale contract after round one is ended', async () => {

    let currentStage = await this.crowdhold.getStage();
    assert.equal(currentStage, 'Round One End');
  });

  it('Should check tokens Per Dollar In Current Sale after crowdsale Round one is started', async () => {

    let tokensPerDollarInCurrentSale = await this.crowdhold.tokensPerDollarInCurrentSale();
    assert.equal(tokensPerDollarInCurrentSale, 0);
  });

  it("Should be able to Start CrowdSale round two ", async () => {

    var noOfTokenForSecondRound = 20000;
    var getTheStagebefore = await this.crowdhold.getStage.call();
    var stageBefore = 'Round One End';
    assert.equal(getTheStagebefore, stageBefore);
    await this.crowdhold.startRoundTwoSale(noOfTokenForSecondRound, 10, { from: accounts[0], gas: 500000000 });
    var getTheStage = await this.crowdhold.getStage.call();
    var _presale = 'Round two Start';
    assert.equal(getTheStage, _presale);

  });

  it('Should check stage of crowdsale contract after round two is started', async () => {

    let currentStage = await this.crowdhold.getStage();
    assert.equal(currentStage, 'Round two Start');
  });

  it('Should check tokens Per Dollar In Current Sale after crowdsale round two is started', async () => {

    let tokensPerDollarInCurrentSale = await this.crowdhold.tokensPerDollarInCurrentSale();
    assert.equal(tokensPerDollarInCurrentSale / 10 ** 18, 10);
  });

  it('Should check round two Tokens For Sale after crowdsale round two is started', async () => {

    let roundTwoTokensForSale = await this.crowdhold.roundTwoTokensForSale();
    assert.equal(roundTwoTokensForSale / 10 ** 18, 20000);
  });

  it("Should check account balance", async () => {

    var balanceOfAccountTwo = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceOfAccountTwo / 10 ** 18, 10000);

  });

  it("Should be able to buy Tokens according to Round Two by Accrediated investor", async () => {

    var balanceOfAccountTwo = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceOfAccountTwo / 10 ** 18, 10000);

    let roundOneTokensForSale = await this.crowdhold.roundTwoTokensForSale();
    assert.equal(roundOneTokensForSale / 10 ** 18, 20000);

    await this.crowdhold.buyTokens(accounts[2], 100000, { from: accounts[0] });

  });

  it("Should check account balance", async () => {

    var balanceOfAccountTwo = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceOfAccountTwo / 10 ** 18, 20000);

  });

  it("Should be able to buy Tokens  according to Round two by Non Accrediated investor", async () => {

    let roundOneTokensForSale = await this.crowdhold.roundTwoTokensForSale();
    assert.equal(roundOneTokensForSale / 10 ** 18, 20000);

    let roundOneTokensSold = await this.crowdhold.roundTwoTokenSold();
    assert.equal(roundOneTokensSold / 10 ** 18, 10000);

    await this.crowdhold.buyTokens(accounts[3], 100000, { from: accounts[0] });

  });

  it("Should check account balance of Non Accrediated Investor", async () => {

    var balanceOfAccountThree = await this.tokenhold.balanceOf.call(accounts[3]);
    assert.equal(balanceOfAccountThree / 10 ** 18, 20000);

  });

  it('Should check round two Tokens sold after crowdsale round two is started', async () => {

    let roundTwoTokenSold = await this.crowdhold.roundTwoTokenSold();
    assert.equal(roundTwoTokenSold / 10 ** 18, 20000);
  });

  it("Should check tokens left", async () => {

    let roundTwoTokensForSale = await this.crowdhold.roundTwoTokensForSale();
    assert.equal(roundTwoTokensForSale / 10 ** 18, 20000);
    let roundTwoTokenSold = await this.crowdhold.roundTwoTokenSold();
    assert.equal(roundTwoTokenSold / 10 ** 18, 20000);

  });

  it("Should be able to End CrowdSale Round two", async () => {

    let roundTwoTokensForSale = await this.crowdhold.roundTwoTokensForSale();
    assert.equal(roundTwoTokensForSale / 10 ** 18, 20000);
    let roundTwoTokenSold = await this.crowdhold.roundTwoTokenSold();
    assert.equal(roundTwoTokenSold / 10 ** 18, 20000);
    var getTheStagebefore = await this.crowdhold.getStage.call();
    var stageBefore = 'Round two Start';
    assert.equal(getTheStagebefore, stageBefore);
    await this.crowdhold.endRoundtwoSale({ from: accounts[0], gas: 500000000 });
    let currentStage = await this.crowdhold.getStage();
    assert.equal(currentStage, 'Round Two End');

  });

  it('Should check stage of crowdsale contract after round one is ended', async () => {

    let currentStage = await this.crowdhold.getStage();
    assert.equal(currentStage, 'Round Two End');
  });

  it('Should check tokens Per Dollar In Current Sale after crowdsale Round one is started', async () => {

    let tokensPerDollarInCurrentSale = await this.crowdhold.tokensPerDollarInCurrentSale();
    assert.equal(tokensPerDollarInCurrentSale, 0);
  });

  it("Should be able to Start CrowdSale round Three ", async () => {

    var noOfTokenForThreeRound = 20000;
    var getTheStagebefore = await this.crowdhold.getStage.call();
    var stageBefore = 'Round Two End';
    assert.equal(getTheStagebefore, stageBefore);
    await this.crowdhold.startRoundThreeSale(noOfTokenForThreeRound, 10, { from: accounts[0], gas: 500000000 });
    var getTheStage = await this.crowdhold.getStage.call();
    var _presale = 'Round Three Start';
    assert.equal(getTheStage, _presale);

  });

  it('Should check stage of crowdsale contract after round Three is started', async () => {

    let currentStage = await this.crowdhold.getStage();
    assert.equal(currentStage, 'Round Three Start');
  });

  it('Should check tokens Per Dollar In Current Sale after crowdsale round two is started', async () => {

    let tokensPerDollarInCurrentSale = await this.crowdhold.tokensPerDollarInCurrentSale();
    assert.equal(tokensPerDollarInCurrentSale / 10 ** 18, 10);
  });

  it('Should check round two Tokens For Sale after crowdsale round two is started', async () => {

    let roundThreeTokensForSale = await this.crowdhold.roundThreeTokensForSale();
    assert.equal(roundThreeTokensForSale / 10 ** 18, 20000);
  });

  it("Should check account balance", async () => {

    var balanceOfAccountTwo = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceOfAccountTwo / 10 ** 18, 20000);

  });

  it("Should be able to buy Tokens according to Round Three by Accrediated investor", async () => {

    var balanceOfAccountTwo = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceOfAccountTwo / 10 ** 18, 20000);

    let roundOneTokensForSale = await this.crowdhold.roundTwoTokensForSale();
    assert.equal(roundOneTokensForSale / 10 ** 18, 20000);

    await this.crowdhold.buyTokens(accounts[2], 100000, { from: accounts[0] });

  });

  it("Should check account balance", async () => {

    var balanceOfAccountTwo = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceOfAccountTwo / 10 ** 18, 30000);

  });

  it("Should be able to buy Tokens according to Round two by Non Accrediated investor", async () => {

    let roundThreeTokensForSale = await this.crowdhold.roundThreeTokensForSale();
    assert.equal(roundThreeTokensForSale / 10 ** 18, 20000);

    let roundThreeTokenSold = await this.crowdhold.roundThreeTokenSold();
    assert.equal(roundThreeTokenSold / 10 ** 18, 10000);

    await this.crowdhold.buyTokens(accounts[3], 100000, { from: accounts[0] });

  });

  it("Should check account balance of Non Accrediated Investor", async () => {

    var balanceOfAccountThree = await this.tokenhold.balanceOf.call(accounts[3]);
    assert.equal(balanceOfAccountThree / 10 ** 18, 30000);

  });

  it('Should check round two Tokens sold after crowdsale round two is started', async () => {

    let roundTwoTokenSold = await this.crowdhold.roundThreeTokenSold();
    assert.equal(roundTwoTokenSold / 10 ** 18, 20000);
  });

  it("Should check tokens left", async () => {

    let roundTwoTokensForSale = await this.crowdhold.roundThreeTokensForSale();
    assert.equal(roundTwoTokensForSale / 10 ** 18, 20000);
    let roundTwoTokenSold = await this.crowdhold.roundThreeTokenSold();
    assert.equal(roundTwoTokenSold / 10 ** 18, 20000);

  });

  it("Should be able to End CrowdSale Round Three", async () => {

    let roundTwoTokensForSale = await this.crowdhold.roundThreeTokensForSale();
    assert.equal(roundTwoTokensForSale / 10 ** 18, 20000);
    let roundTwoTokenSold = await this.crowdhold.roundThreeTokenSold();
    assert.equal(roundTwoTokenSold / 10 ** 18, 20000);
    var getTheStagebefore = await this.crowdhold.getStage.call();
    var stageBefore = 'Round Three Start';
    assert.equal(getTheStagebefore, stageBefore);
    await this.crowdhold.endRoundThreeSale({ from: accounts[0], gas: 500000000 });
    let currentStage = await this.crowdhold.getStage();
    assert.equal(currentStage, 'Round Three End');

  });

  it('Should check stage of crowdsale contract after round Three is ended', async () => {

    let currentStage = await this.crowdhold.getStage();
    assert.equal(currentStage, 'Round Three End');
  });

  it('Should check tokens Per Dollar In Current Sale after crowdsale Round Three is started', async () => {

    let tokensPerDollarInCurrentSale = await this.crowdhold.tokensPerDollarInCurrentSale();
    assert.equal(tokensPerDollarInCurrentSale, 0);
  });

  it("Should be able to Start CrowdSale round Four ", async () => {

    var noOfTokenForFourRound = 19940000;
    var getTheStagebefore = await this.crowdhold.getStage.call();
    var stageBefore = 'Round Three End';
    assert.equal(getTheStagebefore, stageBefore);
    await this.crowdhold.startRoundFourSale(noOfTokenForFourRound, 19940, { from: accounts[0], gas: 500000000 });
    var getTheStage = await this.crowdhold.getStage.call();
    var _presale = 'Round Four Start';
    assert.equal(getTheStage, _presale);

  });

  it('Should check stage of crowdsale contract after round Three is started', async () => {

    let currentStage = await this.crowdhold.getStage();
    assert.equal(currentStage, 'Round Four Start');
  });

  it('Should check tokens Per Dollar In Current Sale after crowdsale round two is started', async () => {

    let tokensPerDollarInCurrentSale = await this.crowdhold.tokensPerDollarInCurrentSale();
    assert.equal(tokensPerDollarInCurrentSale / 10 ** 18, 19940);
  });

  it('Should check round two Tokens For Sale after crowdsale round two is started', async () => {

    let roundFourTokensForSale = await this.crowdhold.roundFourTokensForSale();
    assert.equal(roundFourTokensForSale / 10 ** 18, 19940000);
  });

  it("Should check account balance", async () => {

    var balanceOfAccountTwo = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceOfAccountTwo / 10 ** 18, 30000);

  });

  it("Should be able to buy Tokens according to Round Four by Accrediated investor", async () => {

    var balanceOfAccountTwo = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceOfAccountTwo / 10 ** 18, 30000);

    let roundOneTokensForSale = await this.crowdhold.roundFourTokensForSale();
    assert.equal(roundOneTokensForSale / 10 ** 18, 19940000);

    await this.crowdhold.buyTokens(accounts[2], 50000, { from: accounts[0] });

  });

  it("Should check account balance of account[2]", async () => {

    var balanceOfAccountTwo = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceOfAccountTwo / 10 ** 18, 10000000);

  });

  it("Should be able to buy Tokens according to Round Four by Non Accrediated investor", async () => {

    let roundOneTokensForSale = await this.crowdhold.roundFourTokensForSale();
    assert.equal(roundOneTokensForSale / 10 ** 18, 19940000);

    let roundFourTokenSold = await this.crowdhold.roundFourTokenSold();
    assert.equal(roundFourTokenSold / 10 ** 18, 9970000);

    await this.crowdhold.buyTokens(accounts[3], 50000, { from: accounts[0] });

  });

  it("Should check account balance of Non Accrediated Investor", async () => {

    var balanceOfAccountThree = await this.tokenhold.balanceOf.call(accounts[3]);
    assert.equal(balanceOfAccountThree / 10 ** 18, 10000000);

  });

  it('Should check round two Tokens sold after crowdsale round Four is started', async () => {

    let roundTwoTokenSold = await this.crowdhold.roundFourTokenSold();
    assert.equal(roundTwoTokenSold / 10 ** 18, 19940000);
  });

  it("Should check tokens left", async () => {

    let roundTwoTokensForSale = await this.crowdhold.roundFourTokensForSale();
    assert.equal(roundTwoTokensForSale / 10 ** 18, 19940000);
    let roundTwoTokenSold = await this.crowdhold.roundFourTokenSold();
    assert.equal(roundTwoTokenSold / 10 ** 18, 19940000);

  });

  it("Should be able to End CrowdSale Round Four", async () => {

    let roundTwoTokensForSale = await this.crowdhold.roundThreeTokensForSale();
    assert.equal(roundTwoTokensForSale / 10 ** 18, 20000);
    let roundTwoTokenSold = await this.crowdhold.roundThreeTokenSold();
    assert.equal(roundTwoTokenSold / 10 ** 18, 20000);
    var getTheStagebefore = await this.crowdhold.getStage.call();
    var stageBefore = 'Round Four Start';
    assert.equal(getTheStagebefore, stageBefore);
    await this.crowdhold.endRoundFourSale({ from: accounts[0], gas: 500000000 });
    let currentStage = await this.crowdhold.getStage();
    assert.equal(currentStage, 'Round Four End');

  });

  it("Should be able to finalize sale", async () => {

    let currentStage = await this.crowdhold.getStage();
    assert.equal(currentStage, 'Round Four End');
    await this.crowdhold.finalizeSale({ from: accounts[0], gas: 500000000 });
  });

  it("Should Not be able to Start CrowdSale ", async () => {

    try {

      let currentStage = await this.crowdhold.getStage();
      assert.equal(currentStage, 'Round Four End');
      await this.crowdhold.startRoundOneSale(100, 20, { from: accounts[0], gas: 500000000 });
    } catch (error) {

      var error_ = 'Returned error: VM Exception while processing transaction: revert Crowdsale already started -- Reason given: Crowdsale already started.';
      assert.equal(error.message, error_, 'Reverted ');

    }

  });

  it("Should be able to check hard cap and total raised", async () => {

    let totalRaisedInCents = await this.crowdhold.totalRaisedInCents.call();
    assert.equal(totalRaisedInCents / 10 ** 2, 6000);
    let hardCap = await this.crowdhold.hardCap.call();
    assert.equal(hardCap / 10 ** 2, 6000);

  });

  it('Should check crowdsale started or not in Token contract after crowdsale is over', async () => {

    let crowdsaleStarted = await this.tokenhold.crowdsaleStarted.call();
    assert.equal(crowdsaleStarted, true);
  });

  it('Should check crowdsale Ended or not in Token contract before starting', async () => {

    let crowdsaleEnded = await this.tokenhold.crowdsaleEnded.call();
    assert.equal(crowdsaleEnded, true);
  });

  it("Should Not be able to transfer tokens before 6 months", async () => {

    try {
      var balanceOfAccountThree = await this.tokenhold.balanceOf.call(accounts[3]);
      assert.equal(balanceOfAccountThree / 10 ** 18, 10000000);
      await this.tokenhold.transfer(accounts[2], 20000, { from: accounts[3], gas: 500000000 });
    } catch (error) {
      var error_ = 'Returned error: VM Exception while processing transaction: revert Lock period is not ended -- Reason given: Lock period is not ended.';
      assert.equal(error.message, error_, 'Reverted ');
    }


  });

  it("Should be able to trasfer tokens after vesting Period is over ", async () => {
    let tokenToTransfer = 100 * 10 ** 18;
    this.openingTime = (await latestTime());
    await increaseTimeTo(this.openingTime + duration.seconds(15552000));

    var balanceReciver = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceReciver / 10 ** 18, 10000000);

    var balanceSender = await this.tokenhold.balanceOf.call(accounts[3]);
    assert.equal(balanceSender / 10 ** 18, 10000000);

    await this.tokenhold.transfer(accounts[3], Web3Utils.toHex(tokenToTransfer), { from: accounts[2], gas: 5000000 });

    var balanceReciverLater = await this.tokenhold.balanceOf.call(accounts[3]);
    assert.equal(balanceReciverLater / 10 ** 18, 10000100);

    var balanceSenderLater = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceSenderLater / 10 ** 18, 9999900);

  });

  it("Should check white list for account 2 in tokens", async () => {

    var whitelistedContributors = await this.tokenhold.whitelistedContributors.call(accounts[2], { gas: 500000000 });
    assert.equal(whitelistedContributors, true, 'not white listed');

  });

  it("Should check white list for account 2 in tokens", async () => {

    var whitelistedContributors = await this.tokenhold.whitelistedContributors.call(accounts[3], { gas: 500000000 });
    assert.equal(whitelistedContributors, true, 'not white listed');

  });

  it("Should be able to trasfer tokens forecly from one account to another account by Non owner account", async () => {

    try {
      let tokenToTransfer = 100 * 10 ** 18;
      var balanceReciver = await this.tokenhold.balanceOf.call(accounts[3]);
      assert.equal(balanceReciver / 10 ** 18, 10000100);

      var balanceSender = await this.tokenhold.balanceOf.call(accounts[2]);
      assert.equal(balanceSender / 10 ** 18, 9999900);

      await this.tokenhold.forceTransfer(accounts[3], accounts[2], Web3Utils.toHex(tokenToTransfer), { from: accounts[1], gas: 5000000 });
    } catch (error) {
      var error_ = 'Returned error: VM Exception while processing transaction: revert';
      assert.equal(error.message, error_, 'Reverted ');
    }


  });

  it("Should be able to trasfer tokens forecly from one account to another account by owner only", async () => {

    let tokenToTransfer = 100 * 10 ** 18;
    var balanceReciver = await this.tokenhold.balanceOf.call(accounts[3]);
    assert.equal(balanceReciver / 10 ** 18, 10000100);

    var balanceSender = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceSender / 10 ** 18, 9999900);

    await this.tokenhold.forceTransfer(accounts[3], accounts[2], Web3Utils.toHex(tokenToTransfer), { from: accounts[0], gas: 5000000 });

    var balanceReciverLater = await this.tokenhold.balanceOf.call(accounts[3]);
    assert.equal(balanceReciverLater / 10 ** 18, 10000000);

    var balanceSenderLater = await this.tokenhold.balanceOf.call(accounts[2]);
    assert.equal(balanceSenderLater / 10 ** 18, 10000000);

  });

  it("Should check white list for account 2 in tokens and freeze it", async () => {

    var whitelistedContributors = await this.tokenhold.whitelistedContributors.call(accounts[3], { gas: 500000000 });
    assert.equal(whitelistedContributors, true, 'not white listed');

    await this.tokenhold.freezeAccount(accounts[3], false, { gas: 500000000, from: accounts[0] });

    var freezeAccount = await this.tokenhold.whitelistedContributors.call(accounts[3], { gas: 500000000 });
    assert.equal(freezeAccount, false, 'white listed');
  });

})

