import { useState, useEffect } from "react";
import { ethers } from "ethers";

const networkNames = {
  11155111: "Ethereum Sepolia",
  80001: "Polygon Mumbai",
  534351: "Scroll Testnet",
  84532: "Base Testnet",
  // ... add any other networks here in the format chainId: "Name"
};

const ConnectWallet = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [provider, setProvider] = useState(null);
  const [network, setNetwork] = useState("");
  const [chainId, setChainId] = useState("");
  const [showNetworks, setShowNetworks] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [ensName, setEnsName] = useState("");

  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);
      handleNetworkChange(web3Provider);

      window.ethereum.on("chainChanged", (_chainId) => {
        const updatedProvider = new ethers.providers.Web3Provider(
          window.ethereum
        );
        setProvider(updatedProvider);
        handleNetworkChange(updatedProvider);
      });
    }
  }, []);

  const connectWalletHandler = async () => {
    if (window.ethereum && provider) {
      try {
        const [selectedAddress] = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(selectedAddress);
        updateNetworkInfo();

        window.ethereum.on("accountsChanged", async (accounts) => {
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            updateNetworkInfo();
          } else {
            setWalletAddress("");
            setEnsName("");
          }
        });
      } catch (error) {
        console.error("Failed to connect wallet", error);
      }
    } else {
      console.log("Please install MetaMask");
    }
  };

  const disconnectWalletHandler = () => {
    if (window.ethereum) {
      setProvider(new ethers.providers.Web3Provider(window.ethereum));
    }
    setWalletAddress("");
    setEnsName("");
    setNetwork("");
    setChainId("");
    setShowNetworks(false);
    setShowDisconnect(false);
  };

  const handleNetworkChange = async (web3Provider) => {
    const net = await web3Provider.getNetwork();
    const networkName = networkNames[net.chainId] || "Unknown Network";
    setNetwork(networkName);
    setChainId(net.chainId);
  };

  const updateNetworkInfo = async () => {
    if (provider) {
      const net = await provider.getNetwork();
      setNetwork(networkNames[net.chainId] || net.name);
      setChainId(net.chainId);

      if (ethers.utils.isAddress(walletAddress)) {
        const ens = await provider.lookupAddress(walletAddress);
        setEnsName(ens || walletAddress);
      }
    }
  };

  const switchNetwork = async (networkHexCode) => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: networkHexCode }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        console.log(
          "This network isn't available in your MetaMask, please add it."
        );
      } else {
        console.error("Failed to switch network", switchError);
      }
    }
  };

  return (
    <div style={walletStyle}>
      {walletAddress ? (
        <>
          <div
            style={networkStyle}
            onClick={() => {
              setShowNetworks(!showNetworks);
              setShowDisconnect(false);
            }}
          >
            {network || "Unknown Network"} ▼
          </div>
          {showNetworks ? (
            <div style={{ ...dropdownContentStyle, left: "10px" }}>
              {Object.entries(networkNames).map(([id, name]) => (
                <div
                  key={id}
                  onClick={() =>
                    switchNetwork(`0x${parseInt(id).toString(16)}`)
                  }
                  style={dropdownItemStyle}
                >
                  {name}
                </div>
              ))}
            </div>
          ) : null}

          <div
            style={addressStyle}
            onClick={() => {
              setShowDisconnect(!showDisconnect);
              setShowNetworks(false);
            }}
          >
            {ensName ||
              `${walletAddress.substring(0, 6)}...${walletAddress.substring(
                walletAddress.length - 4
              )}`}{" "}
            ▼
          </div>
          {showDisconnect ? (
            <div
              style={{ ...dropdownContentStyle, right: "10px" }}
              onClick={disconnectWalletHandler}
            >
              <div style={dropdownItemStyle}>Disconnect</div>
            </div>
          ) : null}
        </>
      ) : (
        <button onClick={connectWalletHandler} style={buttonStyle}>
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default ConnectWallet;

const walletStyle = {
  display: "flex",
  alignItems: "start",
  padding: "10px",
  borderRadius: "20px",
  width: "fit-content",
  position: "relative",
};

const dropdownButtonStyle = {
  background: "#fff",
  padding: "8px 12px",
  borderRadius: "10px",
  cursor: "pointer",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  color: "black",
};

const networkStyle = {
  ...dropdownButtonStyle,
  marginRight: "8px",
  width: "fit-content",
};

const addressStyle = {
  ...dropdownButtonStyle,
  position: "relative",
};

const dropdownContentStyle = {
  position: "absolute",
  top: "100%",
  background: "white",
  padding: 0,
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  zIndex: 100,
  color: "black",
  width: "fit-content",
};

const dropdownItemStyle = {
  padding: "10px 20px",
  cursor: "pointer",
};

const buttonStyle = {
  background: "#61dafb",
  color: "#fff",
  border: "none",
  padding: "10px 20px",
  borderRadius: "10px",
  cursor: "pointer",
};
