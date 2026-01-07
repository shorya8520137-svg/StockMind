"use client";

import { useState, useEffect } from 'react';
import { testConnection } from '../utils/api';
import { PermissionsAPI } from '../services/permissionsApi';

export default function ConnectionTest() {
    const [connectionStatus, setConnectionStatus] = useState('testing');
    const [serverInfo, setServerInfo] = useState(null);
    const [error, setError] = useState(null);
    const [testResults, setTestResults] = useState([]);

    useEffect(() => {
        runConnectionTests();
    }, []);

    const runConnectionTests = async () => {
        const results = [];
        setConnectionStatus('testing');
        setError(null);

        // Test 1: Basic health check
        try {
            const healthResult = await testConnection();
            results.push({
                test: 'Health Check',
                status: healthResult.success ? 'success' : 'failed',
                message: healthResult.success ? 'Server is responding' : healthResult.error,
                data: healthResult.data
            });
            
            if (healthResult.success) {
                setServerInfo(healthResult.data);
            }
        } catch (error) {
            results.push({
                test: 'Health Check',
                status: 'failed',
                message: error.message
            });
        }

        // Test 2: Authentication endpoint
        try {
            // Try to make a request to auth endpoint (should fail without credentials but show endpoint exists)
            await PermissionsAPI.login({ email: 'test', password: 'test' });
        } catch (error) {
            if (error.message.includes('Invalid credentials') || error.message.includes('401')) {
                results.push({
                    test: 'Auth Endpoint',
                    status: 'success',
                    message: 'Authentication endpoint is accessible'
                });
            } else if (error.message.includes('404')) {
                results.push({
                    test: 'Auth Endpoint',
                    status: 'failed',
                    message: 'Authentication endpoint not found'
                });
            } else {
                results.push({
                    test: 'Auth Endpoint',
                    status: 'warning',
                    message: `Endpoint accessible but returned: ${error.message}`
                });
            }
        }

        // Test 3: CORS check
        try {
            const corsTest = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://api.hunyhuny.org/api'}/health`, {
                method: 'OPTIONS'
            });
            
            results.push({
                test: 'CORS Configuration',
                status: corsTest.ok ? 'success' : 'warning',
                message: corsTest.ok ? 'CORS is properly configured' : 'CORS might need configuration'
            });
        } catch (error) {
            results.push({
                test: 'CORS Configuration',
                status: 'failed',
                message: `CORS test failed: ${error.message}`
            });
        }

        setTestResults(results);
        
        const hasFailures = results.some(r => r.status === 'failed');
        const hasWarnings = results.some(r => r.status === 'warning');
        
        if (hasFailures) {
            setConnectionStatus('failed');
            setError('Some connection tests failed. Check your AWS server configuration.');
        } else if (hasWarnings) {
            setConnectionStatus('warning');
        } else {
            setConnectionStatus('success');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return '#10b981';
            case 'warning': return '#f59e0b';
            case 'failed': return '#ef4444';
            case 'testing': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'failed': return '❌';
            case 'testing': return '🔄';
            default: return '❓';
        }
    };

    return (
        <div style={{ 
            padding: '2rem', 
            maxWidth: '800px', 
            margin: '0 auto',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
            }}>
                <h2 style={{ 
                    margin: '0 0 1.5rem 0', 
                    color: '#1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    🔗 AWS Server Connection Test
                </h2>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    borderRadius: '8px',
                    background: connectionStatus === 'success' ? '#f0fdf4' : 
                               connectionStatus === 'warning' ? '#fffbeb' :
                               connectionStatus === 'failed' ? '#fef2f2' : '#f9fafb',
                    border: `1px solid ${getStatusColor(connectionStatus)}20`
                }}>
                    <span style={{ fontSize: '1.5rem' }}>
                        {getStatusIcon(connectionStatus)}
                    </span>
                    <div>
                        <div style={{ 
                            fontWeight: '600', 
                            color: getStatusColor(connectionStatus),
                            textTransform: 'capitalize'
                        }}>
                            {connectionStatus === 'testing' ? 'Testing Connection...' : 
                             connectionStatus === 'success' ? 'Connection Successful' :
                             connectionStatus === 'warning' ? 'Connection with Warnings' :
                             'Connection Failed'}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            API Endpoint: {process.env.NEXT_PUBLIC_API_BASE || 'https://api.hunyhuny.org/api'}
                        </div>
                    </div>
                </div>

                {serverInfo && (
                    <div style={{
                        background: '#f8fafc',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        border: '1px solid #e2e8f0'
                    }}>
                        <h3 style={{ margin: '0 0 0.75rem 0', color: '#374151', fontSize: '1rem' }}>
                            Server Information
                        </h3>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            <div><strong>Status:</strong> {serverInfo.status}</div>
                            <div><strong>Version:</strong> {serverInfo.version || 'Unknown'}</div>
                            <div><strong>Timestamp:</strong> {new Date(serverInfo.timestamp).toLocaleString()}</div>
                            {serverInfo.uptime && <div><strong>Uptime:</strong> {Math.floor(serverInfo.uptime)}s</div>}
                        </div>
                    </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1rem' }}>
                        Connection Test Results
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {testResults.map((result, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem',
                                background: '#f9fafb',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>
                                    {getStatusIcon(result.status)}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '500', color: '#374151' }}>
                                        {result.test}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                        {result.message}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={runConnectionTests}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#2563eb'}
                        onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                    >
                        🔄 Retest Connection
                    </button>
                    
                    <button
                        onClick={() => window.location.href = '/permissions'}
                        disabled={connectionStatus === 'failed'}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: connectionStatus === 'failed' ? '#d1d5db' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '500',
                            cursor: connectionStatus === 'failed' ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem'
                        }}
                        onMouseOver={(e) => {
                            if (connectionStatus !== 'failed') {
                                e.target.style.background = '#059669';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (connectionStatus !== 'failed') {
                                e.target.style.background = '#10b981';
                            }
                        }}
                    >
                        🚀 Go to Permissions
                    </button>
                </div>

                {error && (
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        color: '#dc2626'
                    }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}
            </div>
        </div>
    );
}