const ERC20Mintable = artifacts.require('./ERC20Mintable')
const ProofOfBurn = artifacts.require('./ProofOfBurn')
const { BN, expectRevert } = require('@openzeppelin/test-helpers')
const { expect } = require('chai').use(require('bn-chai'));

contract('ProofOfBurn', (accounts) => {

  const premine = 1000

  beforeEach(async function() {
    this.token = await ERC20Mintable.new()
    await this.token.mint(accounts[0], premine)
    this.burn = await ProofOfBurn.new(this.token.address)    
  })

  it('should initialize with the correct address', async function() {
    expect(await this.burn.token()).to.equal(this.token.address)
  })

  describe('burn', function() {
    context('when there are enough token available', function() {
      beforeEach(async function() {
        await this.token.approve(this.burn.address, premine)
        await this.burn.burn(accounts[1], premine)        
      })

      it('should burn the tokens', async function() {
        expect(await this.token.balanceOf(this.burn.address)).bignumber.to.be.equal(new BN(premine))
      })

      it('should increase paidOut', async function() {
        expect(await this.burn.burned(accounts[1])).bignumber.to.be.equal(new BN(premine))
      })
    })

    context('when there are not enough token available', function() {
      beforeEach(async function() {
        await this.token.approve(this.burn.address, premine - 100)        
      })

      it('should burn the tokens', async function() {
        await expectRevert.unspecified(this.burn.burn(accounts[1], premine))
      })

      it('should not increase paidOut', async function() {
        expect(await this.burn.burned(accounts[1])).bignumber.to.be.equal(new BN(0))
      })
    })
  })

})