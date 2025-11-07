// PROMT X402 client — Phantom + Solana balance + connect/disconnect toggle
const SOLANA_RPC = "https://solana-mainnet.g.alchemy.com/v2/demo";

const boot = document.getElementById("boot-screen");
const app = document.getElementById("app-x402");
const connectBtn = document.getElementById("connectBtn");
const statusEl = document.getElementById("status");
const panel = document.getElementById("walletPanel");
const walletAddrEl = document.getElementById("walletAddr");
const walletBalEl = document.getElementById("walletBalance");
const syncStateEl = document.getElementById("syncState");

let connected = false;
let provider;

// ——— плавный запуск экрана
function showApp() {
  boot.classList.remove("active");
  boot.classList.add("hidden");
  app.classList.remove("hidden");
}
setTimeout(showApp, 2800);

// ——— подключение к Phantom
async function connectPhantom() {
  try {
    provider = window?.phantom?.solana || window.solana;
    if (!provider || !provider.isPhantom) {
      statusEl.textContent = ">_ Phantom wallet not found. install from phantom.app";
      return;
    }

    if (!connected) {
      const resp = await provider.connect();
      const pubkey = resp.publicKey.toString();
      connected = true;
      statusEl.textContent = ">_ signal link established.";
      walletAddrEl.textContent = `>_ wallet connected: ${shortAddr(pubkey)}`;
      connectBtn.textContent = "DISCONNECT";
      panel.classList.remove("hidden");

      // эффект сканирования
      let dots = 0;
      walletBalEl.textContent = ">_ scanning wallet";
      const scanInterval = setInterval(() => {
        dots = (dots + 1) % 4;
        walletBalEl.textContent = ">_ scanning wallet" + ".".repeat(dots);
      }, 350);

      const balance = await fetchBalance(pubkey);
      clearInterval(scanInterval);
      await new Promise(r => setTimeout(r, 500));
      walletBalEl.textContent = `>_ balance: ${balance} SOL`;
      syncStateEl.textContent = ">_ chain sync: stable";
    } else {
      await disconnectWallet();
    }
  } catch (e) {
    console.error(e);
    statusEl.textContent = ">_ connection failed. // check Phantom";
  }
}

// ——— отключение
async function disconnectWallet() {
  try {
    if (provider && provider.disconnect) {
      await provider.disconnect();
    }
  } catch (e) {
    console.warn("disconnect error", e);
  }
  connected = false;
  connectBtn.textContent = "CONNECT WALLET";
  panel.classList.add("hidden");
  statusEl.textContent = ">_ awaiting Phantom signal...";
}

// ——— вспомогательные функции
function shortAddr(a) {
  return a.slice(0, 6) + "..." + a.slice(-4);
}

async function fetchBalance(address) {
  try {
    const res = await fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address]
      })
    });
    const json = await res.json();
    const lamports = json?.result?.value || 0;
    return (lamports / 1_000_000_000).toFixed(4);
  } catch (e) {
    console.error(e);
    return "0";
  }
}

connectBtn.addEventListener("click", connectPhantom);
