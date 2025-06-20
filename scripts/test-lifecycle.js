#!/usr/bin/env node

// Simple script to test product lifecycle processing
const fetch = require('node-fetch');

async function testLifecycleProcessing() {
  try {
    console.log('Testing product lifecycle processing...');
    
    // First, get the current status
    console.log('\n1. Getting current lifecycle status...');
    const statusResponse = await fetch('http://localhost:3000/api/product-lifecycle/process');
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('Current status:', JSON.stringify(statusData, null, 2));
    } else {
      console.log('Status check failed:', statusResponse.status);
    }

    // Then, trigger processing
    console.log('\n2. Triggering lifecycle processing...');
    const processResponse = await fetch('http://localhost:3000/api/product-lifecycle/process', {
      method: 'POST',
    });
    
    if (processResponse.ok) {
      const processData = await processResponse.json();
      console.log('Processing result:', JSON.stringify(processData, null, 2));
    } else {
      console.log('Processing failed:', processResponse.status);
      const errorText = await processResponse.text();
      console.log('Error:', errorText);
    }

    // Finally, get updated status
    console.log('\n3. Getting updated lifecycle status...');
    const updatedStatusResponse = await fetch('http://localhost:3000/api/product-lifecycle/process');
    if (updatedStatusResponse.ok) {
      const updatedStatusData = await updatedStatusResponse.json();
      console.log('Updated status:', JSON.stringify(updatedStatusData, null, 2));
    } else {
      console.log('Updated status check failed:', updatedStatusResponse.status);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

if (require.main === module) {
  testLifecycleProcessing();
}

module.exports = { testLifecycleProcessing };
