import { useState, useEffect } from 'react';
import { BigNumber, ethers } from 'ethers';
import { DiamondGovernanceClient, VoteOption } from '@plopmenz/diamond-governance-sdk'; 
import './App.css';

const DGaddress = "0x0e2a39c6eD2A231baE7e781768E60ee1A62afC9F";

function App() {

  const [error, setError] = useState('');
  const [data, setData] = useState({});
  const [input, setInput] = useState({});
  const [amount, setAmount] = useState(0);
  const [mintable, setMintable] = useState(0);
  const [burnable, setBurnable] = useState(0);

  useEffect(() => {
    fetchData();
  }, [])

  async function fetchData() {
    if(typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      try {
        const object = { };
        const client = new DiamondGovernanceClient(DGaddress, signer);
        const test = await client.pure.IERC165();
        console.log(await test.supportsInterface("0xffffffff"));
        const daoRef = await client.pure.IDAOReferenceFacet();
        object.dao = await daoRef.dao();
        console.log(object.dao);
        object.proposalCount = await client.sugar.GetProposalCount();
        console.log(object.proposalCount);
        object.proposals = await client.sugar.GetProposals(undefined, undefined, undefined, 1, 3);
        console.log(object.proposals);
        object.members = await client.sugar.GetMembers();
        console.log(object.members);
        const claimer = await client.pure.IERC20OneTimeVerificationRewardFacet();
        object.tokensClaimable = String(await claimer.tokensClaimableVerificationRewardAll());
        const erc20 = await client.pure.IERC20();
        object.myTokens = String(await erc20.balanceOf(await signer.getAddress()));
        console.log("Variables:", JSON.stringify(await client.sugar.GetVariables()));
        setData(object);
      }
      catch(err) {
        setError(err.message);
      }
    }
  }

  async function claim() {
    if(typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      try {
        const client = new DiamondGovernanceClient(DGaddress, signer);
        const claimer = await client.pure.IERC20OneTimeVerificationRewardFacet();
        const transaction = await claimer.claimVerificationRewardAll();
        await transaction.wait();
      }
      catch(err) {
        setError(err.message);
      }
    }
  }

  function setTitle(event) {
    let newInput = input;
    newInput.title = event.target.value;
    setInput(newInput);
  }

  function setDescription(event) {
    let newInput = input;
    newInput.description = event.target.value;
    setInput(newInput);
  }

  async function create(event) {
    event.preventDefault();
    if(typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      try {
        const client = new DiamondGovernanceClient(DGaddress, signer);
        const from = new Date();
        from.setTime(from.getTime() + 1000 * 60 * 15);
        const to = new Date();
        to.setTime(from.getTime() + 1000 * 60 * 60 * 24 * 2);
        const transaction = await client.sugar.CreateProposal({
          title: input.title,
          description: input.description,
          body: "<p></p>",
          resources: [{
            name: "Google",
            url: "https://google.com",
          }],
        }, [{
          interface: "IERC20MultiMinterFacet",
          method: "multimint(address[],uint256[])",
          params: {
            _addresses: ["0xaF7E68bCb2Fc7295492A00177f14F59B92814e70"],
            _amounts: [BigNumber.from(69)]
          }
        }], from, to);
        await transaction.wait();
      }
      catch(err) {
        setError(err.message);
      }
    }
  }

  async function vote(proposalId, voteOption) {
    if(typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      try {
        const client = new DiamondGovernanceClient(DGaddress, signer);
        const proposal = await client.sugar.GetProposal(proposalId);
        const transaction = await proposal.Vote(voteOption, BigNumber.from(10).pow(18).mul(9));
        await transaction.wait();
      }
      catch(err) {
        setError(err.message);
      }
    }
  }
  
  async function execute(proposalId) {
    if(typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      try {
        const client = new DiamondGovernanceClient(DGaddress, signer);
        const proposal = await client.sugar.GetProposal(proposalId);
        const transaction = await proposal.Execute();
        await transaction.wait();
      }
      catch(err) {
        setError(err.message);
      }
    }
  }
  
  async function changeAmount(event) {
    const a = BigNumber.from(event.target.value);
    setAmount(a.toBigInt());
    if(typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      try {
        const client = new DiamondGovernanceClient(DGaddress, signer);
        const MarketMaker = await client.sugar.GetABCMarketMaker();
        try {
          setMintable((await MarketMaker.calculateMint(a)).toBigInt());
        } catch {
          setMintable(-1);
        }
        try {
          setBurnable((await MarketMaker.calculateBurn(a)).toBigInt());
        } catch {
          setBurnable(-1);
        }
      }
      catch(err) {
        setError(err.message);
      }
    }
  }

  async function approve() {
    if(typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      try {
        const client = new DiamondGovernanceClient(DGaddress, signer);
        const MarketMaker = await client.sugar.GetABCMarketMaker();
        const extERC20 = await MarketMaker.externalToken();
        const ERC20 = new ethers.Contract(extERC20, ['function approve(address spender, uint256 amount) returns (bool)'], signer);
        const transaction = await ERC20.approve(MarketMaker.address, ethers.constants.MaxUint256);
        await transaction.wait();
      }
      catch(err) {
        setError(err.message);
      }
    }
  }

  async function mint() {
    if(typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      try {
        const client = new DiamondGovernanceClient(DGaddress, signer);
        const MarketMaker = await client.sugar.GetABCMarketMaker();
        const transaction = await MarketMaker.mint(BigNumber.from(amount.toString()), 0);
        await transaction.wait();
      }
      catch(err) {
        setError(err.message);
      }
    }
  }

  async function burn() {
    if(typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      try {
        const client = new DiamondGovernanceClient(DGaddress, signer);
        const MarketMaker = await client.sugar.GetABCMarketMaker();
        const transaction = await MarketMaker.burn(BigNumber.from(amount.toString()), 0);
        await transaction.wait();
        fetchData();
      }
      catch(err) {
        setError(err.message);
      }
    }
  }

  return (
    <div className="App">
      <div className="container">
        {error && <p>{error}</p>}
        <h1>Diamond Governance Demo!</h1>
        <p>DAO: {data.dao}</p>
        <p className="count">{data.proposalCount} Proposals</p>
        {
          data.proposals?.map(proposal => <p key={proposal.id}><b>{proposal.metadata.title}: </b>{proposal.metadata.description}<button onClick={() => vote(proposal.id, VoteOption.Yes)}>Vote Yes</button><button onClick={() => vote(proposal.id, VoteOption.No)}>Vote No</button><button onClick={() => execute(proposal.id)}>Execute</button></p>)
        }
        <p className="count">{data.members?.length ?? 0} Members</p>
        {
          data.members?.map(member => <p key={member}>{member}</p>)
        }
        <form onSubmit={create}>
          <label>
            Title:
            <input type="text" value={input.title} onChange={setTitle} />
          </label>
          <label>
            Description:
            <input type="text" value={input.description} onChange={setDescription} />
          </label>
          <input type="submit" value="Create Proposal" />
        </form>
        <button onClick={claim}>Claim {data.tokensClaimable} tokens</button><br />
        <p className="cost">I have {data.myTokens} tokens</p><br />
        <button onClick={approve}>Approve</button><br />
        <label>
          Amount:
          <input type="numeric" value={amount.toString()} onChange={changeAmount} />
        </label>
        <button enabled={(mintable > 0).toString()} onClick={mint}>Mint {mintable.toString()}</button>
        <button enabled={(burnable > 0).toString()} onClick={burn}>Burn {burnable.toString()}</button>
      </div>
    </div>
  );
}

export default App;
