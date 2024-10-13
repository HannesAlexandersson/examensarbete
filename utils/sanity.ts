import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'x1d4c2wj', 
  dataset: 'production',          
  useCdn: true, 
  apiVersion: '2024-10-13',
  token: process.env.EXPO_SANITY_PROJECT_TOKEN,    
});

export default client;