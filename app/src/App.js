import { ethers } from "ethers";
import { useEffect, useState } from "react";
import deploy from "./deploy";
import Escrow from "./Escrow";

const provider = new ethers.providers.Web3Provider(window.ethereum);

export async function approve(escrowContract, signer) {
  try {
    const gasLimit = 100000;
    const approveTxn = await escrowContract
      .connect(signer)
      .approve({ gasLimit });
    await approveTxn.wait();
    console.log("Transaction successful:", approveTxn);
  } catch (error) {
    console.error("Approval transaction failed:", error);
    alert(`Approval failed: ${error.message}`);
  }
}

function App() {
  const [escrows, setEscrows] = useState(
    JSON.parse(localStorage.getItem("escrows")) || []
  );
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();

  async function getAccounts() {
    const accounts = await provider.send("eth_requestAccounts", []);

    setAccount(accounts[0]);
    setSigner(provider.getSigner());
  }

  async function newContract() {
    const beneficiary = document.getElementById("beneficiary").value;
    const arbiter = document.getElementById("arbiter").value;
    const value = ethers.utils.parseEther(
      `${document.getElementById("ether").value}`
    );
    const escrowContract = await deploy(signer, arbiter, beneficiary, value);

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: value.toString(),
      handleApprove: async () => {
        escrowContract.on("Approved", () => {
          document.getElementById(escrowContract.address).className =
            "complete";
          document.getElementById(escrowContract.address).innerText =
            "✓ It's been approved!";
        });

        await approve(escrowContract, signer);
      },
    };
    const newEscrows = [...escrows, escrow];
    localStorage.setItem("escrows", JSON.stringify(newEscrows));
    setEscrows(newEscrows);
  }

  console.log(account[0]);

  return (
    <>
      <div className="contract">
        <h1> New Contract </h1>
        <span>User</span>
        <label>
          Arbiter Address
          <input type="text" id="arbiter" />
        </label>

        <label>
          Beneficiary Address
          <input type="text" id="beneficiary" />
        </label>

        <label>
          Deposit Amount (ether)
          <input type="text" id="ether" />
        </label>

        <div
          className="button"
          id="deploy"
          onClick={(e) => {
            e.preventDefault();
            console.log("new contract");
            newContract();
          }}
        >
          Deploy
        </div>
      </div>

      <div className="contract">
        <button onClick={getAccounts} className="button">
          Connect Wallet
        </button>
      </div>
      <div className="existing-contracts">
        <h1> Existing Contracts </h1>

        <div id="container">
          {escrows.map((escrow) => {
            return <Escrow key={escrow.address} {...escrow} />;
          })}
        </div>
      </div>
    </>
  );
}

export default App;
