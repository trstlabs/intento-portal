const fs = require('fs');
const path = require('path');

// Default configuration for known chains
const CHAIN_TEMPLATES = {
  INTO: {
    required: ['CHAIN_ID', 'NAME', 'SYMBOL', 'DENOM'],
    defaults: {
      REGISTRY_NAME: 'intentodevnet',
      DECIMALS: '6',
      DENOM_LOCAL: 'uinto',
      LOGO_URI: 'https://intento.zone/assets/images/icon.png',
      PREFIX: 'into'
    },
    mappings: {
      id: 'CHAIN_ID',
      name: 'NAME',
      registry_name: 'REGISTRY_NAME',
      symbol: 'SYMBOL',
      chain_id: 'CHAIN_ID',
      denom: 'DENOM',
      decimals: 'DECIMALS',
      denom_local: 'DENOM_LOCAL',
      logo_uri: 'LOGO_URI',
      prefix: 'PREFIX'
    }
  },
  // Generic IBC Chain Template
  IBC: {
    required: ['CHAIN_ID', 'NAME', 'SYMBOL', 'DENOM', 'CHANNEL', 'CHANNEL_TO_INTENTO'],
    defaults: {
      REGISTRY_NAME: '',
      DECIMALS: '6',
      DENOM_LOCAL: '',
      LOGO_URI: '',
      CONNECTION_ID: '',
      COUNTERPARTY_CONNECTION_ID: '',
      PREFIX: '',
      RPC: ''
    },
    mappings: {
      id: 'CHAIN_ID',
      name: 'NAME',
      registry_name: 'REGISTRY_NAME',
      symbol: 'SYMBOL',
      chain_id: 'CHAIN_ID',
      denom: 'DENOM',
      decimals: 'DECIMALS',
      channel: 'CHANNEL',
      channel_to_intento: 'CHANNEL_TO_INTENTO',
      denom_local: 'DENOM_LOCAL',
      logo_uri: 'LOGO_URI',
      connection_id: 'CONNECTION_ID',
      counterparty_connection_id: 'COUNTERPARTY_CONNECTION_ID',
      prefix: 'PREFIX',
      rpc: 'RPC'
    }
  },
  // Alias COSMOS to IBC for backward compatibility
  COSMOS: null,
  // Alias OSMOSIS to IBC for backward compatibility
  OSMOSIS: null
};

// Get environment variable with prefix
const getEnv = (prefix, key, defaultValue) => {
  const value = process.env[`${prefix}_${key}`];
  if (value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    return null; // Return null for missing optional values
  }
  return value;
};

// Parse boolean environment variables
const parseBoolean = (value) => {
  if (value === undefined || value === null) return null;
  return value.toLowerCase() === 'true';
};

// Parse number environment variables
const parseNumber = (value) => {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

// Parse JSON environment variables
const parseJson = (value) => {
  if (value === undefined || value === null) return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    console.warn(`Failed to parse JSON value: ${value}`);
    return null;
  }
};

// Get chain configuration from environment variables
const getChainConfig = (prefix, template) => {
  // Handle template aliases (e.g., COSMOS → IBC)
  if (template === null) {
    // Default to IBC template for aliases
    template = CHAIN_TEMPLATES.IBC;
  }
  
  const config = {};
  const errors = [];
  
  // Check required fields
  template.required.forEach(key => {
    const value = getEnv(prefix, key);
    if (value === null) {
      errors.push(`Missing required environment variable: ${prefix}_${key}`);
    }
  });
  
  if (errors.length > 0) {
    console.warn(`Skipping chain ${prefix} due to missing required configuration:`);
    errors.forEach(error => console.warn(`  - ${error}`));
    return null;
  }
  
  // Apply mappings with defaults
  Object.entries(template.mappings).forEach(([outputKey, inputKey]) => {
    // Get value from environment or defaults
    let value = getEnv(prefix, inputKey, template.defaults[inputKey]);
    
    // Skip null values (missing and no default)
    if (value === null) return;
    
    // Apply type conversion based on key patterns
    if (inputKey === 'ENABLED') {
      value = parseBoolean(value);
    } else if (['DECIMALS', 'PORT', 'REFRESH_RATE'].includes(inputKey)) {
      value = parseNumber(value);
    } else if (['FEATURES', 'TAGS'].includes(inputKey)) {
      value = parseJson(value) || value.split(',').map(s => s.trim());
    }
    
    // Only add if value is not null after parsing
    if (value !== null) {
      config[outputKey] = value;
    }
  });
  
  return config;
};

// Get custom chains from environment variables
const getCustomChains = () => {
  const customChains = [];
  const customPrefixes = new Set();
  
  // Find all custom chain prefixes (e.g., CUSTOM1_, CUSTOM2_)
  Object.keys(process.env).forEach(key => {
    const match = key.match(/^(CUSTOM\d+)_/);
    if (match) {
      customPrefixes.add(match[1]);
    }
  });
  
  // Process each custom chain
  customPrefixes.forEach(prefix => {
    const templateName = process.env[`${prefix}_TEMPLATE`] || 'COSMOS';
    const template = CHAIN_TEMPLATES[templateName] || CHAIN_TEMPLATES.COSMOS;
    
    const config = getChainConfig(prefix, template);
    if (config) {
      customChains.push(config);
    }
  });
  
  return customChains;
};

// Generate the configuration
const generateConfig = () => {
  const config = [];
  
  // Process predefined chains
  Object.entries(CHAIN_TEMPLATES).forEach(([name, template]) => {
    // Skip if chain is explicitly disabled
    if (parseBoolean(process.env[`DISABLE_${name}`]) === true) {
      console.log(`Skipping disabled chain: ${name}`);
      return;
    }
    
    const chainConfig = getChainConfig(name, template);
    if (chainConfig) {
      config.push(chainConfig);
    }
  });
  
  // Add custom chains
  const customChains = getCustomChains();
  config.push(...customChains);
  
  // Sort by chain_id for consistent output
  config.sort((a, b) => a.chain_id.localeCompare(b.chain_id));
  
  return config;
};

// Write configuration to file
const writeConfig = (config) => {
  const outputPath = path.join(__dirname, '../public/ibc_assets.json');
  
  try {
    fs.writeFileSync(outputPath, JSON.stringify(config, null, 2) + '\n');
    console.log(`✅ Successfully generated ${outputPath}`);
    console.log(`ℹ️  Found ${config.length} chain configurations`);
    return true;
  } catch (error) {
    console.error('❌ Error generating IBC assets configuration:', error);
    return false;
  }
};

// Main function
const main = () => {
  console.log('Generating IBC assets configuration...');
  const config = generateConfig();
  const success = writeConfig(config);
  process.exit(success ? 0 : 1);
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateConfig,
  writeConfig
};
