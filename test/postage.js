const utils = require('ethereumjs-util')
const ERC20Mintable = artifacts.require('./ERC20Mintable')
const Postage = artifacts.require('./Postage')
const ProofOfBurn = artifacts.require('./ProofOfBurn')
const { time, constants } = require('@openzeppelin/test-helpers')

function sign(hash, privateKey) {
  const { r, s, v } = utils.ecsign(Buffer.from(hash.substring(2), "hex"), Buffer.from(privateKey.substring(2), "hex"))
  return Buffer.concat([r, s, Buffer.from([v])])
}

contract('Postage', (accounts) => {

  const payloadHash = "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"

  beforeEach(async function() {
    const token = await ERC20Mintable.new()
    await token.mint(accounts[0], 1000)
    const burn = await ProofOfBurn.new(token.address)
    const postage = await Postage.new(burn.address)
    this.contracts = { token, burn, postage }
    this.timestamp = await time.latest()
  })

  it('should initialize with the correct address', async function() {
    expect(await this.contracts.postage.burn()).to.equal(this.contracts.burn.address)
  })

  testPostage = async function ({ 
    payloadHash,
    beginValidity,
    endValidity,
    postagePaid,
    witnessAccount,
    contracts,
    payment,
    witnessType = 0
  }, expected) {
    const { token, burn, postage } = contracts

    const encoded = await web3.eth.abi.encodeParameters(["bytes32", "uint256", "uint256", "uint256"], [payloadHash, postagePaid, beginValidity, endValidity])    
    const signed = sign(web3.utils.keccak256(encoded), witnessAccount.privateKey)

    if(payment != 0) {
      await token.approve(burn.address, payment)
      await burn.burn(witnessAccount.address, payment, {from: accounts[0]})
    }

    expect(await postage.postage(payloadHash, postagePaid, beginValidity, endValidity, witnessType, signed)).to.equal(expected)
  }  

  it('should accept a valid type 0 witness', async function() {    
    await testPostage({
      payloadHash,
      beginValidity: this.timestamp - 10,
      endValidity: this.timestamp + 10,
      postagePaid: 100,
      payment: 100,
      witnessAccount: web3.eth.accounts.create(),
      contracts: this.contracts
    }, true)
  })

  it('should not accept an expired type 0 witness', async function() {    
    await testPostage({
      payloadHash,
      beginValidity: this.timestamp - 10,
      endValidity: this.timestamp - 5,
      postagePaid: 100,
      payment: 100,
      witnessAccount: web3.eth.accounts.create(),
      contracts: this.contracts
    }, false)
  })

  it('should not accept a not yet valid type 0 witness', async function() {    
    await testPostage({
      payloadHash,
      beginValidity: this.timestamp + 5,
      endValidity: this.timestamp + 10,
      postagePaid: 100,
      payment: 100,
      witnessAccount: web3.eth.accounts.create(),
      contracts: this.contracts
    }, false)
  })

  it('should not accept an unpaid type 0 witness', async function() {    
    await testPostage({
      payloadHash,
      beginValidity: this.timestamp - 10,
      endValidity: this.timestamp + 10,
      postagePaid: 100,
      payment: 0,
      witnessAccount: web3.eth.accounts.create(),
      contracts: this.contracts
    }, false)
  })

  it('should not accept an underpaid type 0 witness', async function() {    
    await testPostage({
      payloadHash,
      beginValidity: this.timestamp - 10,
      endValidity: this.timestamp + 10,
      postagePaid: 100,
      payment: 99,
      witnessAccount: web3.eth.accounts.create(),
      contracts: this.contracts
    }, false)
  })

  it('should accept an overpaid type 0 witness', async function() {    
    await testPostage({
      payloadHash,
      beginValidity: this.timestamp - 10,
      endValidity: this.timestamp + 10,
      postagePaid: 100,
      payment: 101,
      witnessAccount: web3.eth.accounts.create(),
      contracts: this.contracts
    }, true)
  })

  it('should not accept a non-0 witness type', async function() {    
    await testPostage({
      payloadHash,
      beginValidity: this.timestamp - 10,
      endValidity: this.timestamp + 10,
      postagePaid: 100,
      payment: 100,
      witnessAccount: web3.eth.accounts.create(),
      witnessType: 1,
      contracts: this.contracts
    }, false)
  })

  it('should not accept an invalid signaturee', async function() {
    const { token, burn } = this.contracts
    const postagePaid = 100

    // we burn for the 0-address to make sure and invalid signature is not being treated as coming from the 0-address
    await token.approve(burn.address, postagePaid)
    await burn.burn(constants.ZERO_ADDRESS, postagePaid, {from: accounts[0]})

    expect(await this.contracts.postage.postage(
      payloadHash, 
      postagePaid,
      this.timestamp - 10,
      this.timestamp + 10,
      0,
      Buffer.from("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB")
    )).to.equal(false)
  })
})