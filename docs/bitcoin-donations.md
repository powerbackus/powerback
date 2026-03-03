# Bitcoin Donations System

## Overview

POWERBACK accepts Bitcoin donations as an alternative funding method alongside tips and Patreon support. The system generates unique Bitcoin addresses for each donation request using a hierarchical deterministic (HD) wallet structure, ensuring privacy and proper accounting.

## Architecture

### Components

- **Backend Services**:
  - `services/btc/addressService.js` - Address generation service with counter-based indexing
  - `services/btc/deriveAddress.js` - HD wallet address derivation from extended public key (xpub)
  
- **API Endpoint**:
  - `routes/api/btc.js` - REST endpoint for address generation with rate limiting

- **Frontend**:
  - `client/src/pages/Funnel/TabContents/Confirmation/Confirmation.tsx` - Display component with QR code
  - `client/src/api/API.ts` - API client method

- **Email Integration**:
  - `controller/comms/emails/utils/celebrations.js` - Email template utilities for Bitcoin addresses
  - Used in: `Receipt.js`, `New.js`, `Update.js`

## Backend Implementation

### Address Service (`services/btc/addressService.js`)

The address service manages Bitcoin address generation using a counter-based indexing system:

```javascript
const getBTCAddress = async (_context = {}) => {
  const index = await getNextIndex();
  
  const address = deriveBech32Address({
    xpub: process.env.BTC_XPUB,
    index,
  });
  
  return address;
};
```

**Key Features**:
- Uses MongoDB `Counter` model to track the next index
- Counter ID: `'btc_address_index'`
- Zero-based indexing (returns `value - 1` after increment)
- Each request generates a unique address

### Derivation Service (`services/btc/deriveAddress.js`)

Derives bech32 (native SegWit, p2wpkh) addresses from an account-level extended public key:

**Derivation Path**:
- Account level: `m/84'/coin_type'/0'` (assumed to be the extended key)
- External chain: `0/index`
- Full path: `m/84'/coin_type'/0'/0/index`

**Network Support**:
- Mainnet: Uses `zpub` prefix (BIP84)
- Testnet: Uses `vpub` prefix (BIP84)
- Network determined by `BTC_NETWORK` environment variable
- Requires explicit BIP84 version bytes for `@scure/bip32` compatibility

**Address Format**:
- Bech32 encoding (native SegWit)
- Starts with `bc1` (mainnet) or `tb1` (testnet)
- Pay-to-Witness-Public-Key-Hash (p2wpkh)

**Error Handling**:
- Validates xpub presence
- Validates index is a non-negative integer
- Validates network matches xpub prefix
- Throws error if address derivation fails

### API Endpoint (`routes/api/btc.js`)

**Endpoint**: `POST /api/btc/address`

**Rate Limiting**:
- Window: 60 seconds
- Max requests: 10 per window
- Prevents abuse of address generation

**Response Format**:
```json
{
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
}
```

**Security**:
- No authentication required (addresses are public donation addresses)
- Rate limiting prevents excessive address generation
- Each address is unique and can be tracked independently

## Frontend Implementation

### Confirmation Component (`client/src/pages/Funnel/TabContents/Confirmation/Confirmation.tsx`)

The Confirmation component displays Bitcoin donation information after a celebration is completed. Content building blocks (WhatHappensNext, HelpAsk, TipMessage, etc.) live in `Confirmation/content/` with one subdirectory per component.

**State Management**:
```typescript
const [btcAddress, setBtcAddress] = useState<string>('');
const [showCopyNotification, setShowCopyNotification] = useState(false);
```

**Address Fetching**:
- Fetches address on component mount via `useEffect`
- Calls `API.getBTCAddress()` to retrieve address from backend
- Shows loading or error state via `BtcQrPlaceholder` (see below) while fetching

**QR Code Display**:
- Uses `QRCodeSVG` component from `qrcode.react` library (80x80, level 'M')
- Loading and error states use colocated `BtcQrPlaceholder` (`SupConfirmationport/BtcQrPlaceholder/`), which renders an 80x80 box with spinner or error icon; styles (`.btc-qr-placeholder`, `.btc-qr-placeholder--error`, `.btc-qr-placeholder--loading`) are in `Confirmation/style.css`

**Copy Functionality**:
- Clicking the address copies it to clipboard
- Shows success notification for 2 seconds
- Uses `navigator.clipboard.writeText()` API
- Handles copy errors gracefully

**Visual Design**:
- Bitcoin icon (`bi-currency-bitcoin`) displayed above QR code
- Address displayed below QR code in monospaced font
- Responsive layout with mobile considerations

## Email Integration

### Email Utilities (`controller/comms/emails/utils/celebrations.js`)

Bitcoin addresses are included in celebration-related emails:

**Functions**:
- `formatBTCAddress(btcAddress)` - Formats address with monospaced font styling, removes trailing periods
- `createSupportInfoBox(btcAddress, variant)` - Creates support section with Bitcoin address
  - Variants: `'new'`, `'receipt'`, `'update'`
- `createDonationAsk(btcAddress)` - Creates donation ask section for password-related emails

**Email Templates Using Bitcoin Addresses**:
- `Receipt.js` - Celebration receipt emails
- `New.js` - New celebration notification emails
- `Update.js` - Celebration update emails

**Formatting**:
- Addresses displayed in monospaced font (`Courier New`)
- Styled with `<code>` tag for proper formatting
- Trailing periods removed if present

## Environment Variables

### Required Variables

- **`BTC_XPUB`** - Extended public key (zpub for mainnet, vpub for testnet)
  - Must be account-level BIP84: `m/84'/coin_type'/0'`
  - Must use BIP84 format (zpub/vpub), not BIP44 (xpub/tpub)
  - Used to derive unique addresses for each request

- **`BTC_NETWORK`** - Network selection
  - Set to `'testnet'` for testnet addresses
  - Omit or set to any other value for mainnet

### Development Setup

The `scripts/devXpub.js` script can be used to generate a test extended public key:

```javascript
// Generates a random seed and derives account-level BIP84 extended key
// Path: m/84'/0'/0'
// Output: zpub (mainnet) or vpub (testnet) depending on BTC_NETWORK
```

## Security Considerations

### Address Privacy

- Each request generates a unique address
- Addresses are derived deterministically from the xpub
- No private keys are stored or transmitted
- Addresses can be publicly shared (they're donation addresses)

### Rate Limiting

- API endpoint limited to 10 requests per minute
- Prevents abuse of address generation
- Standard rate limit headers included in responses

### Network Validation

- System validates that extended key prefix matches network configuration
- Mainnet requires `zpub` prefix (BIP84)
- Testnet requires `vpub` prefix (BIP84)
- Prevents accidental use of testnet keys on mainnet and vice versa
- Throws clear error messages on mismatch

### Counter Management

- Counter stored in MongoDB with atomic increment operations
- Ensures unique index for each address
- Prevents address collision

## Usage Examples

### Backend: Generate Address

```javascript
const { getBTCAddress } = require('./services/btc/addressService');

// Generate a new Bitcoin address
const address = await getBTCAddress();
console.log(`Generated address: ${address}`);
```

### Frontend: Display Address with QR Code

```typescript
import { QRCodeSVG } from 'qrcode.react';
import API from '@API';

const [btcAddress, setBtcAddress] = useState<string>('');

useEffect(() => {
  API.getBTCAddress()
    .then((response) => {
      setBtcAddress(response.data.address);
    })
    .catch((error) => {
      console.error('Failed to fetch BTC address:', error);
    });
}, []);

// In JSX:
{btcAddress ? (
  <QRCodeSVG
    size={80}
    level='M'
    value={btcAddress}
  />
) : (
  <Spinner size='sm' />
)}
```

### Email: Include Bitcoin Address

```javascript
const { getBTCAddress } = require('../../services/btc/addressService');
const { createSupportInfoBox } = require('../utils/celebrations');

const BTC_ADDRESS = await getBTCAddress();
const supportBox = createSupportInfoBox(BTC_ADDRESS, 'receipt');
```

## Technical Details

### HD Wallet Structure

```
m/84'/coin_type'/0'/0/index
│  │   │          │ │ └─ Index (from counter)
│  │   │          │ └─── External chain (0)
│  │   │          └───── Account (0')
│  │   └──────────────── Coin type (0 = Bitcoin, 1 = Testnet)
│  └──────────────────── Purpose (84 = SegWit)
└──────────────────────── Master key
```

### Address Format

- **Type**: Pay-to-Witness-Public-Key-Hash (p2wpkh)
- **Encoding**: Bech32
- **Mainnet prefix**: `bc1`
- **Testnet prefix**: `tb1`
- **Benefits**: Lower transaction fees, better error detection

### Counter Management

- Counter document ID: `'btc_address_index'`
- Initial value: 0 (first address uses index 0)
- Atomic increment ensures thread safety
- Zero-based indexing (counter increments, then subtracts 1)

## Troubleshooting

### Common Issues

**"BTC_XPUB missing" Error**:
- Ensure `BTC_XPUB` environment variable is set
- Verify extended key is account-level BIP84 (m/84'/coin_type'/0')

**"BTC extended key network mismatch" Error**:
- Check `BTC_NETWORK` matches extended key prefix
- Mainnet requires `zpub` prefix (BIP84)
- Testnet requires `vpub` prefix (BIP84)
- If you have an old xpub/tpub, regenerate using `scripts/devXpub.js`

**"Version mismatch" Error**:
- Extended key must use BIP84 format (zpub/vpub)
- Old xpub/tpub keys (BIP44) are not compatible with BIP84 derivation
- Regenerate extended key using `scripts/devXpub.js` to get correct format

**Address Derivation Fails**:
- Verify extended key is valid and properly formatted (zpub/vpub)
- Check that index is a non-negative integer
- Ensure network configuration matches extended key prefix

**Rate Limit Exceeded**:
- Wait 60 seconds before next request
- Consider caching address on frontend if needed
- Maximum 10 requests per minute

## Related Documentation

- [API Documentation](./API.md) - API endpoint details
- [Payment Processing](./payment-processing.md) - Payment system overview
- [Environment Management](./environment-management.md) - Environment variable configuration
- [Development Guide](./development.md) - Development setup
