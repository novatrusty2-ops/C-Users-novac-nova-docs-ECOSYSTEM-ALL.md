export const BRIDGE_VAULT_ABI = [
  'function lock(bytes32 routeId, address token, uint256 amount, bytes32 recipient) payable',
  'function unlock(bytes32 proofId, address token, uint256 amount, address recipient)',
  'event Locked(bytes32 indexed routeId, address indexed sender, uint256 amount)',
  'event Unlocked(bytes32 indexed proofId, address indexed recipient, uint256 amount)',
] as const

export const WRAPPED_TOKEN_ABI = [
  'function deposit() payable',
  'function withdraw(uint256 amount)',
  'function balanceOf(address) view returns (uint256)',
] as const

export const HUB_ROUTER_ABI = [
  'function bridge(uint256 destChainId, address token, uint256 amount, bytes calldata data) payable',
] as const
