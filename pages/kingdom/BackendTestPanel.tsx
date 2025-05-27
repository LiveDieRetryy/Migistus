 componentskingdomBackendTestPanel.tsx

import { useState } from react;
import { Button } from @componentsuibutton;

export default function BackendTestPanel() {
  const [loading, setLoading] = useStatestring  null(null);
  const [results, setResults] = useStateRecordstring, any({});

  const testEndpoint = async (endpoint string, method string = 'POST') = {
    setLoading(endpoint);
    try {
      const res = await fetch(endpoint, { method });
      const data = await res.json();
      setResults(prev = ({ ...prev, [endpoint] data }));
    } catch (error) {
      console.error(`Error testing ${endpoint}`, error);
    } finally {
      setLoading(null);
    }
  };

  const runFullTest = async () = {
    setLoading('all');
    
     Create 10 users
    for(let i = 0; i  10; i++) {
      await testEndpoint('apiusers', 'POST');
    }
    
     Add 5 products
    for(let i = 0; i  5; i++) {
      await testEndpoint('apiproducts', 'POST');
    }
    
     Create 3 refunds
    for(let i = 0; i  3; i++) {
      await testEndpoint('apirefunds', 'POST');
    }
    
     Cast 7 votes
    for(let i = 0; i  7; i++) {
      await testEndpoint('apivote', 'POST');
    }
    
     Get current stats
    await testEndpoint('apiusers', 'GET');
    await testEndpoint('apiproducts', 'GET');
    await testEndpoint('apirefunds', 'GET');
    await testEndpoint('apivoting-config', 'GET');
    
    setLoading(null);
  };

  return (
    div className=fixed bottom-4 right-4 bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-xl max-w-sm
      h3 className=text-sm font-bold text-[#FFD700] mb-3🧪 Backend Test Panelh3
      
      div className=space-y-2
        Button 
          size=sm 
          onClick={() = testEndpoint('apiusers', 'POST')}
          disabled={loading === 'apiusers'}
          className=w-full justify-start
        
          👤 Create User
        Button
        
        Button 
          size=sm 
          onClick={() = testEndpoint('apiproducts', 'POST')}
          disabled={loading === 'apiproducts'}
          className=w-full justify-start
        
          📦 Add Product
        Button
        
        Button 
          size=sm 
          onClick={() = testEndpoint('apirefunds', 'POST')}
          disabled={loading === 'apirefunds'}
          className=w-full justify-start
        
          💰 Create Refund
        Button
        
        Button 
          size=sm 
          onClick={() = testEndpoint('apivote', 'POST')}
          disabled={loading === 'apivote'}
          className=w-full justify-start
        
          🗳️ Cast Vote
        Button
        
        hr className=border-zinc-700 
        
        Button 
          size=sm 
          onClick={runFullTest}
          disabled={loading === 'all'}
          className=w-full bg-[#FFD700] text-black hoverbg-[#FFD700]80
        
          🚀 Run Full Test (10 users, 5 products, 3 refunds, 7 votes)
        Button
      div
      
      {Object.keys(results).length  0 && (
        div className=mt-4 text-xs
          h4 className=font-semibold text-white mb-2Latest Resultsh4
          pre className=bg-black50 p-2 rounded text-green-400 overflow-auto max-h-32
            {JSON.stringify(results, null, 2)}
          pre
        div
      )}
      
      {loading && (
        div className=mt-2 text-xs text-yellow-400
          {loading === 'all'  'Running full test...'  `Testing ${loading}...`}
        div
      )}
    div
  );
}