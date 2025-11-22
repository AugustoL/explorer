import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Block, BlockArbitrum } from '../../types';

interface BlockDisplayProps {
    block: Block | BlockArbitrum;
    chainId?: string;
}

const BlockDisplay: React.FC<BlockDisplayProps> = ({ block, chainId }) => {
    const [showWithdrawals, setShowWithdrawals] = useState(false);
    const [showTransactions, setShowTransactions] = useState(false);
    
    // Check if this is an Arbitrum block
    const isArbitrumBlock = (block: Block | BlockArbitrum): block is BlockArbitrum => {
        return 'l1BlockNumber' in block;
    };
    
    // Helper to truncate long hashes
    const truncate = (str: string, start = 6, end = 4) => {
        if (!str) return '';
        if (str.length <= start + end) return str;
        return `${str.slice(0, start)}...${str.slice(-end)}`;
    };

    // Helper to format timestamp
    const formatTime = (timestamp: string) => {
        try {
            // Assuming timestamp is in seconds (standard for ETH)
            const date = new Date(Number(timestamp) * 1000);
            return date.toLocaleString();
        } catch (e) {
            return timestamp;
        }
    };

    return (
        <div className="block-display-card">
            <div className="block-display-header">
                <span className="block-label">Block:</span>
                <span className="block-number">{Number(block.number).toLocaleString()}</span>
            </div>

            {/* Basic Info */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Timestamp</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{formatTime(block.timestamp)}</span>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Transactions</span>
                    <span style={{ 
                        fontWeight: '600',
                        color: '#059669',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{block.transactions ? block.transactions.length : 0}</span>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Uncles</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{block.uncles ? block.uncles.length : 0}</span>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Size</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{Number(block.size).toLocaleString()} bytes</span>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Nonce</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{Number(block.nonce).toString()}</span>
                </div>
            </div>

            {/* Hashes */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '10px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Hash</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem',
                        wordBreak: 'break-all'
                    }} title={block.hash}>{truncate(block.hash, 10, 8)}</span>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '10px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Parent Hash</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem'
                    }}>
                        {chainId && block.parentHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? (
                            <Link 
                                to={`/${chainId}/block/${Number(block.number) - 1}`}
                                style={{ 
                                    color: '#10b981', 
                                    fontWeight: '600',
                                    textDecoration: 'none'
                                }}
                            >
                                {truncate(block.parentHash, 10, 8)}
                            </Link>
                        ) : (
                            truncate(block.parentHash, 10, 8)
                        )}
                    </span>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '10px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Miner</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem'
                    }} title={block.miner}>
                        {chainId ? (
                            <Link 
                                to={`/${chainId}/address/${block.miner}`}
                                style={{ 
                                    color: '#10b981', 
                                    fontWeight: '600',
                                    textDecoration: 'none'
                                }}
                            >
                                {truncate(block.miner)}
                            </Link>
                        ) : (
                            truncate(block.miner)
                        )}
                    </span>
                </div>
            </div>

            {/* Gas Details */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Gas Used</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>
                        {Number(block.gasUsed).toLocaleString()}
                        <span style={{ color: '#6b7280', marginLeft: '4px', fontSize: '0.85rem' }}>
                            ({((Number(block.gasUsed) / Number(block.gasLimit)) * 100).toFixed(1)}%)
                        </span>
                    </span>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Gas Limit</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{Number(block.gasLimit).toLocaleString()}</span>
                </div>
            </div>

            {/* Difficulty */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Difficulty</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{Number(block.difficulty).toLocaleString()}</span>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Total Difficulty</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{Number(block.totalDifficulty).toLocaleString()}</span>
                </div>
            </div>

            {/* Merkle Roots */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '12px',
                marginBottom: block.extraData && block.extraData !== '0x' ? '16px' : '0'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '10px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>State Root</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem',
                        wordBreak: 'break-all'
                    }} title={block.stateRoot}>{truncate(block.stateRoot, 10, 8)}</span>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '10px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Transactions Root</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem',
                        wordBreak: 'break-all'
                    }} title={block.transactionsRoot}>{truncate(block.transactionsRoot, 10, 8)}</span>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '10px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Receipts Root</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem',
                        wordBreak: 'break-all'
                    }} title={block.receiptsRoot}>{truncate(block.receiptsRoot, 10, 8)}</span>
                </div>
            </div>

            {/* Extra Data */}
            {block.extraData && block.extraData !== '0x' && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '10px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Extra Data</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem',
                        wordBreak: 'break-all'
                    }} title={block.extraData}>
                        {block.extraData.length > 20 ? truncate(block.extraData, 10, 8) : block.extraData}
                    </span>
                </div>
            )}

            {/* Arbitrum-specific fields */}
            {isArbitrumBlock(block) && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    marginTop: '16px',
                    marginBottom: '16px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        borderRadius: '8px',
                        borderLeft: '3px solid #3b82f6'
                    }}>
                        <span style={{ 
                            fontSize: '0.85rem',
                            color: '#3b82f6',
                            fontWeight: '600',
                            fontFamily: 'Outfit, sans-serif'
                        }}>L1 Block Number</span>
                        <span style={{ 
                            fontWeight: '500',
                            color: 'var(--text-color, #1f2937)',
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '0.95rem'
                        }}>{Number(block.l1BlockNumber).toLocaleString()}</span>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        borderRadius: '8px',
                        borderLeft: '3px solid #3b82f6'
                    }}>
                        <span style={{ 
                            fontSize: '0.85rem',
                            color: '#3b82f6',
                            fontWeight: '600',
                            fontFamily: 'Outfit, sans-serif'
                        }}>Send Count</span>
                        <span style={{ 
                            fontWeight: '500',
                            color: 'var(--text-color, #1f2937)',
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '0.95rem'
                        }}>{block.sendCount}</span>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '10px 12px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        borderRadius: '8px',
                        borderLeft: '3px solid #3b82f6',
                        gridColumn: '1 / -1'
                    }}>
                        <span style={{ 
                            fontSize: '0.85rem',
                            color: '#3b82f6',
                            fontWeight: '600',
                            fontFamily: 'Outfit, sans-serif'
                        }}>Send Root</span>
                        <span style={{ 
                            fontWeight: '500',
                            color: 'var(--text-color, #1f2937)',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            wordBreak: 'break-all'
                        }}>{block.sendRoot}</span>
                    </div>
                </div>
            )}

            {/* Transactions */}
            {block.transactions && block.transactions.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                    <button
                        onClick={() => setShowTransactions(!showTransactions)}
                        style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            marginBottom: '10px'
                        }}
                    >
                        {showTransactions ? 'Hide' : 'Show'} Transactions ({block.transactions.length})
                    </button>
                    
                    {showTransactions && (
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '10px' 
                        }}>
                            {block.transactions.map((txHash, index) => (
                                <div key={index} style={{
                                    background: 'rgba(16, 185, 129, 0.04)',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    borderLeft: '3px solid #10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px'
                                }}>
                                    <div style={{ 
                                        fontFamily: 'Outfit, sans-serif', 
                                        fontWeight: '600', 
                                        color: '#6b7280',
                                        fontSize: '0.85rem',
                                        minWidth: '60px'
                                    }}>
                                        Tx {index}
                                    </div>
                                    {chainId ? (
                                        <Link 
                                            to={`/${chainId}/tx/${txHash}`}
                                            style={{ 
                                                color: '#10b981', 
                                                fontWeight: '600',
                                                textDecoration: 'none',
                                                fontFamily: 'monospace',
                                                fontSize: '0.85rem',
                                                wordBreak: 'break-all',
                                                flex: 1
                                            }}
                                        >
                                            {txHash}
                                        </Link>
                                    ) : (
                                        <span style={{ 
                                            fontFamily: 'monospace', 
                                            fontSize: '0.85rem',
                                            wordBreak: 'break-all',
                                            flex: 1
                                        }}>
                                            {txHash}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Withdrawals */}
            {block.withdrawals && block.withdrawals.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                    <button
                        onClick={() => setShowWithdrawals(!showWithdrawals)}
                        style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            marginBottom: '10px'
                        }}
                    >
                        {showWithdrawals ? 'Hide' : 'Show'} Withdrawals ({block.withdrawals.length})
                    </button>
                    
                    {showWithdrawals && (
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '10px' 
                        }}>
                            {block.withdrawals.map((withdrawal, index) => (
                                <div key={index} style={{
                                    background: 'rgba(16, 185, 129, 0.04)',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    borderLeft: '3px solid #10b981'
                                }}>
                                    <div style={{ 
                                        fontFamily: 'Outfit, sans-serif', 
                                        fontWeight: '600', 
                                        color: '#10b981',
                                        marginBottom: '8px',
                                        fontSize: '0.9rem'
                                    }}>
                                        Withdrawal {index}
                                    </div>
                                    <div style={{ 
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: '8px',
                                        fontSize: '0.85rem'
                                    }}>
                                        <div>
                                            <span style={{ fontWeight: '600', color: '#6b7280' }}>Index: </span>
                                            <span style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-color, #1f2937)' }}>
                                                {Number(withdrawal.index).toLocaleString()}
                                            </span>
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: '600', color: '#6b7280' }}>Validator Index: </span>
                                            <span style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-color, #1f2937)' }}>
                                                {Number(withdrawal.validatorIndex).toLocaleString()}
                                            </span>
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: '600', color: '#6b7280' }}>Amount: </span>
                                            <span style={{ fontFamily: 'Outfit, sans-serif', color: '#059669', fontWeight: '600' }}>
                                                {(Number(withdrawal.amount) / 1e9).toFixed(9)} ETH
                                            </span>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <span style={{ fontWeight: '600', color: '#6b7280' }}>Address: </span>
                                            {chainId ? (
                                                <Link 
                                                    to={`/${chainId}/address/${withdrawal.address}`}
                                                    style={{ 
                                                        color: '#10b981', 
                                                        fontWeight: '600',
                                                        textDecoration: 'none',
                                                        fontFamily: 'Outfit, sans-serif'
                                                    }}
                                                >
                                                    {withdrawal.address}
                                                </Link>
                                            ) : (
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                    {withdrawal.address}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BlockDisplay;
