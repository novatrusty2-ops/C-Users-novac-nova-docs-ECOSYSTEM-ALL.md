#!/usr/bin/env python3
"""Regenerate ECOSYSTEM.json from live Nova Bank API with health-aware URL policy."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API_DIR = ROOT / "tmp" / "api"
ECO_PATH = ROOT / "ECOSYSTEM.json"

NOVA_BANK_UI = "https://nova-bank-api-production-7311.up.railway.app"
NOVA_BANK_API = f"{NOVA_BANK_UI}/api/v1"
NOVA_SWAP_RAILWAY = f"{NOVA_BANK_UI}/swap"
NOVA_SWAP_VPS = "http://51.75.64.28/swap"
NRW_CENTRAL_BANK = "https://nrw-central-bank-api-production.up.railway.app/api/v1"
NRW_WORLD_RPC = "https://nrw-world-chain-production-6029.up.railway.app"
NRW_WORLD_RPC_FALLBACK = "https://novablockchainsystem.com/nrw-rpc/"
NRW_WORLD_EXPLORER = "https://nrw-central-bank-api-production.up.railway.app"
NOVA_PRODUCTION_RPC = f"{NOVA_BANK_UI}/rpc"
NOVA_PRODUCTION_PROXY = f"{NOVA_BANK_API}/production-node/rpc"
NOVA_PRODUCTION_VPS_RPC = "http://51.75.64.28:28545/rpc"
NOVA_PRODUCTION_EXPLORER = "http://51.75.64.28:28545/explorer/"
ALLTRA_RPC_PRIMARY = "https://mainnet-rpc.alltra.global"
ALLTRA_RPC_FALLBACKS = [
    "http://103.42.59.54:8545",
    "http://103.42.59.55:8545",
    "https://alltra-rpc.novablockchainsystem.com/",
]

# Ordered candidates for NovaONE RPC (probed at sync time)
NOVAONE_RPC_CANDIDATES = [
    "http://51.75.64.28/novaone-rpc/",
    "https://novablockchain.it.com/novaone-rpc/",
    "https://novaone-rpc.novablockchain.it.com",
    "https://anakatech.llc/novaone-rpc/",
    "https://novablockchainsystem.com/novaone-rpc/",
    "https://novaone-rpc.novablockchainsystem.com",
]
NOVAONE_EXPLORER_CANDIDATES = [
    "https://novaone.novablockchain.it.com/",
    "https://novaone.novablockchainsystem.com/",
    "https://novaone.anakatech.llc/",
]

STALE_RPC = "https://anakatech.llc/novaone-rpc/"
STALE_EXPLORER = "https://novaone.anakatech.llc/"

ETH_BLOCK = b'{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'


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


def probe_http(url: str, method: str = "GET", data: bytes | None = None, timeout: float = 6.0) -> dict:
    try:
        req = urllib.request.Request(
            url,
            data=data,
            method=method,
            headers={"Content-Type": "application/json", "User-Agent": "nova-ecosystem-sync"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read(200)
            ok = 200 <= resp.status < 400 or resp.status == 405
            rpc_ok = False
            if data is not None and body:
                try:
                    parsed = json.loads(body)
                    rpc_ok = "result" in parsed and "error" not in parsed
                except Exception:
                    rpc_ok = False
            return {
                "url": url,
                "status": "ok" if (rpc_ok or (ok and data is None)) else "degraded",
                "httpStatus": resp.status,
                "rpcOk": rpc_ok,
                "error": None if (rpc_ok or (ok and data is None)) else f"HTTP {resp.status}",
            }
    except Exception as exc:
        return {
            "url": url,
            "status": "down",
            "httpStatus": None,
            "rpcOk": False,
            "error": f"{type(exc).__name__}: {exc}",
        }


def probe_rpc(url: str) -> dict:
    return probe_http(url, method="POST", data=ETH_BLOCK, timeout=6.0)


def order_by_health(candidates: list[str]) -> tuple[list[str], list[dict]]:
    results = [probe_rpc(url) for url in candidates]
    healthy = [r["url"] for r in results if r["rpcOk"]]
    rest = [r["url"] for r in results if not r["rpcOk"]]
    return dedupe([*healthy, *rest]), results


# Fold variant network coverage into canonical symbols for wallet integrators.
TOKEN_NETWORK_ALIASES = {
    "USDT": ["USDT-LEGACY", "USDT-TRC20", "USDT-BNB", "AUSDT", "CUSDT"],
    "USDC": ["AUSDC", "CUSDC"],
}


def merge_tokens(tokens: list[dict]) -> list[dict]:
    by_symbol: dict[str, dict] = {}
    for token in tokens:
        sym = token["symbol"]
        if sym not in by_symbol:
            by_symbol[sym] = deepcopy(token)
            continue
        existing = by_symbol[sym]
        for key in ("networks", "chains"):
            if key in token or key in existing:
                existing[key] = dedupe([*existing.get(key, []), *token.get(key, [])])
        for key, value in token.items():
            if key not in ("networks", "chains") and key not in existing:
                existing[key] = value

    # Ensure base stables include custodial / Alltra networks from API variants.
    for base, aliases in TOKEN_NETWORK_ALIASES.items():
        if base not in by_symbol:
            continue
        for alias in aliases:
            if alias not in by_symbol:
                continue
            by_symbol[base]["networks"] = dedupe(
                [*by_symbol[base].get("networks", []), *by_symbol[alias].get("networks", [])]
            )
            by_symbol[base]["chains"] = dedupe(
                [*by_symbol[base].get("chains", []), *by_symbol[alias].get("chains", [])]
            )
        # Ledger support is expected for major stables even if base entry omits it.
        by_symbol[base]["networks"] = dedupe(
            [*by_symbol[base].get("networks", []), "nova-bank", "alltra-mainnet"]
        )

    return sorted(by_symbol.values(), key=lambda t: t["symbol"])


def apply_network_url_policy(network: dict, novaone_rpcs: list[str], novaone_explorer: str) -> dict:
    net = deepcopy(network)
    nid = net["id"]

    if nid == "nova-bank":
        net["rpcUrls"] = [NOVA_BANK_API]
    elif nid == "nova-one":
        net["rpcUrls"] = novaone_rpcs
        net["explorerUrl"] = novaone_explorer
        net["health"] = "ok" if novaone_rpcs and probe_rpc(novaone_rpcs[0])["rpcOk"] else "degraded"
    elif nid == "nova-production":
        # Railway /rpc is advertised but currently 404; proxy returns 500; VPS down.
        net["rpcUrls"] = dedupe(
            [NOVA_PRODUCTION_PROXY, NOVA_PRODUCTION_RPC, NOVA_PRODUCTION_VPS_RPC]
        )
        net["explorerUrl"] = NOVA_PRODUCTION_EXPLORER
        net["health"] = "degraded"
        net["healthNote"] = (
            "production-node edge/upstream disconnected; /rpc 404; VPS 51.75.64.28 down"
        )
    elif nid == "nrw-world":
        net["rpcUrls"] = dedupe([NRW_WORLD_RPC, NRW_WORLD_RPC_FALLBACK])
        net["explorerUrl"] = NRW_WORLD_EXPLORER
        net["health"] = "ok"
        net["explorerNote"] = "NRW uses central bank API as status surface (no dedicated explorer)"
    elif nid == "alltra-mainnet":
        net["rpcUrls"] = dedupe([ALLTRA_RPC_PRIMARY, *ALLTRA_RPC_FALLBACKS])
        net["health"] = "ok"
    elif nid == "ethereum":
        net["rpcUrls"] = dedupe(net.get("rpcUrls", []) + ["https://eth.llamarpc.com"])
        # Prefer public RPC first; keep QuikNode if present as secondary
        public = [u for u in net["rpcUrls"] if "llamarpc" in u]
        others = [u for u in net["rpcUrls"] if "llamarpc" not in u]
        net["rpcUrls"] = dedupe([*public, *others])
    elif nid == "bitcoin":
        net["healthNote"] = "Explorer-only — rpcUrls intentionally empty"

    return net


def replace_stale_urls(value, novaone_rpc: str, novaone_explorer: str):
    if isinstance(value, str):
        return value.replace(STALE_RPC, novaone_rpc).replace(STALE_EXPLORER, novaone_explorer)
    if isinstance(value, list):
        return [replace_stale_urls(v, novaone_rpc, novaone_explorer) for v in value]
    if isinstance(value, dict):
        return {k: replace_stale_urls(v, novaone_rpc, novaone_explorer) for k, v in value.items()}
    return value


def add_networks(networks: list[str], extra: list[str]) -> list[str]:
    return dedupe([*networks, *extra])


def ensure_chain(chains: list[dict], entry: dict) -> None:
    for i, chain in enumerate(chains):
        if chain["id"] == entry["id"]:
            chains[i] = {**chain, **entry}
            return
    chains.append(entry)


def main() -> None:
    eco = load_json(ECO_PATH)
    wallet_api = load_json(API_DIR / "wallet-networks.json")
    tokens_api = load_json(API_DIR / "ecosystem-tokens.json")
    onex = load_json(API_DIR / "onex-ecosystem.json")
    prod_node = load_json(API_DIR / "production-node-status.json") if (
        API_DIR / "production-node-status.json"
    ).exists() else {}

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    eco["generatedAt"] = now
    eco["version"] = "1.0.1"

    print("Probing NovaONE RPC candidates...")
    novaone_rpcs, novaone_probe = order_by_health(NOVAONE_RPC_CANDIDATES)
    novaone_primary = novaone_rpcs[0]
    novaone_healthy = any(r["rpcOk"] for r in novaone_probe)
    novaone_explorer = NOVAONE_EXPLORER_CANDIDATES[0]

    print("Probing other key endpoints...")
    bank_probe = probe_http(f"{NOVA_BANK_API}/global/status")
    nrw_probe = probe_rpc(NRW_WORLD_RPC)
    nrw_cb_probe = probe_http(f"{NRW_CENTRAL_BANK}/global/status")
    swap_probe = probe_http(NOVA_SWAP_RAILWAY)
    vps_probe = probe_rpc("http://51.75.64.28/novaone-rpc/")
    nbs_probe = probe_http("https://novablockchainsystem.com/api/v1/global/status", timeout=8.0)
    alltra_probe = probe_rpc(ALLTRA_RPC_PRIMARY)
    defi_probe = probe_rpc("https://rpc.defi-oracle.io")
    anaka_probe = probe_rpc("https://bridge.anakachain.com")
    prod_rpc_probe = probe_rpc(NOVA_PRODUCTION_RPC)
    prod_proxy_probe = probe_rpc(NOVA_PRODUCTION_PROXY)

    eco["productionUrls"] = {
        "novaBankApi": NOVA_BANK_API,
        "novaSwap": NOVA_SWAP_RAILWAY,
        "novaSwapFallback": NOVA_SWAP_VPS,
        "nrwCentralBank": NRW_CENTRAL_BANK,
        "nrwWorldChain": NRW_WORLD_RPC,
        "novaOneRpc": novaone_primary,
        "novaOneRpcFallbacks": novaone_rpcs[1:],
        "novaOneExplorer": novaone_explorer,
        "novaProductionRpc": NOVA_PRODUCTION_PROXY,
        "novaProductionRpcPublic": NOVA_PRODUCTION_RPC,
        "dbisRpc": "https://rpc.defi-oracle.io",
        "anakaBridge": "https://bridge.anakachain.com",
        "alltraRpc": ALLTRA_RPC_PRIMARY,
    }

    eco["urlHealth"] = {
        "checkedAt": now,
        "summary": {
            "novaBankApi": bank_probe["status"],
            "novaOneRpc": "ok" if novaone_healthy else "down",
            "nrwWorldChain": nrw_probe["status"],
            "nrwCentralBank": nrw_cb_probe["status"],
            "novaSwap": swap_probe["status"],
            "vps51": vps_probe["status"],
            "novablockchainsystem": nbs_probe["status"],
            "novaProductionNode": "ok"
            if prod_rpc_probe["rpcOk"] or prod_proxy_probe["rpcOk"]
            else "down",
            "alltra": alltra_probe["status"],
            "defiOracle": defi_probe["status"],
            "anakaBridge": anaka_probe["status"],
        },
        "notes": [
            "Prefer Railway and verified RPC endpoints; do not trust wallet/networks hostnames blindly",
            "novablockchainsystem.com is unreliable (521/timeout/403) — kept only as last-resort fallback",
            "VPS 51.75.64.28 may flap; probe before relying on it for NovaONE / swap / production node",
            "Nova Production Node edge/upstream currently disconnected (Railway /rpc 404, proxy 500)",
            "Bitcoin rpcUrls intentionally empty (explorer-only via mempool.space)",
            "deployed.ethereumSourceBridge is null (undeployed)",
            "Live /api/v1/wallet-ecosystem returns 404 — use /api/v1/wallet/networks and /chains/ecosystem/tokens",
            "See docs/PRODUCTION-ISSUES.md for API-source fixes that cannot be done in this repo",
        ],
        "probes": {
            "novaBankApi": bank_probe,
            "novaOneRpcCandidates": novaone_probe,
            "nrwWorldChain": nrw_probe,
            "nrwCentralBank": nrw_cb_probe,
            "novaSwap": swap_probe,
            "vpsNovaOne": vps_probe,
            "novablockchainsystem": nbs_probe,
            "novaProductionRpc": prod_rpc_probe,
            "novaProductionProxy": prod_proxy_probe,
            "alltra": alltra_probe,
            "defiOracle": defi_probe,
            "anakaBridge": anaka_probe,
            "productionNodeApi": {
                "edgeConnected": (prod_node.get("edge") or {}).get("connected"),
                "upstreamConnected": (prod_node.get("upstream") or {}).get("connected"),
                "edgeError": (prod_node.get("edge") or {}).get("error"),
                "upstreamError": (prod_node.get("upstream") or {}).get("error"),
            },
        },
        "domains": {
            "nova-bank-api-production-7311.up.railway.app": {
                "status": bank_probe["status"],
                "role": "Nova Bank API + member UI + Swap",
            },
            "novablockchainsystem.com": {
                "status": nbs_probe["status"],
                "error": nbs_probe.get("error"),
                "fallback": NOVA_BANK_API,
            },
            "51.75.64.28": {
                "status": vps_probe["status"],
                "role": "NovaONE RPC, Nova Swap, OneX node",
                "error": vps_probe.get("error"),
            },
            "nrw-world-chain-production-6029.up.railway.app": {
                "status": nrw_probe["status"],
                "role": "NRW World Chain RPC",
            },
            "nrw-central-bank-api-production.up.railway.app": {
                "status": nrw_cb_probe["status"],
                "role": "NRW Central Bank API",
            },
        },
        "recommended": eco["productionUrls"],
    }

    eco["products"]["novaOneExplorer"]["url"] = novaone_explorer
    eco["products"]["novaSwap"]["fallbackUrl"] = NOVA_SWAP_VPS
    eco["products"]["novaProductionNode"] = {
        "name": "Nova Production Node",
        "chainId": 9001,
        "rpc": NOVA_PRODUCTION_PROXY,
        "publicRpc": NOVA_PRODUCTION_RPC,
        "status": f"{NOVA_BANK_API}/production-node/status",
        "role": "custody EVM node (currently degraded — edge/upstream disconnected)",
        "health": "degraded",
    }

    eco["novaOne"]["rpc"] = novaone_primary
    eco["novaOne"]["explorer"] = novaone_explorer
    eco["novaOne"]["health"] = "ok" if novaone_healthy else "down"
    conn = eco["novaOne"]["connection"]
    conn["rpcEndpoints"] = [
        {
            "id": f"rpc-{i}",
            "label": ("Healthy" if any(p["url"] == url and p["rpcOk"] for p in novaone_probe) else "Unhealthy")
            + f" candidate #{i+1}",
            "url": url,
            "health": next((p["status"] for p in novaone_probe if p["url"] == url), "unknown"),
        }
        for i, url in enumerate(novaone_rpcs)
    ]
    quirks = [
        "Zero gas — eth_gasPrice returns 0x0; some libraries reject gasPrice: 0",
        "Permissioned QBFT — only validators propose; add/remove via qbft_proposeValidatorVote",
        "HTTP JSON-RPC only — no WebSocket subscriptions",
        "Public RPC — no auth; Cloudflare → nginx → socat → node1",
        f"Primary RPC candidate after health probe: {novaone_primary}",
        "novablockchainsystem.com unreliable — wallet API may still advertise it",
        "VPS 51.75.64.28 and HTTPS public RPCs may be down; re-run scripts/sync-ecosystem.py",
    ]
    conn["quirks"] = quirks

    eco["walletNetworks"] = [
        apply_network_url_policy(n, novaone_rpcs, novaone_explorer)
        for n in wallet_api["networks"]
    ]

    ensure_chain(
        eco["chains"],
        {
            "id": "nova-one",
            "label": "NovaONE",
            "chainId": 22016,
            "role": "trading",
            "aliases": ["Nova One", "Nova Chain", "Private QBFT Mesh"],
            "defaultRpcUrls": novaone_rpcs,
            "defaultExplorerUrl": novaone_explorer,
            "health": "ok" if novaone_healthy else "down",
        },
    )
    ensure_chain(
        eco["chains"],
        {
            "id": "nova-production",
            "label": "Nova Production Node",
            "chainId": 9001,
            "role": "custody",
            "defaultRpcUrls": [NOVA_PRODUCTION_PROXY, NOVA_PRODUCTION_RPC, NOVA_PRODUCTION_VPS_RPC],
            "defaultExplorerUrl": NOVA_PRODUCTION_EXPLORER,
            "health": "degraded",
        },
    )
    ensure_chain(
        eco["chains"],
        {
            "id": "nrw-world",
            "label": "NRW World Chain",
            "chainId": 33001,
            "role": "settlement",
            "defaultRpcUrls": [NRW_WORLD_RPC, NRW_WORLD_RPC_FALLBACK],
            "explorerUrl": NRW_WORLD_EXPLORER,
            "health": nrw_probe["status"],
        },
    )
    ensure_chain(
        eco["chains"],
        {
            "id": "alltra-mainnet",
            "label": "ALLTRA Mainnet",
            "chainId": 651940,
            "role": "external",
            "defaultRpcUrls": dedupe([ALLTRA_RPC_PRIMARY, *ALLTRA_RPC_FALLBACKS]),
            "health": alltra_probe["status"],
        },
    )

    for chain in eco["chains"]:
        if chain["id"] == "dbis-138":
            chain["health"] = defi_probe["status"]
        elif chain["id"] == "anaka-bridge":
            chain["health"] = anaka_probe["status"]

    eco["tradableTokens"] = merge_tokens(tokens_api["tokens"])
    eco["bridgeAdapters"] = replace_stale_urls(
        eco["bridgeAdapters"], novaone_primary, novaone_explorer
    )

    for provider in eco.get("externalWalletProviders", []):
        if provider.get("kind") == "self_custody" and "nova-one" in provider.get(
            "supportedNetworks", []
        ):
            provider["supportedNetworks"] = add_networks(
                provider["supportedNetworks"],
                ["nova-production", "alltra-mainnet"],
            )

    # Correct broken API paths advertised by onex ecosystem
    onex_eco = deepcopy(onex.get("ecosystem", {}))
    onex_eco.update(
        {
            "novaBank": NOVA_BANK_API,
            "novaSwap": NOVA_SWAP_RAILWAY,
            "novaSwapFallback": NOVA_SWAP_VPS,
            "walletApi": f"{NOVA_BANK_API}/wallet/networks",
            "walletTokens": f"{NOVA_BANK_API}/chains/ecosystem/tokens",
            "nrwCentralBank": NRW_CENTRAL_BANK,
            "nrwWorldChain": NRW_WORLD_RPC,
            "novaOneRpc": novaone_primary,
            "novaOneExplorer": novaone_explorer,
        }
    )

    eco["api"] = {
        **eco.get("api", {}),
        "globalStatus": "/api/v1/global/status",
        "walletNetworks": "/api/v1/wallet/networks",
        "walletTokens": "/api/v1/chains/ecosystem/tokens",
        "walletPortfolio": "/api/v1/wallet/portfolio/:address",
        "walletImport": "/api/v1/wallet/ecosystem/import",
        "bridgeAdapters": "/api/v1/chains/nova-one/bridge-adapters",
        "ecosystemTokens": "/api/v1/chains/ecosystem/tokens",
        "novaChainStatus": "/api/v1/nova-chain/status",
        "chainsStatus": "/api/v1/chains/status",
        "productionNodeStatus": "/api/v1/production-node/status",
        "productionNodeRpc": "/api/v1/production-node/rpc",
        "publicDocs": "/api/v1/public/docs/:slug",
        "openapi": "/api/v1/openapi.json",
        "proofOfFunds": "/api/v1/global/proof-of-funds/nova-bank",
        "brokenPaths": {
            "/api/v1/wallet-ecosystem": "404 Not Found — use wallet/networks + chains/ecosystem/tokens",
            "/rpc": "404 Not Found — production node edge disconnected",
        },
    }

    eco["integrations"] = {
        "source": "live-api-health-adjusted",
        "novaBank": NOVA_BANK_API,
        "novaSwap": NOVA_SWAP_RAILWAY,
        "novaSwapFallback": NOVA_SWAP_VPS,
        "nrwCentralBank": NRW_CENTRAL_BANK,
        "nrwWorldChain": NRW_WORLD_RPC,
        "novaOneRpc": novaone_primary,
        "novaOneExplorer": novaone_explorer,
        "onexEcosystem": onex_eco,
        "walletNetworksEndpoint": f"{NOVA_BANK_API}/wallet/networks",
        "ecosystemTokensEndpoint": f"{NOVA_BANK_API}/chains/ecosystem/tokens",
        "productionNodeStatus": f"{NOVA_BANK_API}/production-node/status",
    }

    eco["knownIssues"] = [
        {
            "id": "nbs-domain-down",
            "severity": "high",
            "component": "novablockchainsystem.com",
            "summary": "Primary public domain returns 521/timeout/403; wallet API still advertises it",
            "fixIn": "Nova Bank API source + Cloudflare origin",
        },
        {
            "id": "novaone-rpc-outage",
            "severity": "critical" if not novaone_healthy else "low",
            "component": "NovaONE RPC",
            "summary": "No healthy NovaONE JSON-RPC endpoint" if not novaone_healthy else "At least one NovaONE RPC responds",
            "fixIn": "VPS / Cloudflare / Besu node ops",
        },
        {
            "id": "production-node-disconnected",
            "severity": "high",
            "component": "Nova Production Node",
            "summary": "edge and upstream RPC disconnected; public /rpc 404",
            "fixIn": "Nova Bank API deployment (host.docker.internal / 28545 upstream)",
        },
        {
            "id": "wallet-ecosystem-404",
            "severity": "medium",
            "component": "API routes",
            "summary": "/api/v1/wallet-ecosystem returns 404; docs still reference it",
            "fixIn": "Nova Bank API source",
        },
        {
            "id": "chains-status-timeout",
            "severity": "medium",
            "component": "/api/v1/chains/status",
            "summary": "Endpoint often times out; uses broken anakatech / internal nrw-world RPCs",
            "fixIn": "Nova Bank API source",
        },
        {
            "id": "ethereum-source-bridge-null",
            "severity": "low",
            "component": "deployed.ethereumSourceBridge",
            "summary": "Ethereum source bridge address not deployed",
            "fixIn": "Bridge deployment",
        },
    ]

    ECO_PATH.write_text(json.dumps(eco, indent=2) + "\n")
    print(f"Updated {ECO_PATH}")
    print(f"  version: {eco['version']}")
    print(f"  walletNetworks: {len(eco['walletNetworks'])}")
    print(f"  tradableTokens: {len(eco['tradableTokens'])}")
    print(f"  novaOneRpc primary: {novaone_primary} (healthy={novaone_healthy})")
    print(f"  urlHealth.summary: {eco['urlHealth']['summary']}")


if __name__ == "__main__":
    main()
