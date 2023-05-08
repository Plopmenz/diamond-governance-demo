import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { DiamondGovernanceClient } from '@plopmenz/diamond-governance-sdk'; 
import './App.css';
import { proposal } from '@plopmenz/diamond-governance-sdk/dist/typechain-types/contracts/facets/governance';

const DGaddress = "0x0287fDB9aD1577E6ec2aD2dc261B195C29423B01";

function App() {

  const [error, setError] = useState('');
  const [data, setData] = useState({})
  const [input, setInput] = useState({})

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
        object.proposalCount = await client.sugar.GetProposalCount();
        object.proposals = await client.sugar.GetProposals();
        object.members = await client.sugar.GetMembers();
        const claimer = await client.pure.IERC20OneTimeVerificationRewardFacet();
        object.tokensClaimable = String(await claimer.tokensClaimableVerificationRewardAll());
        const erc20 = await client.pure.IERC20();
        object.myTokens = String(await erc20.balanceOf(await signer.getAddress()));
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
        fetchData();
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
          resources: [],
        }, [], from, to);
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
        <p className="count">{data.proposalCount} Proposals</p>
        {
          data.proposals?.map(proposal => <p key={proposal.id}><b>{proposal.metadata.title}: </b>{proposal.metadata.description}</p>)
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
        <button onClick={claim}>Claim {data.tokensClaimable} tokens</button>
        <p className="cost">I have {data.myTokens} tokens</p>
      </div>
    </div>
  );
}

export default App;
