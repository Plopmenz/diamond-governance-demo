import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { DiamondGovernanceClient } from '@plopmenz/diamond-governance-sdk'; 
import './App.css';

const DGaddress = "0x0287fDB9aD1577E6ec2aD2dc261B195C29423B01";

function App() {

  const [error, setError] = useState('');
  const [data, setData] = useState({})

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
        object.proposalCount = await client.sugar.GetProposalCount();
        object.proposals = await client.sugar.GetProposals();
        object.members = await client.sugar.GetMembers();
        setData(object);
      }
      catch(err) {
        setError(err.message);
      }
    }
  }

  async function create() {
    if(typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      try {
        const client = new DiamondGovernanceClient(DGaddress, signer);
        const from = new Date();
        const to = new Date();
        to.setTime(from.getTime() + 1000 * 60 * 60 * 24 * 2)
        const transaction = await client.sugar.CreateProposal({
          title: "Title",
          description: "Description",
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
        <p className="cost">{data.proposals}</p>
        <p className="cost">{data.members}</p>
        <button onClick={create}>Create Proposal</button>
      </div>
    </div>
  );
}

export default App;
