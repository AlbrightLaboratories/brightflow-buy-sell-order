# BrightFlow Mobile App - Technical Specification

## Overview

BrightFlow Mobile is a cross-platform mobile application that delivers AI-powered stock trading intelligence with an engaging, hypnotic user experience. The app features a unique animated splash screen, mock authentication, and a clean dashboard showing portfolio balance and top 3 daily stock picks.

## Technology Stack

### Recommended Framework
**React Native** (for both iOS and Android from single codebase)

Alternative: Flutter

### Core Dependencies
```json
{
  "react-native": "^0.73.0",
  "react-navigation": "^6.0.0",
  "react-native-reanimated": "^3.6.0",
  "react-native-gesture-handler": "^2.14.0",
  "lottie-react-native": "^6.5.0",
  "axios": "^1.6.0"
}
```

## Architecture

### App Structure
```
/src
  /screens
    - SplashScreen.tsx        # Animated splash with live trading viz
    - LoginScreen.tsx         # Mock authentication
    - DashboardScreen.tsx     # Balance + Top 3 picks
    - StockDetailScreen.tsx   # Individual stock deep dive
  /components
    - GoldenBulls.tsx         # Animated golden bulls
    - LiveBalance.tsx         # Incrementing balance animation
    - LiveTrades.tsx          # Real-time trade feed animation
    - StockPickCard.tsx       # Individual stock pick component
    - GlowingLogo.tsx         # Pulsing BrightFlow logo
  /navigation
    - AppNavigator.tsx        # Main navigation container
  /services
    - mockDataService.ts      # Simulated market data
    - stockPicksService.ts    # Top 3 picks logic
  /utils
    - animations.ts           # Reusable animation configs
    - constants.ts            # Colors, fonts, sizes
  /assets
    - logo.png
    - golden-bull.png
    - fonts/
```

## Screen Specifications

### 1. Splash Screen (Home Screen on Launch)

**Purpose**: Create an engaging, hypnotic experience that showcases market activity and encourages users to watch for extended periods.

**Components**:

1. **Background**: Dark gradient (navy to black)

2. **BrightFlow Logo** (Top Center)
   - Glowing pulse animation (1.5s cycle)
   - Opacity: 0.7 → 1.0 → 0.7
   - Soft golden glow around edges

3. **Balance Display** (Upper Third)
   - Large, prominent dollar amount
   - Starts at random value (e.g., $47,832.19)
   - Increments every 100-500ms by $1-50
   - Green color (#00FF88)
   - Font: Bold, 48pt
   - Format: "$XX,XXX.XX"
   - Smooth number animation (not jumpy)

4. **Live Trade Feed** (Middle Section)
   - Scrolling list of buy/sell orders
   - Updates every 500ms
   - Each trade shows:
     - Stock symbol (e.g., "AAPL")
     - Action (BUY/SELL)
     - Quantity (e.g., "150 shares")
     - Price (e.g., "$185.32")
   - BUY orders: Green background fade
   - SELL orders: Red background fade
   - Smooth scroll animation
   - 5-7 visible trades at once

5. **Golden Bulls Animation** (Lower Third)
   - 2-3 golden bull silhouettes
   - Running left to right across screen
   - Loop continuously
   - Speed: 3-5 seconds per crossing
   - Trail effect behind bulls (sparkles/particles)
   - Bulls scale slightly (breathing effect)

6. **Jackpot Effect** (Random Triggers)
   - Every 10-15 seconds
   - Burst of golden particles from center
   - Brief flash of light
   - Balance jumps by $500-1000
   - Sound effect (optional, if sound enabled)
   - Bulls speed up momentarily

**Animations**:
```typescript
// Balance increment
const balanceAnimation = {
  duration: 300,
  easing: 'easeOut',
  useNativeDriver: true
};

// Logo glow
const logoGlow = {
  duration: 1500,
  loop: true,
  easing: 'linear',
  useNativeDriver: true
};

// Bulls movement
const bullsAnimation = {
  duration: 4000,
  loop: true,
  easing: 'linear',
  useNativeDriver: true
};
```

**Interaction**:
- **Tap anywhere** → Navigate to LoginScreen
- **No timeout** → Users can watch indefinitely
- **Subtle hint** → Small "Tap to continue" text fades in after 5 seconds

**Performance**:
- Target: 60 FPS constant
- Optimize: Use `useNativeDriver: true` for all animations
- Memoize: Trade feed items to prevent re-renders
- Throttle: Balance updates to reduce CPU load

### 2. Login Screen

**Purpose**: Simple authentication gate (mock for v1.0)

**Layout**:
```
┌─────────────────────────┐
│   [BrightFlow Logo]     │
│                         │
│   Welcome Back          │
│                         │
│   [Email Input]         │
│   [Password Input]      │
│                         │
│   [Login Button]        │
│                         │
│   Don't have an account?│
│   [Sign Up Link]        │
└─────────────────────────┘
```

**Components**:
1. BrightFlow logo (smaller, static)
2. "Welcome Back" heading
3. Email input field
4. Password input field (masked)
5. Login button (golden gradient)
6. Sign up link (future functionality)

**Behavior**:
- Accept ANY email/password combination
- Show loading spinner for 500ms (simulate network)
- Navigate to DashboardScreen
- Store mock session (no real auth)

**Validation**:
- Email format check (basic regex)
- Password minimum 6 characters
- Show inline errors if invalid format

### 3. Dashboard Screen

**Purpose**: Show current portfolio balance and top 3 AI-selected stock picks

**Layout**:
```
┌─────────────────────────┐
│  [Profile] [Settings]   │
│                         │
│  Current Balance        │
│  $47,832.19            │
│  +$1,234.56 (2.6%)     │
│                         │
│  Today's Top Picks 🐂   │
│                         │
│  ┌─────────────────┐   │
│  │ 1. AAPL         │   │
│  │ Apple Inc.      │   │
│  │ $185.32 ↑2.3%   │   │
│  │ [AI Pick: BUY]  │   │
│  └─────────────────┘   │
│                         │
│  ┌─────────────────┐   │
│  │ 2. TSLA         │   │
│  │ Tesla Inc.      │   │
│  │ $242.15 ↑1.8%   │   │
│  │ [AI Pick: BUY]  │   │
│  └─────────────────┘   │
│                         │
│  ┌─────────────────┐   │
│  │ 3. NVDA         │   │
│  │ NVIDIA Corp.    │   │
│  │ $495.22 ↑3.1%   │   │
│  │ [AI Pick: BUY]  │   │
│  └─────────────────┘   │
│                         │
│  [View All Orders]      │
└─────────────────────────┘
```

**Components**:

1. **Header**
   - Profile icon (left)
   - Settings icon (right)
   - BrightFlow logo (center, small)

2. **Balance Card**
   - Large balance display
   - Daily P&L (profit/loss)
   - Percentage change
   - Green if positive, red if negative
   - Light background card

3. **Top 3 Picks Section**
   - "Today's Top Picks 🐂" heading
   - 3 stock pick cards (stacked vertically)

4. **Stock Pick Card** (Component)
   - Rank number (1, 2, 3)
   - Stock symbol (bold, large)
   - Company name (smaller, gray)
   - Current price
   - Change percentage with arrow (↑/↓)
   - "AI Pick: BUY" badge (golden)
   - Tap to view details

5. **View All Orders Button**
   - Links to live trading view
   - Outline button style

**Data** (Mock for v1.0):
```typescript
const mockTopPicks = [
  {
    rank: 1,
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 185.32,
    change: 2.3,
    direction: 'up',
    recommendation: 'BUY',
    confidence: 87
  },
  // ... 2 more
];

const mockBalance = {
  current: 47832.19,
  dailyChange: 1234.56,
  dailyChangePercent: 2.6
};
```

**Interactions**:
- Pull to refresh (update balance and picks)
- Tap stock card → Navigate to StockDetailScreen
- Tap "View All Orders" → Navigate to LiveTradingScreen

### 4. Stock Detail Screen

**Purpose**: Deep dive into individual stock recommendation

**Layout**:
```
┌─────────────────────────┐
│  [← Back]               │
│                         │
│  AAPL                   │
│  Apple Inc.             │
│  $185.32 ↑2.3%          │
│                         │
│  [Price Chart]          │
│                         │
│  AI Analysis            │
│  ━━━━━━━━━━━━━━━━━━━   │
│  Confidence: 87%        │
│  Signal: Strong Buy     │
│                         │
│  Why This Pick?         │
│  • Strong Q4 earnings   │
│  • iPhone 15 momentum   │
│  • Services growth      │
│  • Technical breakout   │
│                         │
│  Key Metrics            │
│  ━━━━━━━━━━━━━━━━━━━   │
│  P/E Ratio: 29.4        │
│  Market Cap: $2.87T     │
│  Volume: 52.3M          │
│  52-Week High: $198.23  │
│  52-Week Low: $124.17   │
│                         │
│  [Execute Trade Button] │
└─────────────────────────┘
```

**Components**:
1. Back button
2. Stock header (symbol, name, price)
3. Mini price chart (candlestick or line)
4. AI analysis section
5. "Why This Pick?" bullet points
6. Key metrics table
7. Execute trade button (future feature)

## Design System

### Color Palette
```typescript
const colors = {
  primary: '#FFD700',        // Golden
  primaryDark: '#B8860B',    // Dark golden
  background: '#0A0E27',     // Navy black
  backgroundLight: '#1A1F3A', // Lighter navy
  success: '#00FF88',        // Bright green
  danger: '#FF4458',         // Red
  text: '#FFFFFF',           // White
  textSecondary: '#A0A0A0',  // Gray
  cardBackground: '#1E2544', // Card background
  border: '#2A3052',         // Border color
};
```

### Typography
```typescript
const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5
  },
  h2: {
    fontSize: 24,
    fontWeight: '600'
  },
  h3: {
    fontSize: 18,
    fontWeight: '600'
  },
  body: {
    fontSize: 16,
    fontWeight: '400'
  },
  caption: {
    fontSize: 14,
    fontWeight: '400'
  },
  balance: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'monospace'
  }
};
```

### Spacing System
```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};
```

## Mock Data Service

### Purpose
Generate realistic market data for demonstration without backend

### Implementation
```typescript
// src/services/mockDataService.ts

class MockDataService {
  generateRandomTrade() {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META'];
    const actions = ['BUY', 'SELL'];

    return {
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      action: actions[Math.floor(Math.random() * 2)],
      quantity: Math.floor(Math.random() * 500) + 1,
      price: (Math.random() * 500 + 100).toFixed(2),
      timestamp: Date.now()
    };
  }

  getTop3Picks() {
    // Return consistent picks for the day
    // Could use date as seed for variety
    return [
      {
        rank: 1,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 185.32,
        change: 2.3,
        direction: 'up',
        recommendation: 'BUY',
        confidence: 87,
        reasons: [
          'Strong Q4 earnings beat',
          'iPhone 15 sales momentum',
          'Services segment growth',
          'Technical breakout pattern'
        ]
      },
      {
        rank: 2,
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: 242.15,
        change: 1.8,
        direction: 'up',
        recommendation: 'BUY',
        confidence: 82,
        reasons: [
          'Cybertruck production ramp',
          'Energy division growth',
          'China sales recovery',
          'EV market leadership'
        ]
      },
      {
        rank: 3,
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        price: 495.22,
        change: 3.1,
        direction: 'up',
        recommendation: 'BUY',
        confidence: 91,
        reasons: [
          'AI chip demand surge',
          'Data center revenue growth',
          'New GPU launches',
          'Strong institutional buying'
        ]
      }
    ];
  }

  getBalance() {
    return {
      current: 47832.19,
      dailyChange: 1234.56,
      dailyChangePercent: 2.6
    };
  }

  incrementBalance(currentBalance: number) {
    // Add random increment
    const increment = Math.random() * 50 + 1;
    return currentBalance + increment;
  }
}

export default new MockDataService();
```

## Animation Specifications

### Splash Screen Animations

#### 1. Logo Glow Animation
```typescript
const logoGlowAnimation = useAnimatedStyle(() => {
  return {
    opacity: withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    ),
    shadowOpacity: withRepeat(
      withTiming(0.8, { duration: 1500 }),
      -1,
      true
    )
  };
});
```

#### 2. Balance Increment Animation
```typescript
const balanceIncrement = (setValue: (val: number) => void, currentValue: number) => {
  const newValue = currentValue + (Math.random() * 50 + 1);
  setValue(
    withTiming(newValue, {
      duration: 300,
      easing: Easing.out(Easing.ease)
    })
  );
};
```

#### 3. Golden Bulls Animation
```typescript
const bullAnimation = useAnimatedStyle(() => {
  return {
    transform: [
      {
        translateX: withRepeat(
          withTiming(screenWidth, {
            duration: 4000,
            easing: Easing.linear
          }),
          -1,
          false
        )
      }
    ]
  };
});
```

#### 4. Trade Feed Animation
```typescript
const tradeFeedAnimation = useAnimatedStyle(() => {
  return {
    transform: [
      {
        translateY: withRepeat(
          withTiming(-tradeHeight, {
            duration: 500,
            easing: Easing.linear
          }),
          -1,
          false
        )
      }
    ]
  };
});
```

## Navigation Flow

```
SplashScreen (Entry Point)
    ↓ (tap anywhere)
LoginScreen
    ↓ (login)
DashboardScreen
    ↓ (tap stock pick)
StockDetailScreen
    ↓ (back button)
DashboardScreen
    ↓ (View All Orders)
LiveTradingScreen
```

## State Management

### Recommended: React Context + Hooks

```typescript
// src/context/AppContext.tsx

interface AppState {
  isAuthenticated: boolean;
  balance: number;
  topPicks: StockPick[];
  user: User | null;
}

interface AppContextType {
  state: AppState;
  login: (email: string, password: string) => void;
  logout: () => void;
  refreshPicks: () => void;
  updateBalance: (newBalance: number) => void;
}

export const AppProvider = ({ children }) => {
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    balance: 0,
    topPicks: [],
    user: null
  });

  const login = (email: string, password: string) => {
    // Mock authentication
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      user: { email },
      balance: mockDataService.getBalance().current,
      topPicks: mockDataService.getTop3Picks()
    }));
  };

  // ... other methods

  return (
    <AppContext.Provider value={{ state, login, logout, refreshPicks, updateBalance }}>
      {children}
    </AppContext.Provider>
  );
};
```

## Performance Optimization

### Key Optimizations

1. **Use Native Driver**: Enable for all animations
2. **Memoization**: Memo all heavy components
3. **Lazy Loading**: Load screens on demand
4. **Image Optimization**: Compress all assets
5. **FlatList**: Use for trade feed (virtualization)
6. **Throttle Updates**: Limit balance increments to 60 FPS
7. **Remove Listeners**: Clean up intervals on unmount

### Example
```typescript
// Throttle balance updates
const throttledIncrement = useCallback(
  throttle(() => {
    setBalance(prev => prev + randomIncrement());
  }, 100), // Max 10 updates/second
  []
);
```

## Testing Strategy

### Unit Tests
- Mock data service functions
- Balance increment calculations
- Stock pick sorting logic
- Animation utilities

### Integration Tests
- Navigation flows
- Authentication flow
- Data refresh flows

### E2E Tests (Detox)
```typescript
describe('BrightFlow App', () => {
  it('should show splash screen on launch', async () => {
    await expect(element(by.id('splash-screen'))).toBeVisible();
  });

  it('should navigate to login on tap', async () => {
    await element(by.id('splash-screen')).tap();
    await expect(element(by.id('login-screen'))).toBeVisible();
  });

  it('should login with any credentials', async () => {
    await element(by.id('email-input')).typeText('test@test.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await expect(element(by.id('dashboard-screen'))).toBeVisible();
  });
});
```

## Build & Deployment

### iOS
```bash
# Development
npx react-native run-ios

# Production build
cd ios && pod install
xcodebuild -workspace BrightFlow.xcworkspace -scheme BrightFlow -configuration Release
```

### Android
```bash
# Development
npx react-native run-android

# Production build
cd android && ./gradlew assembleRelease
```

### Environment Variables
```
API_BASE_URL=https://api.brightflow.com (future)
ENABLE_MOCK_DATA=true
APP_VERSION=1.0.0
```

## Future Enhancements (Post-v1.0)

1. **Real Authentication**
   - Integrate with BrightFlow backend
   - OAuth support
   - Biometric login

2. **Live Market Data**
   - WebSocket connection
   - Real-time stock prices
   - Actual trade execution

3. **Push Notifications**
   - Daily pick alerts
   - Price alerts
   - Portfolio updates

4. **Advanced Features**
   - Portfolio analysis
   - Trade history
   - Watchlists
   - Custom alerts

5. **Social Features**
   - Share picks
   - Leaderboards
   - Community insights

## Dependencies List

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "react-native-reanimated": "^3.6.0",
    "react-native-gesture-handler": "^2.14.0",
    "react-native-safe-area-context": "^4.8.0",
    "react-native-screens": "^3.29.0",
    "lottie-react-native": "^6.5.0",
    "axios": "^1.6.0",
    "@react-native-async-storage/async-storage": "^1.21.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.73.0",
    "typescript": "^5.3.0",
    "jest": "^29.7.0",
    "detox": "^20.14.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

## File Size Targets

- **iOS IPA**: < 50 MB
- **Android APK**: < 50 MB
- **Initial assets**: < 10 MB
- **Per-screen bundle**: < 500 KB

## Minimum Requirements

- **iOS**: 13.0+
- **Android**: API 21 (Android 5.0)+
- **RAM**: 2 GB minimum
- **Storage**: 100 MB free space
