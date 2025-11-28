import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
	keccak256, 
	toUtf8Bytes, 
	hexlify, 
	AbiCoder, 
	solidityPackedKeccak256,
	recoverAddress,
	hashMessage,
	TypedDataEncoder,
	Signature,
	getBytes,
	concat,
	zeroPadValue,
	JsonRpcProvider,
	BrowserProvider,
	Wallet,
	parseEther,
	formatEther,
	parseUnits,
	formatUnits,
	TransactionResponse,
	TransactionRequest,
} from "ethers";
import Artifacts from "../common/HH3IgnitionTool";

type Section =
	| "transactions"
	| "signatures"
	| "contracts"
	| "utils"
	| "development";

// Supported Solidity types for abi.encodePacked
type SolidityType = "string" | "bytes" | "address" | "uint256" | "uint128" | "uint64" | "uint32" | "uint8" | "int256" | "bool" | "bytes32" | "bytes4";

const DevTools: React.FC = () => {
	const { chainId } = useParams<{ chainId?: string }>();

	// Active section state
	const [activeSection, setActiveSection] = useState<Section>("utils");

	// State for different tools
	const [encodedData, setEncodedData] = useState("");
	const [decodedData, setDecodedData] = useState("");
	const [ethAmount, setEthAmount] = useState("");
	const [finneyAmount, setFinneyAmount] = useState("");
	const [szaboAmount, setSzaboAmount] = useState("");
	const [gweiAmount, setGweiAmount] = useState("");
	const [mweiAmount, setMweiAmount] = useState("");
	const [kweiAmount, setKweiAmount] = useState("");
	const [weiAmount, setWeiAmount] = useState("");

	const [blockResult, setBlockResult] = useState<any>(null);
	const [txResult, setTxResult] = useState<any>(null);
	const [addressResult, setAddressResult] = useState<any>(null);
	const [error, setError] = useState("");

	// Collapsible section states
	const [showUnitConverter, setShowUnitConverter] = useState(false);
	const [showKeccakHasher, setShowKeccakHasher] = useState(false);
	const [showHexEncoder, setShowHexEncoder] = useState(false);
	const [showSignatureInspector, setShowSignatureInspector] = useState(false);
	const [showEIP712Tool, setShowEIP712Tool] = useState(false);

	// Signature Inspector state
	const [sigMessage, setSigMessage] = useState("");
	const [sigSignature, setSigSignature] = useState("");
	const [sigExpectedAddress, setSigExpectedAddress] = useState("");
	const [sigResults, setSigResults] = useState<{
		format?: string;
		messageFormat?: string;
		messageHash?: string;
		recoveredAddress?: string;
		r?: string;
		s?: string;
		v?: number;
		isCompact?: boolean;
		yParity?: number;
		addressMatch?: boolean;
		error?: string;
	} | null>(null);

	// EIP-712 Tool state
	const [eip712Input, setEip712Input] = useState(JSON.stringify({
		domain: {
			name: "MyApp",
			version: "1",
			chainId: 1,
			verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
		},
		types: {
			Person: [
				{ name: "name", type: "string" },
				{ name: "wallet", type: "address" }
			]
		},
		message: {
			name: "Alice",
			wallet: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
		}
	}, null, 2));
	const [eip712Results, setEip712Results] = useState<{
		domainSeparator?: string;
		structHash?: string;
		messageHash?: string;
		encodedData?: string;
		decodedMessage?: string;
		error?: string;
	} | null>(null);

// ---------------------- Transaction Builder state ----------------------
const [txFrom, setTxFrom] = useState("");
const [txTo, setTxTo] = useState("");
const [txValue, setTxValue] = useState("");
const [txData, setTxData] = useState("");
const [txGasLimit, setTxGasLimit] = useState<string | undefined>(undefined);
const [txGasPrice, setTxGasPrice] = useState<string | undefined>(undefined);
const [txMaxFeePerGas, setTxMaxFeePerGas] = useState<string | undefined>(undefined);
const [txMaxPriorityFeePerGas, setTxMaxPriorityFeePerGas] = useState<string | undefined>(undefined);
const [txNonce, setTxNonce] = useState<number | undefined>(undefined);
const [txChainId, setTxChainId] = useState<number | undefined>(undefined);
const [txType, setTxType] = useState<0 | 2>(2); // 0 = legacy, 2 = EIP-1559
const [useMetaMask, setUseMetaMask] = useState(true);
const [localPrivateKey, setLocalPrivateKey] = useState("");
const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
const [suggestedFees, setSuggestedFees] = useState<any>(null);
const [ethUsdPrice, setEthUsdPrice] = useState<number | null>(null);
const [estimatedCostEth, setEstimatedCostEth] = useState<string | null>(null);
const [estimatedCostUsd, setEstimatedCostUsd] = useState<string | null>(null);
const [txSending, setTxSending] = useState(false);
const [txHashResult, setTxHashResult] = useState<string | null>(null);
const [txError, setTxError] = useState<string | null>(null);
const [txWillRevert, setTxWillRevert] = useState<boolean>(false);
const [revertReason, setRevertReason] = useState<string | null>(null);
const [builtTx, setBuiltTx] = useState<string | null>(null);
const [showAdvancedRaw, setShowAdvancedRaw] = useState(false);
const [rawRlp, setRawRlp] = useState("");

// Basic network rpc map (can be replaced by app config)
const NETWORKS: Record<number, { name: string; rpc: string }> = {
	1: { name: "Ethereum Mainnet", rpc: "https://mainnet.infura.io/v3/" },
	10: { name: "Optimism", rpc: "https://mainnet.optimism.io" },
	42161: { name: "Arbitrum One", rpc: "https://arb1.arbitrum.io/rpc" },
	8453: { name: "Base", rpc: "https://mainnet.base.org" },
	137: { name: "Polygon", rpc: "https://polygon-rpc.com" },
};


// Fetch a simple ETH/USD price from CoinGecko
const fetchEthPrice = async () => {
	try {
		const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
		const json = await res.json();
		const price = json?.ethereum?.usd;
		if (price) setEthUsdPrice(price);
	} catch (err) {
		// ignore
	}
};

useEffect(() => { fetchEthPrice(); }, []);

// Helpers
const parseEtherSafe = (v?: string): bigint => {
	if (!v) return BigInt(0);
	try {
		return parseEther(v);
	} catch {
		return BigInt(0);
	}
};

const formatEthValue = (bn: bigint) => formatEther(bn);

// Estimate gas and fees using rpc
const estimateGasAndFees = async () => {
	setTxError(null);
	setTxWillRevert(false);
	setRevertReason(null);
	try {
		const chainId = txChainId || 1;
		const net = NETWORKS[chainId];
		if (!net) throw new Error("Unknown network - select a supported chainId");
		const provider = new JsonRpcProvider(net.rpc);

		const to = txTo || undefined;
		const value = parseEtherSafe(txValue);
		const txReq: any = { to, value, data: txData || undefined };

		let gas: bigint;
		let willRevert = false;
		let revertMsg: string | null = null;

		// First, try to simulate with eth_call to detect revert
		try {
			await provider.call(txReq);
		} catch (callErr: any) {
			willRevert = true;
			// Extract revert reason from error
			const errMsg = callErr.message || String(callErr);
			if (callErr.data) {
				revertMsg = `Revert data: ${callErr.data}`;
			} else if (errMsg.includes("revert")) {
				revertMsg = errMsg;
			} else if (errMsg.includes("execution reverted")) {
				revertMsg = errMsg;
			} else {
				revertMsg = `Transaction will fail: ${errMsg}`;
			}
		}

		// Try to estimate gas - may fail if tx reverts
		try {
			gas = await provider.estimateGas(txReq);
		} catch (estErr: any) {
			// If estimation fails, use a high default for display purposes
			// The actual gas used would be up to the block gas limit
			gas = BigInt(500000); // Fallback estimate
			if (!willRevert) {
				willRevert = true;
				revertMsg = estErr.message || "Gas estimation failed - transaction may revert";
			}
		}

		setEstimatedGas(gas.toString());
		setTxWillRevert(willRevert);
		setRevertReason(revertMsg);

		// Fee suggestion
		const feeData = await provider.getFeeData();
		setSuggestedFees(feeData);

		// compute cost
		const gasPriceBN = txType === 0 ? (feeData.gasPrice ?? BigInt(0)) : (feeData.maxFeePerGas ?? BigInt(0));
		const cost = gas * gasPriceBN;
		setEstimatedCostEth(formatEthValue(cost));
		if (ethUsdPrice) setEstimatedCostUsd((parseFloat(formatEthValue(cost)) * ethUsdPrice).toFixed(6));
	} catch (err: any) {
		setTxError(err.message || String(err));
	}
};

const fetchNonceForAddress = async (address: string, chainId?: number) => {
	try {
		const cid = chainId || txChainId || 1;
		const net = NETWORKS[cid];
		if (!net) throw new Error("Unknown network");
		const provider = new JsonRpcProvider(net.rpc);
		const n = await provider.getTransactionCount(address);
		setTxNonce(n);
		return n;
	} catch (err) {
		return undefined;
	}
};

// Send transaction (signed either via local key or MetaMask)
const sendTransaction = async () => {
	setTxError(null);
	setTxHashResult(null);
	setTxSending(true);
	try {
		const chainId = txChainId || 1;
		const net = NETWORKS[chainId];
		if (!net) throw new Error("Unknown network");
		const provider = new JsonRpcProvider(net.rpc);

		const txRequest: TransactionRequest = {
			to: txTo || undefined,
			value: parseEtherSafe(txValue),
			data: txData || undefined,
			gasLimit: txGasLimit ? BigInt(txGasLimit) : (estimatedGas ? BigInt(estimatedGas) : undefined),
		};

		if (txType === 2) {
			if (txMaxFeePerGas) txRequest.maxFeePerGas = parseUnits(txMaxFeePerGas, "gwei");
			if (txMaxPriorityFeePerGas) txRequest.maxPriorityFeePerGas = parseUnits(txMaxPriorityFeePerGas, "gwei");
		} else {
			if (txGasPrice) txRequest.gasPrice = parseUnits(txGasPrice, "gwei");
		}

		if (typeof txNonce === "number") txRequest.nonce = txNonce;
		txRequest.chainId = BigInt(chainId);

		let sentTx: TransactionResponse;

		if (!useMetaMask && localPrivateKey) {
			const wallet = new Wallet(localPrivateKey, provider);
			sentTx = await wallet.sendTransaction(txRequest);
		} else {
			// MetaMask signing
			if (!(window as any).ethereum) throw new Error("No injected wallet (window.ethereum) found");
			const web3Provider = new BrowserProvider((window as any).ethereum as any);
			const signer = await web3Provider.getSigner();
			sentTx = await signer.sendTransaction(txRequest);
		}

		setTxHashResult(sentTx.hash);
		setTxSending(false);
	} catch (err: any) {
		setTxError(err.message || String(err));
		setTxSending(false);
	}
};

// Build unsigned transaction object (for offline signing, multisig, etc.)
const buildTransaction = () => {
	setTxError(null);
	setBuiltTx(null);
	try {
		const chainId = txChainId || 1;

		const txObj: Record<string, any> = {
			type: txType,
			chainId: chainId,
			to: txTo || null,
			value: txValue ? parseEtherSafe(txValue).toString() : "0",
			data: txData || "0x",
			gasLimit: txGasLimit || estimatedGas || null,
		};

		if (txFrom) txObj.from = txFrom;
		if (typeof txNonce === "number") txObj.nonce = txNonce;

		if (txType === 2) {
			txObj.maxFeePerGas = txMaxFeePerGas ? parseUnits(txMaxFeePerGas, "gwei").toString() : null;
			txObj.maxPriorityFeePerGas = txMaxPriorityFeePerGas ? parseUnits(txMaxPriorityFeePerGas, "gwei").toString() : null;
		} else {
			txObj.gasPrice = txGasPrice ? parseUnits(txGasPrice, "gwei").toString() : null;
		}

		setBuiltTx(JSON.stringify(txObj, null, 2));
	} catch (err: any) {
		setTxError(err.message || String(err));
	}
};

const sendRawRlpTx = async () => {
	setTxSending(true);
	setTxError(null);
	try {
		const chainId = txChainId || 1;
		const net = NETWORKS[chainId];
		if (!net) throw new Error("Unknown network");
		const provider = new JsonRpcProvider(net.rpc);
		const res = await provider.broadcastTransaction(rawRlp);
		setTxHashResult(res.hash);
	} catch (err: any) {
		setTxError(err.message || String(err));
	} finally {
		setTxSending(false);
	}
};
	const [eip712Mode, setEip712Mode] = useState<"encode" | "decode">("encode");
	const [eip712DecodeTypes, setEip712DecodeTypes] = useState(JSON.stringify({
		Person: [
			{ name: "name", type: "string" },
			{ name: "wallet", type: "address" }
		]
	}, null, 2));
	const [eip712DecodeData, setEip712DecodeData] = useState("");

	// Keccak tool state
	const [keccakInput, setKeccakInput] = useState("");
	const [keccakInputType, setKeccakInputType] = useState<SolidityType>("string");
	const [keccakResults, setKeccakResults] = useState<{
		encodedBytes?: string;
		rawHash?: string;
		solidityEncodePacked?: string;
		solidityEncode?: string;
		functionSelector?: string | null;
		isFunctionSignature?: boolean;
		error?: string;
	} | null>(null);

	// Parse input value based on selected type
	const parseInputValue = (input: string, type: SolidityType): any => {
		const trimmed = input.trim();
		switch (type) {
			case "string":
				return trimmed;
			case "bytes":
			case "bytes32":
			case "bytes4":
				// Expect hex input
				return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
			case "address":
				// Validate and return address
				if (!/^0x[0-9a-fA-F]{40}$/i.test(trimmed) && !/^[0-9a-fA-F]{40}$/i.test(trimmed)) {
					throw new Error("Invalid address format (expected 40 hex chars)");
				}
				return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
			case "uint256":
			case "uint128":
			case "uint64":
			case "uint32":
			case "uint8":
			case "int256":
				// Parse as BigInt for large numbers
				return BigInt(trimmed);
			case "bool":
				return trimmed.toLowerCase() === "true" || trimmed === "1";
			default:
				return trimmed;
		}
	};

	// Compute keccak hash on button click
	const computeKeccak = () => {
		if (!keccakInput.trim()) {
			setKeccakResults(null);
			return;
		}

		try {
			const abiCoder = AbiCoder.defaultAbiCoder();
			
			// Parse the input based on selected type
			const parsedValue = parseInputValue(keccakInput, keccakInputType);
			
			// Get raw bytes for display (UTF-8 for string, hex for others)
			let encodedHex: string;
			if (keccakInputType === "string") {
				encodedHex = hexlify(toUtf8Bytes(keccakInput));
			} else if (typeof parsedValue === "bigint") {
				// For numeric types, show the hex representation
				encodedHex = "0x" + parsedValue.toString(16).padStart(64, "0");
			} else {
				encodedHex = parsedValue;
			}

			// Raw keccak256 hash (of the string bytes directly - for function signatures)
			const rawBytes = toUtf8Bytes(keccakInput);
			const rawHash = keccak256(rawBytes);

			// Solidity keccak256(abi.encodePacked(type, value))
			const solidityEncodePacked = solidityPackedKeccak256([keccakInputType], [parsedValue]);

			// Solidity keccak256(abi.encode(type, value))
			const abiEncoded = abiCoder.encode([keccakInputType], [parsedValue]);
			const solidityEncode = keccak256(abiEncoded);

			// Check if input looks like a function signature (only relevant for string type)
			const functionSigPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\([^)]*\)$/;
			const isFunctionSignature = keccakInputType === "string" && functionSigPattern.test(keccakInput.trim());
			const functionSelector = isFunctionSignature ? rawHash.slice(0, 10) : null;

			setKeccakResults({
				encodedBytes: encodedHex,
				rawHash,
				solidityEncodePacked,
				solidityEncode,
				functionSelector,
				isFunctionSignature,
			});
		} catch (err: any) {
			setKeccakResults({ error: err.message || "Failed to compute hash" });
		}
	};

	const verifySignature = () => {
		try {
			if (!sigSignature) {
				setSigResults({ error: "Please provide a signature" });
				return;
			}

			const sig = sigSignature.trim();
			
			// Parse the signature
			let signature: Signature;
			let format: string;
			let isCompact = false;
			let yParity: number | undefined;

			// Detect signature format by length
			const sigBytes = getBytes(sig);
			
			if (sigBytes.length === 64) {
				// EIP-2098 compact signature (r || yParityAndS)
				format = "EIP-2098 Compact (64 bytes)";
				isCompact = true;
				signature = Signature.from(sig);
				yParity = signature.yParity;
			} else if (sigBytes.length === 65) {
				// Standard signature (r || s || v)
				format = "Standard (65 bytes)";
				signature = Signature.from(sig);
			} else {
				setSigResults({ error: `Invalid signature length: ${sigBytes.length} bytes (expected 64 or 65)` });
				return;
			}

			const r = signature.r;
			const s = signature.s;
			const v = signature.v;

			// Determine message hash based on input format
			let messageHash: string = "";
			let detectedMessageFormat: string = "Unknown";
			
			if (sigMessage.startsWith("0x") && sigMessage.length === 66) {
				// Already a hash
				messageHash = sigMessage;
				detectedMessageFormat = "Pre-hashed (32 bytes)";
			} else if (sigMessage.trim().startsWith("{")) {
				// Try to parse as JSON for EIP-712
				try {
					const parsed = JSON.parse(sigMessage);
					if (parsed.domain && parsed.types && parsed.message) {
						// EIP-712 typed data
						messageHash = TypedDataEncoder.hash(parsed.domain, parsed.types, parsed.message);
						detectedMessageFormat = "EIP-712 Typed Data";
					} else {
						// Not valid EIP-712, treat as string
						messageHash = hashMessage(sigMessage);
						detectedMessageFormat = "EIP-191 Personal Sign";
					}
				} catch {
					// Invalid JSON, treat as string
					messageHash = hashMessage(sigMessage);
					detectedMessageFormat = "EIP-191 Personal Sign";
				}
			} else {
				// EIP-191 personal sign (most common)
				messageHash = hashMessage(sigMessage);
				detectedMessageFormat = "EIP-191 Personal Sign";
			}

			// Recover the address
			const recoveredAddress = recoverAddress(messageHash, signature);

			// Check if it matches expected address
			let addressMatch: boolean | undefined;
			if (sigExpectedAddress) {
				addressMatch = recoveredAddress.toLowerCase() === sigExpectedAddress.toLowerCase();
			}

			setSigResults({
				format,
				messageFormat: detectedMessageFormat!,
				messageHash,
				recoveredAddress,
				r,
				s,
				v,
				isCompact,
				yParity,
				addressMatch,
			});
		} catch (err: any) {
			setSigResults({ error: err.message || "Failed to verify signature" });
		}
	};

	const encodeEIP712 = () => {
		try {
			const parsed = JSON.parse(eip712Input);
			const { domain, types, message } = parsed;

			if (!domain || !types || !message) {
				setEip712Results({ error: "JSON must contain domain, types, and message fields" });
				return;
			}

			// Get the primary type (first key in types that isn't EIP712Domain)
			const primaryType = Object.keys(types).find(t => t !== "EIP712Domain");
			if (!primaryType) {
				setEip712Results({ error: "No primary type found in types" });
				return;
			}

			// Calculate domain separator
			const domainSeparator = TypedDataEncoder.hashDomain(domain);

			// Calculate struct hash of the message
			const structHash = TypedDataEncoder.from(types).hash(message);

			// Calculate the final message hash (what gets signed)
			const messageHash = TypedDataEncoder.hash(domain, types, message);

			// Get the encoded data
			const encodedData = TypedDataEncoder.from(types).encodeData(primaryType, message);

			setEip712Results({
				domainSeparator,
				structHash,
				messageHash,
				encodedData,
			});
		} catch (err: any) {
			setEip712Results({ error: err.message || "Failed to encode EIP-712 data" });
		}
	};

	const decodeEIP712 = () => {
		try {
			const types = JSON.parse(eip712DecodeTypes);
			const data = eip712DecodeData.trim();

			if (!data.startsWith("0x")) {
				setEip712Results({ error: "Encoded data must be a hex string starting with 0x" });
				return;
			}

			// Get the primary type
			const primaryType = Object.keys(types).find(t => t !== "EIP712Domain");
			if (!primaryType) {
				setEip712Results({ error: "No primary type found in types" });
				return;
			}

			// Build ABI types array from the EIP-712 types
			const typeFields = types[primaryType];
			const abiTypes: string[] = ["bytes32"]; // First 32 bytes is the type hash
			for (const field of typeFields) {
				// Map EIP-712 types to ABI types
				let abiType = field.type;
				if (abiType === "string" || abiType === "bytes") {
					abiType = "bytes32"; // Strings and bytes are hashed
				} else if (types[abiType]) {
					abiType = "bytes32"; // Nested structs are hashed
				}
				abiTypes.push(abiType);
			}

			// Decode the data
			const abiCoder = AbiCoder.defaultAbiCoder();
			const decoded = abiCoder.decode(abiTypes, data);

			// Build the decoded message object
			const decodedMessage: Record<string, any> = {};
			decodedMessage["_typeHash"] = decoded[0]; // First value is the type hash
			
			for (let i = 0; i < typeFields.length; i++) {
				const field = typeFields[i];
				let value = decoded[i + 1];
				
				// Convert BigInt to string for display
				if (typeof value === "bigint") {
					value = value.toString();
				}
				
				// Note if value is a hash (for string/bytes/struct types)
				if (field.type === "string" || field.type === "bytes" || types[field.type]) {
					decodedMessage[field.name] = `${value} (hashed ${field.type})`;
				} else {
					decodedMessage[field.name] = value;
				}
			}

			setEip712Results({
				decodedMessage: JSON.stringify(decodedMessage, null, 2),
			});
		} catch (err: any) {
			setEip712Results({ error: err.message || "Failed to decode EIP-712 data" });
		}
	};

	const convertToHex = (data: string) => {
		try {
			// Try to convert various formats to hex
			if (data.startsWith("0x")) {
				setDecodedData(data);
				return;
			}

			// Convert string to hex
			const hex =
				"0x" +
				Array.from(data)
					.map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
					.join("");
			setDecodedData(hex);
		} catch (err: any) {
			setError(err.message || "Failed to convert to hex");
		}
	};

	const convertFromHex = (hexData: string) => {
		try {
			if (!hexData.startsWith("0x")) {
				setError("Invalid hex format (must start with 0x)");
				return;
			}

			const hex = hexData.slice(2);
			const str =
				hex
					.match(/.{1,2}/g)
					?.map((byte) => String.fromCharCode(parseInt(byte, 16)))
					.join("") || "";
			setDecodedData(str);
		} catch (err: any) {
			setError(err.message || "Failed to decode hex");
		}
	};

	const convertEth = (value: string, from: "eth" | "finney" | "szabo" | "gwei" | "mwei" | "kwei" | "wei") => {
		try {
			const num = parseFloat(value);
			if (isNaN(num)) return;

			// Convert to wei first, then to all other units
			let weiValue: number;
			switch (from) {
				case "eth":
					weiValue = num * 1e18;
					break;
				case "finney":
					weiValue = num * 1e15;
					break;
				case "szabo":
					weiValue = num * 1e12;
					break;
				case "gwei":
					weiValue = num * 1e9;
					break;
				case "mwei":
					weiValue = num * 1e6;
					break;
				case "kwei":
					weiValue = num * 1e3;
					break;
				case "wei":
					weiValue = num;
					break;
			}

			// Update all fields except the source
			if (from !== "eth") setEthAmount((weiValue / 1e18).toString());
			if (from !== "finney") setFinneyAmount((weiValue / 1e15).toString());
			if (from !== "szabo") setSzaboAmount((weiValue / 1e12).toString());
			if (from !== "gwei") setGweiAmount((weiValue / 1e9).toString());
			if (from !== "mwei") setMweiAmount((weiValue / 1e6).toString());
			if (from !== "kwei") setKweiAmount((weiValue / 1e3).toString());
			if (from !== "wei") setWeiAmount(weiValue.toString());
		} catch (err: any) {
			setError(err.message || "Failed to convert");
		}
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const clearAll = () => {
		setBlockResult(null);
		setTxResult(null);
		setAddressResult(null);
		setError("");
	};

	return (
		<div className="container-wide devtools-container">
			{/* Section Tabs */}
			<div className="devtools-tabs">
				<button
					className={`devtools-tab ${activeSection === "utils" ? "active" : ""}`}
					onClick={() => setActiveSection("utils")}
				>
					Utils
				</button>
				<button
					className={`devtools-tab ${activeSection === "transactions" ? "active" : ""}`}
					onClick={() => setActiveSection("transactions")}
				>
					Transactions
				</button>
				<button
					className={`devtools-tab ${activeSection === "signatures" ? "active" : ""}`}
					onClick={() => setActiveSection("signatures")}
				>
					Signatures
				</button>
				<button
					className={`devtools-tab ${activeSection === "contracts" ? "active" : ""}`}
					onClick={() => setActiveSection("contracts")}
				>
					Contracts
				</button>
				<button
					className={`devtools-tab ${activeSection === "development" ? "active" : ""}`}
					onClick={() => setActiveSection("development")}
				>
					Development
				</button>
			</div>

			{/* Error Display */}
			{error && (
				<div className="devtools-error">
					⚠️ {error}
					<button
						onClick={() => setError("")}
						className="devtools-error-dismiss"
					>
						✕
					</button>
				</div>
			)}

			{/* Transactions Section */}
			{activeSection === "transactions" && (
				<div className="devtools-section">
					<div className="devtools-card">
						<h3 className="devtools-tool-title">🧾 Transaction Builder</h3>
						<div className="flex-column" style={{ gap: "10px" }}>
							<div className="row" style={{ gap: "10px" }}>
								<label className="input-label">Network</label>
								<select
									value={txChainId ?? 1}
									onChange={(e) => setTxChainId(parseInt(e.target.value, 10))}
									className="devtools-input"
								>
									<option value={1}>Ethereum Mainnet (1)</option>
									<option value={10}>Optimism (10)</option>
									<option value={42161}>Arbitrum One (42161)</option>
									<option value={8453}>Base (8453)</option>
									<option value={137}>Polygon (137)</option>
								</select>
							</div>

							<div className="row" style={{ gap: "10px" }}>
								<div style={{ flex: 1 }}>
									<label className="input-label">From (address, optional)</label>
									<input type="text" className="devtools-input" value={txFrom} onChange={(e) => setTxFrom(e.target.value)} placeholder="0x... (for building unsigned tx)" />
								</div>
								<div style={{ flex: 1 }}>
									<label className="input-label">To (address)</label>
									<input type="text" className="devtools-input" value={txTo} onChange={(e) => setTxTo(e.target.value)} placeholder="0x..." />
								</div>
							</div>

							<div className="row" style={{ gap: "10px" }}>
								<div style={{ flex: 1 }}>
									<label className="input-label">Value (ETH)</label>
									<input type="text" className="devtools-input" value={txValue} onChange={(e) => setTxValue(e.target.value)} placeholder="0.01" />
								</div>
								<div style={{ width: 220 }}>
									<label className="input-label">Nonce (optional)</label>
									<input type="number" className="devtools-input" value={txNonce ?? ""} onChange={(e) => setTxNonce(e.target.value === "" ? undefined : parseInt(e.target.value, 10))} placeholder="auto" />
								</div>
							</div>

							<div className="flex-column">
								<label className="input-label">Data (hex, optional)</label>
								<textarea className="devtools-input mono" value={txData} onChange={(e) => setTxData(e.target.value)} style={{ minHeight: 80 }} placeholder="0x..." />
							</div>

							<div className="row" style={{ gap: "10px", alignItems: "flex-end" }}>
								<div>
									<label className="input-label">Tx Type</label>
									<select className="devtools-input" value={txType} onChange={(e) => setTxType(Number(e.target.value) as 0 | 2)}>
										<option value={2}>EIP-1559 (type 2)</option>
										<option value={0}>Legacy (type 0)</option>
									</select>
								</div>
								<div style={{ flex: 1 }}>
									<label className="input-label">Gas Limit (optional)</label>
									<input className="devtools-input" value={txGasLimit ?? ""} onChange={(e) => setTxGasLimit(e.target.value === "" ? undefined : e.target.value)} placeholder="auto-estimate" />
								</div>
							</div>

							{txType === 0 ? (
								<div className="row" style={{ gap: "10px" }}>
									<div style={{ flex: 1 }}>
										<label className="input-label">Gas Price (gwei)</label>
										<input className="devtools-input" value={txGasPrice ?? ""} onChange={(e) => setTxGasPrice(e.target.value === "" ? undefined : e.target.value)} placeholder="suggested" />
									</div>
								</div>
							) : (
								<div className="row" style={{ gap: "10px" }}>
									<div style={{ flex: 1 }}>
										<label className="input-label">Max Fee Per Gas (gwei)</label>
										<input className="devtools-input" value={txMaxFeePerGas ?? ""} onChange={(e) => setTxMaxFeePerGas(e.target.value === "" ? undefined : e.target.value)} placeholder="suggested" />
									</div>
									<div style={{ width: 220 }}>
										<label className="input-label">Max Priority Fee (gwei)</label>
										<input className="devtools-input" value={txMaxPriorityFeePerGas ?? ""} onChange={(e) => setTxMaxPriorityFeePerGas(e.target.value === "" ? undefined : e.target.value)} placeholder="suggested" />
									</div>
								</div>
							)}

							<div className="row" style={{ gap: "10px", alignItems: "center" }}>
								<label className="input-label" style={{ marginRight: 8 }}>Signing</label>
								<select className="devtools-input" value={useMetaMask ? "metamask" : "local"} onChange={(e) => setUseMetaMask(e.target.value === "metamask")} style={{ width: 220 }}>
									<option value="metamask">MetaMask / Injected</option>
									<option value="local">Local Private Key</option>
								</select>
								{!useMetaMask && (
									<input className="devtools-input mono" placeholder="0xYOURPRIVATEKEY" value={localPrivateKey} onChange={(e) => setLocalPrivateKey(e.target.value)} style={{ marginLeft: 8, marginTop: 8 }} />
								)}
							</div>

							<div className="row" style={{ gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
								<button className="devtools-button" onClick={estimateGasAndFees}>Estimate Gas & Fees</button>
								<button className="devtools-button" onClick={() => { if ((window as any).ethereum) fetchNonceForAddress((window as any).ethereum.selectedAddress || (window as any).ethereum?.accounts?.[0]); }}>Fetch Nonce</button>
								<button className="devtools-button" onClick={buildTransaction}>Build Transaction</button>
								<button className="devtools-button primary" onClick={sendTransaction} disabled={txSending}>{txSending ? "Sending..." : "Sign & Send"}</button>
							</div>

							{estimatedGas && (
								<div className="devtools-results">
									<div>Estimated Gas: <span className="mono">{estimatedGas}</span>{txWillRevert && <span style={{ color: "#f59e0b", marginLeft: 8 }}>(fallback estimate)</span>}</div>
									{suggestedFees && (
										<div>Suggested: <span className="mono">{txType === 0 ? `${suggestedFees.gasPrice ? formatUnits(suggestedFees.gasPrice, 'gwei') : 'N/A'} gwei` : `${suggestedFees.maxFeePerGas ? formatUnits(suggestedFees.maxFeePerGas, 'gwei') : 'N/A'} / ${suggestedFees.maxPriorityFeePerGas ? formatUnits(suggestedFees.maxPriorityFeePerGas, 'gwei') : 'N/A'} gwei`}</span></div>
									)}
									{estimatedCostEth && (
										<div>Estimated Cost: <span className="mono">{estimatedCostEth} ETH</span> {estimatedCostUsd && <span> (~${estimatedCostUsd} USD)</span>}</div>
									)}
								</div>
							)}

							{builtTx && (
								<div className="devtools-results">
									<div style={{ marginBottom: 8, fontWeight: 500 }}>Unsigned Transaction:</div>
									<textarea 
										className="devtools-input mono" 
										value={builtTx} 
										readOnly 
										style={{ minHeight: 150, resize: "vertical" }} 
									/>
									<button 
										className="devtools-button" 
										style={{ marginTop: 8 }}
										onClick={() => navigator.clipboard.writeText(builtTx)}
									>
										Copy to Clipboard
									</button>
								</div>
							)}

							{txWillRevert && (
								<div className="devtools-error" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", borderColor: "#f59e0b", color: "#f59e0b" }}>
									⚠️ Transaction will likely revert!
									{revertReason && <div style={{ marginTop: 4, fontSize: "0.9em", opacity: 0.9 }}>{revertReason}</div>}
								</div>
							)}

							{txHashResult && (
								<div className="devtools-results">Transaction sent: <a className="mono" href={`https://etherscan.io/tx/${txHashResult}`} target="_blank" rel="noreferrer">{txHashResult}</a></div>
							)}

							{txError && (
								<div className="devtools-error">{txError}</div>
							)}
						</div>
					</div>

					{/* Advanced: Raw RLP Section */}
					<div className="devtools-card">
						<div 
							className="devtools-tool-header cursor-pointer"
							onClick={() => setShowAdvancedRaw(!showAdvancedRaw)}
						>
							<h3 className="devtools-tool-title">📦 Raw RLP Transaction</h3>
							<span className="devtools-section-toggle">
								{showAdvancedRaw ? "▼" : "▶"}
							</span>
						</div>
						{showAdvancedRaw && (
							<div className="flex-column" style={{ gap: "12px" }}>
								<div className="flex-column" style={{ gap: "4px" }}>
									<label className="input-label">Signed Transaction (RLP hex)</label>
									<textarea className="devtools-input mono" value={rawRlp} onChange={(e) => setRawRlp(e.target.value)} placeholder="0x..." style={{ minHeight: 120 }} />
								</div>
								<div className="row" style={{ gap: 16, justifyContent: "center" }}>
									<button className="devtools-button" onClick={sendRawRlpTx} disabled={txSending}>{txSending ? "Sending..." : "Send Raw Transaction"}</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Signatures Section */}
			{activeSection === "signatures" && (
				<div className="devtools-section">
					{/* Signature Inspector */}
					<div className="devtools-card">
						<div 
							className="devtools-tool-header cursor-pointer"
							onClick={() => setShowSignatureInspector(!showSignatureInspector)}
						>
							<h3 className="devtools-tool-title">🔍 Signature Inspector</h3>
							<span className="devtools-section-toggle">
								{showSignatureInspector ? "▼" : "▶"}
							</span>
						</div>
						{showSignatureInspector && (
							<div className="flex-column" style={{ gap: "12px" }}>
								<div className="flex-column" style={{ gap: "4px" }}>
									<label className="input-label">Message (string, hex hash, or EIP-712 JSON)</label>
									<textarea
										placeholder='Hello World, 0x1234...abcd, or {"domain":...}'
										value={sigMessage}
										onChange={(e) => setSigMessage(e.target.value)}
										className="devtools-input"
										style={{ minHeight: "80px", resize: "vertical" }}
									/>
								</div>
								<div className="flex-column" style={{ gap: "4px" }}>
									<label className="input-label">Signature (65 or 64 bytes hex)</label>
									<input
										type="text"
										placeholder="0x..."
										value={sigSignature}
										onChange={(e) => setSigSignature(e.target.value)}
										className="devtools-input"
									/>
								</div>
								<button 
									onClick={verifySignature}
									className="devtools-button"
								>
									Verify Signature
								</button>

								{sigResults && (
									<div className="devtools-results">
										{sigResults.error ? (
											<div className="devtools-error">{sigResults.error}</div>
										) : (
											<div className="signature-results">
												<div className="sig-result-row">
													<span className="sig-result-label">Signature Format:</span>
													<span className="sig-result-value">{sigResults.format}</span>
												</div>
												<div className="sig-result-row">
													<span className="sig-result-label">Message Format:</span>
													<span className="sig-result-value">{sigResults.messageFormat}</span>
												</div>
												<div className="sig-result-row">
													<span className="sig-result-label">Message Hash:</span>
													<span className="sig-result-value mono">{sigResults.messageHash}</span>
												</div>
												<div className="sig-result-row">
													<span className="sig-result-label">Recovered Address:</span>
													<span className="sig-result-value mono">{sigResults.recoveredAddress}</span>
												</div>
												<div className="sig-components">
													<div className="sig-component-title">Signature Components</div>
													<div className="sig-result-row">
														<span className="sig-result-label">r:</span>
														<span className="sig-result-value mono">{sigResults.r}</span>
													</div>
													<div className="sig-result-row">
														<span className="sig-result-label">s:</span>
														<span className="sig-result-value mono">{sigResults.s}</span>
													</div>
													<div className="sig-result-row">
														<span className="sig-result-label">v:</span>
														<span className="sig-result-value">{sigResults.v}</span>
													</div>
													{sigResults.isCompact && sigResults.yParity !== undefined && (
														<div className="sig-result-row">
															<span className="sig-result-label">yParity:</span>
															<span className="sig-result-value">{sigResults.yParity}</span>
														</div>
													)}
												</div>
											</div>
										)}
									</div>
								)}
							</div>
						)}
					</div>

					{/* EIP-712 Encoder/Decoder */}
					<div className="devtools-card">
						<div 
							className="devtools-tool-header cursor-pointer"
							onClick={() => setShowEIP712Tool(!showEIP712Tool)}
						>
							<h3 className="devtools-tool-title">📋 EIP-712 Encoder/Decoder</h3>
							<span className="devtools-section-toggle">
								{showEIP712Tool ? "▼" : "▶"}
							</span>
						</div>
						{showEIP712Tool && (
							<div className="flex-column" style={{ gap: "12px" }}>
								{/* Mode Toggle */}
								<div className="keccak-mode-toggle">
									<button
										className={`keccak-mode-btn ${eip712Mode === "encode" ? "active" : ""}`}
										onClick={() => { setEip712Mode("encode"); setEip712Results(null); }}
									>
										Encode
									</button>
									<button
										className={`keccak-mode-btn ${eip712Mode === "decode" ? "active" : ""}`}
										onClick={() => { setEip712Mode("decode"); setEip712Results(null); }}
									>
										Decode
									</button>
								</div>

								{eip712Mode === "encode" ? (
									<>
										<div className="flex-column" style={{ gap: "4px" }}>
											<label className="input-label">EIP-712 JSON (domain, types, message)</label>
											<textarea
												placeholder='{"domain": {...}, "types": {...}, "message": {...}}'
												value={eip712Input}
												onChange={(e) => setEip712Input(e.target.value)}
												className="devtools-input mono"
												style={{ minHeight: "200px", resize: "vertical" }}
											/>
										</div>
										<button 
											onClick={encodeEIP712}
											className="devtools-button"
										>
											Encode EIP-712
										</button>
									</>
								) : (
									<>
										<div className="flex-column" style={{ gap: "4px" }}>
											<label className="input-label">Types Definition</label>
											<textarea
												placeholder='{"Person": [{"name": "name", "type": "string"}]}'
												value={eip712DecodeTypes}
												onChange={(e) => setEip712DecodeTypes(e.target.value)}
												className="devtools-input mono"
												style={{ minHeight: "100px", resize: "vertical" }}
											/>
										</div>
										<div className="flex-column" style={{ gap: "4px" }}>
											<label className="input-label">Encoded Data (hex)</label>
											<textarea
												placeholder="0x..."
												value={eip712DecodeData}
												onChange={(e) => setEip712DecodeData(e.target.value)}
												className="devtools-input mono"
												style={{ minHeight: "80px", resize: "vertical" }}
											/>
										</div>
										<button 
											onClick={decodeEIP712}
											className="devtools-button"
										>
											Decode EIP-712
										</button>
									</>
								)}

								{eip712Results && (
									<div className="devtools-results">
										{eip712Results.error ? (
											<div className="devtools-error">{eip712Results.error}</div>
										) : eip712Mode === "encode" ? (
											<div className="eip712-results">
												<div className="sig-result-row">
													<span className="sig-result-label">Domain Separator:</span>
													<span className="sig-result-value mono">{eip712Results.domainSeparator}</span>
												</div>
												<div className="sig-result-row">
													<span className="sig-result-label">Struct Hash:</span>
													<span className="sig-result-value mono">{eip712Results.structHash}</span>
												</div>
												<div className="sig-result-row">
													<span className="sig-result-label">Message Hash (signable):</span>
													<span className="sig-result-value mono">{eip712Results.messageHash}</span>
												</div>
												<div className="sig-result-row">
													<span className="sig-result-label">Encoded Data:</span>
													<span className="sig-result-value mono" style={{ wordBreak: "break-all" }}>{eip712Results.encodedData}</span>
												</div>
											</div>
										) : (
											<div className="eip712-results">
												<div className="sig-result-row" style={{ flexDirection: "column", gap: "8px" }}>
													<span className="sig-result-label">Decoded Message:</span>
													<pre className="devtools-input mono" style={{ 
														margin: 0, 
														padding: "12px", 
														whiteSpace: "pre-wrap",
														wordBreak: "break-all",
														fontSize: "0.85rem"
													}}>
														{eip712Results.decodedMessage}
													</pre>
												</div>
											</div>
										)}
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Contracts Section */}
			{activeSection === "contracts" && (
				<div className="devtools-section">
					<div className="devtools-coming-soon">
						<span className="devtools-coming-soon-icon">📄</span>
						<h3>Contract Tools</h3>
						<p>More tools coming soon</p>
					</div>
				</div>
			)}

			{/* Utils Section */}
			{activeSection === "utils" && (
				<div className="devtools-section">
					{/* Unit Converter */}
					<div className="devtools-card">
						<div 
							className="devtools-tool-header cursor-pointer"
							onClick={() => setShowUnitConverter(!showUnitConverter)}
						>
							<h3 className="devtools-tool-title">⇄ Unit Converter</h3>
							<span className="devtools-section-toggle">
								{showUnitConverter ? "▼" : "▶"}
							</span>
						</div>
						{showUnitConverter && (
							<div className="unit-converter-list">
								<div className="unit-converter-row">
									<label className="unit-converter-label">ETH (10¹⁸)</label>
									<input
										type="text"
										placeholder="1.0"
										value={ethAmount}
										onChange={(e) => {
											setEthAmount(e.target.value);
											convertEth(e.target.value, "eth");
										}}
										className="devtools-input"
									/>
								</div>
								<div className="unit-converter-row">
									<label className="unit-converter-label">Finney (10¹⁵)</label>
									<input
										type="text"
										placeholder="1000"
										value={finneyAmount}
										onChange={(e) => {
											setFinneyAmount(e.target.value);
											convertEth(e.target.value, "finney");
										}}
										className="devtools-input"
									/>
								</div>
								<div className="unit-converter-row">
									<label className="unit-converter-label">Szabo (10¹²)</label>
									<input
										type="text"
										placeholder="1000000"
										value={szaboAmount}
										onChange={(e) => {
											setSzaboAmount(e.target.value);
											convertEth(e.target.value, "szabo");
										}}
										className="devtools-input"
									/>
								</div>
								<div className="unit-converter-row">
									<label className="unit-converter-label">Gwei (10⁹)</label>
									<input
										type="text"
										placeholder="1000000000"
										value={gweiAmount}
										onChange={(e) => {
											setGweiAmount(e.target.value);
											convertEth(e.target.value, "gwei");
										}}
										className="devtools-input"
									/>
								</div>
								<div className="unit-converter-row">
									<label className="unit-converter-label">Mwei (10⁶)</label>
									<input
										type="text"
										placeholder="1000000000000"
										value={mweiAmount}
										onChange={(e) => {
											setMweiAmount(e.target.value);
											convertEth(e.target.value, "mwei");
										}}
										className="devtools-input"
									/>
								</div>
								<div className="unit-converter-row">
									<label className="unit-converter-label">Kwei (10³)</label>
									<input
										type="text"
										placeholder="1000000000000000"
										value={kweiAmount}
										onChange={(e) => {
											setKweiAmount(e.target.value);
											convertEth(e.target.value, "kwei");
										}}
										className="devtools-input"
									/>
								</div>
								<div className="unit-converter-row">
									<label className="unit-converter-label">Wei (10⁰)</label>
									<input
										type="text"
										placeholder="1000000000000000000"
										value={weiAmount}
										onChange={(e) => {
											setWeiAmount(e.target.value);
											convertEth(e.target.value, "wei");
										}}
										className="devtools-input"
									/>
								</div>
							</div>
						)}
					</div>

					{/* Keccak256 Tool */}
					<div className="devtools-card">
						<div 
							className="devtools-tool-header cursor-pointer"
							onClick={() => setShowKeccakHasher(!showKeccakHasher)}
						>
							<h3 className="devtools-tool-title">#️⃣ Keccak256 Hasher</h3>
							<span className="devtools-section-toggle">
								{showKeccakHasher ? "▼" : "▶"}
							</span>
						</div>
						{showKeccakHasher && (
							<div className="flex-column" style={{ gap: "12px" }}>
								{/* Type selector and input on same line */}
								<div className="keccak-input-row">
									<select
										value={keccakInputType}
										onChange={(e) => setKeccakInputType(e.target.value as SolidityType)}
										className="devtools-select keccak-type-select"
									>
										<optgroup label="Dynamic Types">
											<option value="string">string</option>
											<option value="bytes">bytes</option>
										</optgroup>
										<optgroup label="Fixed Types">
											<option value="address">address</option>
											<option value="bool">bool</option>
											<option value="bytes32">bytes32</option>
											<option value="bytes4">bytes4</option>
										</optgroup>
										<optgroup label="Numeric Types">
											<option value="uint256">uint256</option>
											<option value="uint128">uint128</option>
											<option value="uint64">uint64</option>
											<option value="uint32">uint32</option>
											<option value="uint8">uint8</option>
											<option value="int256">int256</option>
										</optgroup>
									</select>
									<input
										type="text"
										placeholder={
											keccakInputType === "string" ? "Enter text (e.g., transfer(address,uint256))" :
											keccakInputType === "address" ? "Enter address (0x...)" :
											keccakInputType === "bool" ? "Enter true/false or 1/0" :
											keccakInputType.startsWith("uint") || keccakInputType.startsWith("int") ? "Enter number" :
											"Enter hex value (0x...)"
										}
										value={keccakInput}
										onChange={(e) => setKeccakInput(e.target.value)}
										className="devtools-input"
									/>
								</div>

								<button
									onClick={computeKeccak}
									className="devtools-btn"
								>
									Hash
								</button>

								{/* Results */}
								{keccakResults && !keccakResults.error && keccakResults.rawHash && (
									<div className="keccak-results">
										{/* Encoded Bytes - show for all types */}
										{keccakResults.encodedBytes && (
											<div className="keccak-result-item">
												<div className="keccak-result-header">
													<span className="keccak-result-label">Encoded Bytes</span>
													<button
														onClick={() => copyToClipboard(keccakResults.encodedBytes!)}
														className="devtools-copy-btn"
													>
														📋
													</button>
												</div>
												<div className="keccak-result-value">{keccakResults.encodedBytes}</div>
											</div>
										)}

										{/* Raw Keccak256 Hash */}
										<div className="keccak-result-item">
											<div className="keccak-result-header">
												<span className="keccak-result-label">Keccak256 Hash</span>
												<button
													onClick={() => copyToClipboard(keccakResults.rawHash!)}
													className="devtools-copy-btn"
												>
													📋
												</button>
											</div>
											<div className="keccak-result-value">{keccakResults.rawHash}</div>
										</div>

										{/* Solidity abi.encodePacked */}
										<div className="keccak-result-item">
											<div className="keccak-result-header">
												<span className="keccak-result-label">keccak256(abi.encodePacked(input))</span>
												<button
													onClick={() => copyToClipboard(keccakResults.solidityEncodePacked!)}
													className="devtools-copy-btn"
												>
													📋
												</button>
											</div>
											<div className="keccak-result-value">{keccakResults.solidityEncodePacked}</div>
										</div>

										{/* Solidity abi.encode */}
										<div className="keccak-result-item">
											<div className="keccak-result-header">
												<span className="keccak-result-label">keccak256(abi.encode(input))</span>
												<button
													onClick={() => copyToClipboard(keccakResults.solidityEncode!)}
													className="devtools-copy-btn"
												>
													📋
												</button>
											</div>
											<div className="keccak-result-value">{keccakResults.solidityEncode}</div>
										</div>

										{/* Function Selector (if applicable) */}
										{keccakResults.isFunctionSignature && keccakResults.functionSelector && (
											<div className="keccak-result-item keccak-selector">
												<div className="keccak-result-header">
													<span className="keccak-result-label">
														🎯 Function Selector (bytes4)
													</span>
													<button
														onClick={() => copyToClipboard(keccakResults.functionSelector!)}
														className="devtools-copy-btn"
													>
														📋
													</button>
												</div>
												<div className="keccak-result-value keccak-selector-value">
													{keccakResults.functionSelector}
												</div>
											</div>
										)}
									</div>
								)}

								{/* Error display */}
								{keccakResults?.error && (
									<div className="keccak-error">
										⚠️ {keccakResults.error}
									</div>
								)}
							</div>
						)}
					</div>

					{/* Hex Encoder/Decoder */}
					<div className="devtools-card">
						<div 
							className="devtools-tool-header cursor-pointer"
							onClick={() => setShowHexEncoder(!showHexEncoder)}
						>
							<h3 className="devtools-tool-title">🔤 Hex Encoder/Decoder</h3>
							<span className="devtools-section-toggle">
								{showHexEncoder ? "▼" : "▶"}
							</span>
						</div>
						{showHexEncoder && (
							<div className="flex-column" style={{ gap: "12px" }}>
								<textarea
									placeholder="Enter text or hex data"
									value={encodedData}
									onChange={(e) => setEncodedData(e.target.value)}
									className="devtools-textarea"
								/>
								<div className="flex-between" style={{ gap: "12px" }}>
									<button
										onClick={() => convertToHex(encodedData)}
										className="devtools-btn"
									>
										Encode to Hex
									</button>
									<button
										onClick={() => convertFromHex(encodedData)}
										className="devtools-btn"
									>
										Decode from Hex
									</button>
								</div>
								{decodedData && (
									<div className="devtools-result">
										<div className="devtools-result-header">
											<span className="devtools-result-label">Result:</span>
											<button
												onClick={() => copyToClipboard(decodedData)}
												className="devtools-copy-btn"
											>
												📋 Copy
											</button>
										</div>
										<div className="devtools-result-value">{decodedData}</div>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Results Section */}
					{(blockResult || txResult || addressResult) && (
						<div className="devtools-card">
							<div className="flex-between mb-medium">
								<h3 className="devtools-tool-title-inline">📊 Results</h3>
								<button onClick={clearAll} className="devtools-clear-btn">
									Clear All
								</button>
							</div>
							<pre className="devtools-results-pre">
								{JSON.stringify(
									blockResult || txResult || addressResult,
									null,
									2,
								)}
							</pre>
						</div>
					)}
				</div>
			)}

			{/* Development Section */}
			{activeSection === "development" && (
				<div className="devtools-section">
					{/* Hardhat Artifacts Section */}
					<Artifacts />
				</div>
			)}
		</div>
	);
};

export default DevTools;
