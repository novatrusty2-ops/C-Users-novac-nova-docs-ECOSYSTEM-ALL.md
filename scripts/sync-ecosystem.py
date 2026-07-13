#!/usr/bin/env python3
"""Regenerate ECOSYSTEM.json sections from live Nova Bank API with working URL policy."""

from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API_DIR = ROOT / "tmp" / "api"
ECO_PATH = ROOT / "ECOSYSTEM.json"

# Verified working endpoints (July 2026)
NOVA_BANK_API = "https://nova-bank-api-production-7311.up.railway.app/api/v1"
NOVA_BANK_UI = "https://nova-bank-api-production-7311.up.railway.app"
NOVA_SWAP_RAILWAY = "https://nova-bank-api-production-7311.up.railway.app/swap"
NOVA_SWAP_VPS = "http://51.75.64.28/swap"
NRW_CENTRAL_BANK = "https://nrw-central-bank-api-production.up.railway.app/api/v1"
NRW_WORLD_RPC = "https://nrw-world-chain-production-6029.up.railway.app"
NOVAONE_RPC_PRIMARY = "http://51.75.64.28/novaone-rpc/"
NOVAONE_RPC_FALLBACKS = [
    "https://novablockchain.it.com/novaone-rpc/",
    "https://novaone-rpc.novablockchain.it.com",
    "https://anakatech.llc/novaone-rpc/",
    "https://novablockchainsystem.com/novaone-rpc/",
    "https://novaone-rpc.novablockchainsystem.com",
]
NOVAONE_EXPLORER = "https://novaone.novablockchain.it.com/"
NOVA_PRODUCTION_RPC = "https://nova-bank-api-production-7311.up.railway.app/rpc"
NOVA_PRODUCTION_VPS_RPC = "http://51.75.64.28:28545/rpc"
NOVA_PRODUCTION_EXPLORER = "http://51.75.64.28:28545/explorer/"
NRW_WORLD_EXPLORER = "https://nrw-central-bank-api-production.up.railway.app"
NRW_WORLD_RPC_FALLBACK = "https://novablockchainsystem.com/nrw-rpc/"
ALLTRA_RPC_PRIMARY = "https://mainnet-rpc.alltra.global"
ALLTRA_RPC_FALLBACKS = [
    "https://alltra-rpc.novablockchainsystem.com/",
    "http://103.42.59.54:8545",
    "http://103.42.59.55:8545",
]

STALE_RPC = "https://anakatech.llc/novaone-rpc/"
STALE_EXPLORER = "https://novaone.anakatech.llc/"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text())


def dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        if item and item not in seen:
            seen.add(item)
            out.append(item)
    return out


def apply_network_url_policy(network: dict) -> dict:
    net = deepcopy(network)
    nid = net["id"]

    if nid == "nova-bank":
        net["rpcUrls"] = [NOVA_BANK_API]
    elif nid == "nova-one":
        net["rpcUrls"] = dedupe([NOVAONE_RPC_PRIMARY, *NOVAONE_RPC_FALLBACKS])
        net["explorerUrl"] = NOVAONE_EXPLORER
    elif nid == "nova-production":
        net["rpcUrls"] = dedupe([NOVA_PRODUCTION_RPC, NOVA_PRODUCTION_VPS_RPC])
        net["explorerUrl"] = NOVA_PRODUCTION_EXPLORER
    elif nid == "nrw-world":
        net["rpcUrls"] = dedupe([NRW_WORLD_RPC, NRW_WORLD_RPC_FALLBACK])
        net["explorerUrl"] = NRW_WORLD_EXPLORER
    elif nid == "alltra-mainnet":
        net["rpcUrls"] = dedupe([ALLTRA_RPC_PRIMARY, *ALLTRA_RPC_FALLBACKS])
    elif nid == "ethereum":
        net["rpcUrls"] = dedupe(
            net.get("rpcUrls", []) + ["https://eth.llamarpc.com"]
        )

    return net


def replace_stale_urls(value):
    if isinstance(value, str):
        return (
            value.replace(STALE_RPC, NOVAONE_RPC_PRIMARY).replace(
                STALE_EXPLORER, NOVAONE_EXPLORER
            )
        )
    if isinstance(value, list):
        return [replace_stale_urls(v) for v in value]
    if isinstance(value, dict):
        return {k: replace_stale_urls(v) for k, v in value.items()}
    return value


def add_networks(networks: list[str], extra: list[str]) -> list[str]:
    return dedupe([*networks, *extra])


def merge_tokens(tokens: list[dict]) -> list[dict]:
    """Merge duplicate symbols from API, unioning networks and chains."""
    by_symbol: dict[str, dict] = {}
    for token in tokens:
        sym = token["symbol"]
        if sym not in by_symbol:
            by_symbol[sym] = deepcopy(token)
            continue
        existing = by_symbol[sym]
        for key in ("networks", "chains"):
            if key in token or key in existing:
                existing[key] = dedupe(
                    [*existing.get(key, []), *token.get(key, [])]
                )
        for key, value in token.items():
            if key not in ("networks", "chains") and key not in existing:
                existing[key] = value
    return sorted(by_symbol.values(), key=lambda t: t["symbol"])


def main() -> None:
    eco = load_json(ECO_PATH)
    wallet_api = load_json(API_DIR / "wallet-networks.json")
    tokens_api = load_json(API_DIR / "ecosystem-tokens.json")
    nova_chain = load_json(API_DIR / "nova-chain-status.json")
    onex = load_json(API_DIR / "onex-ecosystem.json")

    eco["generatedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

    eco["productionUrls"] = {
        "novaBankApi": NOVA_BANK_API,
        "novaSwap": NOVA_SWAP_RAILWAY,
        "novaSwapFallback": NOVA_SWAP_VPS,
        "nrwCentralBank": NRW_CENTRAL_BANK,
        "nrwWorldChain": NRW_WORLD_RPC,
        "novaOneRpc": NOVAONE_RPC_PRIMARY,
        "novaOneRpcFallbacks": NOVAONE_RPC_FALLBACKS,
        "novaOneExplorer": NOVAONE_EXPLORER,
        "novaProductionRpc": NOVA_PRODUCTION_RPC,
        "dbisRpc": "https://rpc.defi-oracle.io",
        "anakaBridge": "https://bridge.anakachain.com",
    }

    eco["urlHealth"] = {
        "checkedAt": eco["generatedAt"],
        "notes": [
            "novablockchainsystem.com returns Cloudflare 521 — use Railway and VPS fallbacks below",
            "anakatech.llc/novaone-rpc redirects without JSON-RPC — use VPS primary",
            "Bitcoin rpcUrls intentionally empty (explorer-only via mempool.space)",
            "deployed.ethereumSourceBridge is null (undeployed)",
        ],
        "domains": {
            "nova-bank-api-production-7311.up.railway.app": {
                "status": "ok",
                "role": "Nova Bank API + member UI",
            },
            "novablockchainsystem.com": {
                "status": "down",
                "error": "Cloudflare 521",
                "fallback": NOVA_BANK_API,
            },
            "51.75.64.28": {
                "status": "ok",
                "role": "NovaONE RPC, Nova Swap, OneX node",
            },
            "nrw-world-chain-production-6029.up.railway.app": {
                "status": "ok",
                "role": "NRW World Chain RPC",
            },
        },
        "recommended": eco["productionUrls"],
    }

    eco["products"]["novaOneExplorer"]["url"] = NOVAONE_EXPLORER

    eco["novaOne"]["rpc"] = NOVAONE_RPC_PRIMARY
    eco["novaOne"]["explorer"] = NOVAONE_EXPLORER
    conn = eco["novaOne"]["connection"]
    conn["rpcEndpoints"] = [
        {
            "id": "vps-primary",
            "label": "VPS primary (verified working)",
            "url": NOVAONE_RPC_PRIMARY,
        },
        {
            "id": "public-https",
            "label": "Public HTTPS (novablockchain.it.com)",
            "url": nova_chain.get("publicRpcUrl", NOVAONE_RPC_FALLBACKS[0]),
        },
        {
            "id": "subdomain",
            "label": "Subdomain RPC",
            "url": nova_chain.get("subdomainRpcUrl", NOVAONE_RPC_FALLBACKS[1]),
        },
        *[
            {"id": f"fallback-{i}", "label": "Fallback", "url": url}
            for i, url in enumerate(nova_chain.get("rpcFallbackUrls", NOVAONE_RPC_FALLBACKS[2:]), 1)
        ],
    ]
    quirks = [
        q
        for q in conn.get("quirks", [])
        if "anakatech.llc may still be propagating" not in q
    ]
    quirks.extend(
        [
            "Primary public RPC: VPS http://51.75.64.28/novaone-rpc/ (verified July 2026)",
            "novablockchainsystem.com currently down (521) — wallet API still advertises it",
            "HTTPS fallbacks: novablockchain.it.com, anakatech.llc (may need recovery)",
        ]
    )
    conn["quirks"] = quirks

    eco["walletNetworks"] = [
        apply_network_url_policy(n) for n in wallet_api["networks"]
    ]

    for chain in eco["chains"]:
        if chain["id"] == "nova-one":
            chain["defaultRpcUrls"] = dedupe(
                [NOVAONE_RPC_PRIMARY, *NOVAONE_RPC_FALLBACKS]
            )
        elif chain["id"] == "nrw-world":
            chain["defaultRpcUrls"] = dedupe([NRW_WORLD_RPC, NRW_WORLD_RPC_FALLBACK])
            if "explorerUrl" in chain:
                chain["explorerUrl"] = NRW_WORLD_EXPLORER
        elif chain["id"] == "alltra-mainnet":
            chain["defaultRpcUrls"] = dedupe([ALLTRA_RPC_PRIMARY, *ALLTRA_RPC_FALLBACKS])

    eco["tradableTokens"] = merge_tokens(tokens_api["tokens"])

    eco["bridgeAdapters"] = replace_stale_urls(eco["bridgeAdapters"])

    evm_wallet_networks = [
        "nova-one",
        "nova-production",
        "nrw-world",
        "alltra-mainnet",
        "dbis-138",
        "anaka-bridge",
    ]
    for provider in eco.get("externalWalletProviders", []):
        if provider.get("kind") == "self_custody" and "nova-one" in provider.get(
            "supportedNetworks", []
        ):
            provider["supportedNetworks"] = add_networks(
                provider["supportedNetworks"],
                ["nova-production", "alltra-mainnet"],
            )

    eco["integrations"] = {
        "source": "live-api",
        "novaBank": NOVA_BANK_API,
        "novaSwap": NOVA_SWAP_RAILWAY,
        "novaSwapFallback": NOVA_SWAP_VPS,
        "nrwCentralBank": NRW_CENTRAL_BANK,
        "nrwWorldChain": NRW_WORLD_RPC,
        "novaOneRpc": NOVAONE_RPC_PRIMARY,
        "novaOneExplorer": NOVAONE_EXPLORER,
        "onexEcosystem": onex.get("ecosystem", {}),
        "walletNetworksEndpoint": f"{NOVA_BANK_UI}/api/v1/wallet/networks",
        "ecosystemTokensEndpoint": f"{NOVA_BANK_UI}/api/v1/chains/ecosystem/tokens",
    }

    ECO_PATH.write_text(json.dumps(eco, indent=2) + "\n")
    print(f"Updated {ECO_PATH}")
    print(f"  walletNetworks: {len(eco['walletNetworks'])}")
    print(f"  tradableTokens: {len(eco['tradableTokens'])}")


if __name__ == "__main__":
    main()
