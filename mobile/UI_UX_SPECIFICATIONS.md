# BrightFlow Mobile App - UI/UX Design Specifications

## Design Philosophy

BrightFlow combines engaging visual storytelling with clear educational disclaimers. The app must be:
1. **Visually Captivating**: Engaging enough to hold attention
2. **Legally Compliant**: Clear disclaimers that protect us from liability
3. **Educational**: Focus on learning, not gambling/trading
4. **Accessible**: Easy to understand for all skill levels

---

## Screen-by-Screen Detailed Specifications

### Screen 1: Splash Screen (Launch Screen)

**Purpose**: Create an engaging, hypnotic demonstration while clearly communicating this is simulated data.

#### Layout Structure

```
┌─────────────────────────────────────┐
│          [BrightFlow Logo]          │  ← Top 15%
│           (Glowing Pulse)            │
│                                      │
│      DEMO MODE - SIMULATED DATA      │  ← Persistent banner
│    ───────────────────────────────   │
│                                      │
│         Portfolio Balance            │  ← Top 25%
│           $47,832.19                 │
│         +$1,234 today                │
│                                      │
│    ┌──────────────────────────┐    │
│    │ BUY  AAPL  150 @ $185.32 │    │
│    │ SELL TSLA  75  @ $242.15 │    │  ← Middle 40%
│    │ BUY  NVDA  200 @ $495.22 │    │     Live Trade Feed
│    │ SELL GOOGL 50  @ $142.08 │    │     (Scrolling)
│    │ BUY  MSFT  100 @ $378.91 │    │
│    └──────────────────────────┘    │
│                                      │
│    [Golden Bull Animation]  🐂       │  ← Bottom 25%
│  🐂  [Moving Left to Right]          │
│                                      │
│    ──────────────────────────────    │
│   Tap anywhere to continue           │  ← Bottom hint
│ ⚠️ Educational Demo Only - Not Real  │  ← Legal footer
└─────────────────────────────────────┘
```

#### Visual Elements

**1. BrightFlow Logo**
- **Position**: Top center, 60px from top
- **Size**: 120px wide × 40px tall
- **Animation**: Glow pulse (1.5s cycle)
  - Opacity: 0.7 → 1.0 → 0.7
  - Shadow: 0px → 8px golden glow → 0px
- **Color**: Gold (#FFD700) on navy background

**2. Demo Mode Banner**
- **Position**: Below logo, 20px margin
- **Size**: Full width, 32px height
- **Background**: Semi-transparent red (#FF4458 at 20% opacity)
- **Text**: "DEMO MODE - SIMULATED DATA"
- **Font**: 14px, Bold, White
- **Border**: 1px solid red
- **Purpose**: Legal protection - make it unmistakably clear this is not real

**3. Portfolio Balance**
- **Position**: Below banner, 40px margin
- **Layout**:
  ```
  Portfolio Balance (14px, gray)
  $47,832.19 (48px, bold, green if positive)
  +$1,234 today (16px, green, with ↑ arrow)
  ```
- **Animation**: Number increments every 300-800ms
  - Increment range: $5-$50
  - Smooth transition (not jumpy)
  - Occasional "jackpot" jump of $500-1000 every 15 seconds
- **Font**: Monospace for numbers (prevents layout shift)

**4. Live Trade Feed**
- **Position**: Middle section, 60% of screen height
- **Layout**: Scrolling list, 5-7 visible items
- **Each Trade Item**:
  ```
  ┌──────────────────────────┐
  │ [BUY/SELL] [SYMBOL] [QTY @ PRICE] │
  └──────────────────────────┘
  ```
  - BUY: Green background (#00FF88 at 10%), green text
  - SELL: Red background (#FF4458 at 10%), red text
  - Symbol: Bold, 16px
  - Quantity & price: Regular, 14px
- **Animation**:
  - New trade appears at bottom every 500ms
  - Smooth scroll upward (1s transition)
  - Fade in (opacity 0 → 1 over 300ms)
  - Fade out top item when it scrolls off
- **Data**: Random stocks from pool (AAPL, GOOGL, MSFT, TSLA, AMZN, NVDA, META)

**5. Golden Bulls Animation**
- **Position**: Bottom 20% of screen
- **Elements**: 2-3 golden bull silhouettes
- **Animation**:
  - Move from left (-100px) to right (screen width + 100px)
  - Duration: 4 seconds per crossing
  - Staggered start times (create wave effect)
  - Scale breathing: 1.0 → 1.1 → 1.0 (2s cycle)
  - Particle trail: Small golden sparkles behind each bull
- **Image**: SVG or PNG with transparency
- **Size**: 60px × 60px

**6. Jackpot Effect** (Random trigger every 10-15 seconds)
- **Trigger**: Random timer
- **Effect**:
  1. Flash of golden light from center (300ms)
  2. Burst of 20-30 golden particles radiating outward
  3. Balance jumps $500-1000 instantly
  4. Bulls speed up 2x for 2 seconds
  5. Screen shake (subtle, 2px vibration)
- **Sound**: Optional coin/success sound (if user has sound enabled)

**7. Legal Footer**
- **Position**: Bottom, 16px from bottom edge
- **Size**: Full width, 48px height
- **Text**:
  ```
  Tap anywhere to continue
  ⚠️ Educational Demo Only - Not Real Trading
  ```
- **Font**: 12px, semi-transparent white (70% opacity)
- **Background**: Slight gradient overlay for readability

#### Color Palette

```css
--background-primary: #0A0E27 (Navy black)
--background-secondary: #1A1F3A (Lighter navy)
--accent-gold: #FFD700 (Golden)
--accent-gold-dark: #B8860B (Dark gold)
--success-green: #00FF88 (Bright green)
--danger-red: #FF4458 (Red)
--text-primary: #FFFFFF (White)
--text-secondary: #A0A0A0 (Gray)
--warning-red: #FF4458 (Warning red)
```

#### Timing Specifications

- **Logo glow cycle**: 1500ms (1.5s)
- **Balance increment**: 300-800ms random intervals
- **Trade feed update**: 500ms
- **Trade scroll animation**: 1000ms
- **Bull crossing**: 4000ms
- **Jackpot trigger**: 10,000-15,000ms random
- **Tap hint fade in**: 5000ms after launch

#### User Interaction

- **Tap anywhere** → Dismiss splash, navigate to Login Screen
- **No automatic timeout** → User controls when to proceed
- **Tap hint** → Appears after 5 seconds to guide new users

#### Performance Requirements

- **Frame rate**: Minimum 60 FPS
- **Memory**: < 100 MB RAM usage
- **CPU**: < 20% on average device
- **Battery**: Minimal drain (use native animations)

#### Accessibility

- **VoiceOver/TalkBack**: "BrightFlow educational demo. Simulated trading demonstration. Tap anywhere to continue."
- **Reduced motion**: Disable animations if system preference set
- **High contrast**: Ensure text readable on all backgrounds

---

### Screen 2: Login Screen

**Purpose**: Simple authentication gate with clear educational disclaimer.

#### Layout Structure

```
┌─────────────────────────────────────┐
│                                      │
│                                      │  ← 10% top spacing
│          [BrightFlow Logo]           │
│           (Static, smaller)          │
│                                      │
│      Educational Demo Access         │  ← Heading
│                                      │
│  ──────────────────────────────────  │
│                                      │
│     ⚠️ EDUCATIONAL USE ONLY ⚠️        │  ← Disclaimer box
│   This app uses simulated data       │
│    Not for real trading              │
│  ──────────────────────────────────  │
│                                      │
│   ┌────────────────────────────┐   │
│   │ Email                       │   │  ← Email input
│   │ your@email.com              │   │
│   └────────────────────────────┘   │
│                                      │
│   ┌────────────────────────────┐   │
│   │ Password                    │   │  ← Password input
│   │ ••••••••                    │   │
│   └────────────────────────────┘   │
│                                      │
│   ┌────────────────────────────┐   │
│   │      Access Demo            │   │  ← Login button
│   └────────────────────────────┘   │
│                                      │
│   Note: Any credentials work for     │
│   demo purposes. No authentication.  │
│                                      │
│   By accessing you agree to:         │
│   • Terms of Service                 │
│   • Privacy Policy                   │
│   • Educational use disclaimer       │
│                                      │
└─────────────────────────────────────┘
```

#### Visual Elements

**1. Logo**
- **Position**: Top center, 80px from top
- **Size**: 100px wide × 35px tall (smaller than splash)
- **Animation**: None (static)
- **Color**: Gold (#FFD700)

**2. Heading**
- **Text**: "Educational Demo Access"
- **Font**: 24px, Semi-bold
- **Color**: White
- **Position**: Below logo, 40px margin

**3. Disclaimer Box**
- **Position**: Below heading, 24px margin
- **Size**: 90% width, auto height
- **Background**: Warning red with transparency (#FF4458 at 15%)
- **Border**: 1px solid red
- **Padding**: 16px
- **Content**:
  ```
  ⚠️ EDUCATIONAL USE ONLY ⚠️
  This app uses simulated data
  Not for real trading
  ```
- **Font**: 14px, Center-aligned, White
- **Purpose**: Legal protection before login

**4. Email Input**
- **Position**: Below disclaimer, 32px margin
- **Size**: 90% width, 48px height
- **Background**: Dark navy (#1E2544)
- **Border**: 1px solid gray (#2A3052), changes to gold on focus
- **Placeholder**: "your@email.com"
- **Font**: 16px, Regular
- **Keyboard**: Email keyboard type
- **Icon**: Envelope icon on left (optional)

**5. Password Input**
- **Position**: Below email, 16px margin
- **Size**: Same as email input
- **Type**: Secure text field (masked)
- **Placeholder**: "Enter any password (demo)"
- **Font**: 16px, Regular
- **Icon**: Lock icon on left (optional)
- **Toggle**: Eye icon to show/hide password (right side)

**6. Login Button**
- **Position**: Below password, 24px margin
- **Size**: 90% width, 56px height
- **Background**: Gradient (Gold #FFD700 → Dark Gold #B8860B)
- **Text**: "Access Demo"
- **Font**: 18px, Bold, Navy text (#0A0E27)
- **Border**: None
- **Border Radius**: 8px
- **Shadow**: 0px 4px 12px rgba(255, 215, 0, 0.3)
- **Hover/Press**: Scale to 0.98, increase shadow

**7. Demo Note**
- **Position**: Below button, 16px margin
- **Text**: "Note: Any credentials work for demo purposes. No authentication."
- **Font**: 12px, Italic
- **Color**: Gray (#A0A0A0)
- **Purpose**: Clarify mock authentication

**8. Legal Links**
- **Position**: Bottom, 24px margin
- **Text**:
  ```
  By accessing you agree to:
  • Terms of Service
  • Privacy Policy
  • Educational use disclaimer
  ```
- **Font**: 11px, Gray
- **Links**: Underlined, tappable
- **Action**: Open web view or modal with full legal documents

#### Behavior

**Form Validation**:
- Email: Basic format check (contains @)
- Password: Minimum 6 characters
- Show inline error if format invalid
- Error text: Red, 12px, below field

**Authentication**:
- Accept ANY email/password combination
- Show loading spinner for 500ms (simulate network call)
- On success: Navigate to Dashboard
- Store mock session (no real auth token)

**Error Handling**:
- If fields empty: "Please fill in all fields"
- If email invalid: "Please enter a valid email format"
- If password < 6 chars: "Password must be at least 6 characters"

---

### Screen 3: Dashboard Screen

**Purpose**: Display simulated portfolio balance and educational top 3 stock picks with clear disclaimers.

#### Layout Structure

```
┌─────────────────────────────────────┐
│  [Profile Icon]  BrightFlow  [⚙️]   │  ← Header (8%)
│                                      │
│  ⚠️ DEMO MODE - SIMULATED DATA ⚠️    │  ← Warning banner (5%)
│                                      │
│  ┌──────────────────────────────┐  │
│  │   Current Portfolio Balance   │  │  ← Balance card (20%)
│  │       $47,832.19              │  │
│  │   +$1,234.56 (+2.6%) today    │  │
│  │                                │  │
│  │   ⓘ Simulated for demo         │  │
│  └──────────────────────────────┘  │
│                                      │
│  Today's Educational Picks 🐂        │  ← Section header
│  (For learning purposes only)        │
│                                      │
│  ┌──────────────────────────────┐  │
│  │  1  AAPL                       │  │  ← Stock pick 1 (15%)
│  │     Apple Inc.                 │  │
│  │     $185.32  ↑ 2.3%            │  │
│  │     [Educational Sample]       │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │  2  TSLA                       │  │  ← Stock pick 2 (15%)
│  │     Tesla Inc.                 │  │
│  │     $242.15  ↑ 1.8%            │  │
│  │     [Educational Sample]       │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │  3  NVDA                       │  │  ← Stock pick 3 (15%)
│  │     NVIDIA Corporation         │  │
│  │     $495.22  ↑ 3.1%            │  │
│  │     [Educational Sample]       │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │  View Simulated Orders         │  │  ← Action button
│  └──────────────────────────────┘  │
│                                      │
│  ⚠️ Not investment advice. Consult   │  ← Footer disclaimer
│  licensed professionals before       │
│  making investment decisions.        │
└─────────────────────────────────────┘
```

#### Visual Elements

**1. Header**
- **Height**: 64px
- **Background**: Slightly lighter navy (#1A1F3A)
- **Layout**: 3-column (left icon | center logo | right icon)
- **Left**: Profile icon (32px circle, user initials or avatar)
- **Center**: "BrightFlow" logo text (16px, gold)
- **Right**: Settings gear icon (24px)
- **Shadow**: 0px 2px 8px rgba(0, 0, 0, 0.3)

**2. Demo Mode Banner**
- **Position**: Below header, full width
- **Height**: 40px
- **Background**: Warning red with transparency (#FF4458 at 20%)
- **Text**: "⚠️ DEMO MODE - SIMULATED DATA ⚠️"
- **Font**: 14px, Bold, White
- **Border Bottom**: 1px solid red
- **Purpose**: Constant reminder this is not real

**3. Balance Card**
- **Position**: 16px below banner
- **Size**: 90% width, auto height (min 120px)
- **Background**: Card background (#1E2544)
- **Border Radius**: 12px
- **Padding**: 20px
- **Shadow**: 0px 4px 12px rgba(0, 0, 0, 0.2)
- **Layout**:
  ```
  Current Portfolio Balance (14px, gray)

  $47,832.19 (36px, bold, green)
  +$1,234.56 (+2.6%) today (16px, green with ↑)

  ──────────────────
  ⓘ Simulated for demo purposes (12px, gray, italic)
  ```
- **Update**: Refresh on pull-down gesture

**4. Section Header**
- **Text**: "Today's Educational Picks 🐂"
- **Subtext**: "(For learning purposes only)"
- **Font**: 20px heading, 12px subtext
- **Color**: White heading, gray subtext
- **Position**: 24px below balance card

**5. Stock Pick Card** (3 instances)
- **Position**: Stacked vertically, 12px between each
- **Size**: 90% width, 96px height
- **Background**: Card background (#1E2544)
- **Border Radius**: 8px
- **Padding**: 16px
- **Shadow**: 0px 2px 6px rgba(0, 0, 0, 0.15)
- **Layout**:
  ```
  [Rank #]  [Symbol]           [Price]
            [Company Name]      [Change %]
            [Educational Sample Badge]
  ```
- **Rank**: Large circle (32px) with number, gold background
- **Symbol**: 20px, Bold, White
- **Company**: 14px, Regular, Gray
- **Price**: 18px, Bold, White
- **Change**: 14px with arrow, Green if positive, Red if negative
- **Badge**: Small pill-shaped badge, "Educational Sample", gray background

**6. Educational Sample Badge**
- **Size**: Auto width, 24px height
- **Background**: Gray with transparency (#A0A0A0 at 20%)
- **Text**: "Educational Sample"
- **Font**: 10px, Uppercase
- **Border**: 1px solid gray
- **Border Radius**: 12px
- **Purpose**: Remind users this is not a real recommendation

**7. View Orders Button**
- **Position**: 24px below last stock pick
- **Size**: 90% width, 48px height
- **Background**: Transparent
- **Border**: 2px solid gold
- **Text**: "View Simulated Orders"
- **Font**: 16px, Medium, Gold
- **Border Radius**: 8px
- **Press Effect**: Fill with gold, text becomes navy

**8. Footer Disclaimer**
- **Position**: Bottom, 16px margin
- **Text**:
  ```
  ⚠️ Not investment advice. Consult
  licensed professionals before
  making investment decisions.
  ```
- **Font**: 11px, Center-aligned, Gray
- **Background**: Slight dark overlay
- **Purpose**: Legal protection on every screen

#### Interactions

**Pull to Refresh**:
- Pull down gesture → Show loading spinner
- Simulate network call (500ms)
- Update balance and stock picks with new random data
- Show success animation

**Tap Stock Card**:
- Navigate to Stock Detail Screen
- Pass stock data as parameter
- Smooth transition animation (slide left)

**Tap View Orders**:
- Navigate to Live Trading View
- Show simulated order flow

**Tap Profile Icon**:
- Open profile/account screen
- Show user settings, logout option

**Tap Settings Icon**:
- Open settings screen
- Options: Notifications, Data preferences, Legal documents, Logout

---

### Screen 4: Stock Detail Screen

**Purpose**: Deep dive into educational stock analysis with clear disclaimers.

#### Layout Structure

```
┌─────────────────────────────────────┐
│  [← Back]         AAPL          [⋮]  │  ← Header (8%)
│                                      │
│  ⚠️ EDUCATIONAL DEMO - NOT ADVICE ⚠️ │  ← Warning (5%)
│                                      │
│  AAPL                                │  ← Stock header (12%)
│  Apple Inc.                          │
│  $185.32  ↑ $4.12 (2.3%)             │
│                                      │
│  ┌──────────────────────────────┐  │
│  │    [Price Chart Line Graph]   │  │  ← Chart (20%)
│  │                                │  │
│  └──────────────────────────────┘  │
│  1D  1W  1M  3M  1Y  All             │
│                                      │
│  AI Educational Analysis             │  ← Section (30%)
│  ─────────────────────────────────   │
│  Confidence: 87% (Sample)            │
│  Signal: Educational Buy Sample      │
│                                      │
│  Why This Educational Pick?          │
│  • Strong Q4 earnings beat           │
│  • iPhone 15 sales momentum          │
│  • Services segment growth           │
│  • Technical breakout pattern        │
│                                      │
│  ⓘ AI analysis is for educational    │
│    purposes. Not investment advice.  │
│                                      │
│  Key Metrics (Sample Data)           │  ← Metrics (20%)
│  ─────────────────────────────────   │
│  P/E Ratio:      29.4                │
│  Market Cap:     $2.87T              │
│  Volume:         52.3M               │
│  52-Wk High:     $198.23             │
│  52-Wk Low:      $124.17             │
│                                      │
│  ┌──────────────────────────────┐  │
│  │  Learn More (Educational)     │  │  ← Action button
│  └──────────────────────────────┘  │
│                                      │
│  ⚠️ Disclaimer: This analysis is      │  ← Footer (5%)
│  educational only. Not a             │
│  recommendation to buy or sell.      │
└─────────────────────────────────────┘
```

#### Visual Elements

**1. Navigation Header**
- **Height**: 56px
- **Background**: Transparent or dark navy
- **Left**: Back arrow (24px icon)
- **Center**: Stock symbol "AAPL" (18px, Bold)
- **Right**: More options menu (⋮ icon)

**2. Warning Banner**
- **Same as Dashboard**: Red warning banner
- **Text**: "⚠️ EDUCATIONAL DEMO - NOT ADVICE ⚠️"
- **Height**: 36px

**3. Stock Header**
- **Symbol**: 32px, Bold, White
- **Company**: 16px, Regular, Gray
- **Price**: 28px, Bold, Green/Red based on change
- **Change**: 16px with arrow icon
- **Spacing**: 8px between elements

**4. Price Chart**
- **Type**: Line chart (candlestick optional)
- **Height**: 200px
- **Background**: Slightly lighter than card background
- **Line Color**: Gold (#FFD700)
- **Grid**: Subtle gray lines
- **Data**: Mock historical data
- **Interactive**: Pan/zoom disabled (static for demo)
- **Library**: Use lightweight chart library (e.g., react-native-svg-charts)

**5. Time Period Selector**
- **Options**: 1D, 1W, 1M, 3M, 1Y, All
- **Layout**: Horizontal pills
- **Selected**: Gold background, navy text
- **Unselected**: Transparent, gray text
- **Size**: Each pill 40px wide, 28px tall
- **Action**: Change chart data (mock data changes)

**6. AI Analysis Section**
- **Card**: Same styling as other cards
- **Confidence**: Progress bar (87% filled, gold color)
- **Signal**: Pill badge with "Educational Buy Sample"
- **Why Section**:
  - Bullet list (4 reasons)
  - 14px font, gray color
  - Icon bullet points (✓ checkmarks)
- **Disclaimer**: Small italic text with info icon

**7. Key Metrics Section**
- **Card**: Same styling
- **Layout**: 2-column grid
  ```
  Label (left, gray)    Value (right, white, bold)
  ```
- **Spacing**: 12px between rows
- **Font**: 14px labels, 16px values
- **Note**: "(Sample Data)" in section header

**8. Action Button**
- **Text**: "Learn More (Educational)"
- **Style**: Outline button (gold border)
- **Size**: 90% width, 48px height
- **Action**: Link to educational resources or FAQ

**9. Footer Disclaimer**
- **Same as Dashboard footer**
- **Always visible**

---

## Typography System

### Font Family
- **Primary**: San Francisco (iOS), Roboto (Android)
- **Monospace**: SF Mono (iOS), Roboto Mono (Android) for numbers

### Font Scales

```
Heading 1: 32px, Bold, -0.5px letter-spacing
Heading 2: 24px, Semi-bold, -0.3px letter-spacing
Heading 3: 20px, Semi-bold
Heading 4: 18px, Medium
Body Large: 16px, Regular
Body: 14px, Regular
Caption: 12px, Regular
Small: 11px, Regular
Tiny: 10px, Regular, Uppercase

Balance Display: 36-48px, Bold, Monospace
Price Display: 28px, Bold, Monospace
```

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semi-bold**: 600
- **Bold**: 700

---

## Color System (Complete Palette)

### Primary Colors
```
Gold:           #FFD700
Gold Dark:      #B8860B
Gold Light:     #FFE55C
```

### Background Colors
```
Navy Black:     #0A0E27
Navy:           #1A1F3A
Card BG:        #1E2544
Border:         #2A3052
```

### Status Colors
```
Success:        #00FF88
Success Dark:   #00CC6A
Danger:         #FF4458
Danger Dark:    #CC3546
Warning:        #FFA726
Info:           #42A5F5
```

### Text Colors
```
Primary:        #FFFFFF
Secondary:      #A0A0A0
Tertiary:       #6B7280
Disabled:       #4B5563
```

### Semantic Colors
```
Buy Green:      #00FF88
Sell Red:       #FF4458
Demo Warning:   #FF4458
Link Blue:      #3B82F6
```

---

## Spacing System

```
4px:   xs    (Tight spacing, icons)
8px:   sm    (Small spacing, inline elements)
12px:  md-   (Between list items)
16px:  md    (Card padding, margins)
20px:  md+   (Card internal spacing)
24px:  lg    (Section spacing)
32px:  xl    (Large section breaks)
48px:  2xl   (Screen section dividers)
64px:  3xl   (Major sections)
```

---

## Component Library

### Card Component
```
Background: #1E2544
Border Radius: 12px
Padding: 16px
Shadow: 0px 4px 12px rgba(0, 0, 0, 0.2)
```

### Button Styles

**Primary Button** (Gold)
```
Background: Linear gradient #FFD700 → #B8860B
Text Color: #0A0E27
Font: 16-18px, Bold
Height: 48-56px
Border Radius: 8px
Shadow: 0px 4px 12px rgba(255, 215, 0, 0.3)
Press: Scale 0.98, increase shadow
```

**Secondary Button** (Outline)
```
Background: Transparent
Border: 2px solid #FFD700
Text Color: #FFD700
Font: 16px, Medium
Height: 48px
Border Radius: 8px
Press: Fill with gold, text becomes navy
```

**Tertiary Button** (Text only)
```
Background: Transparent
Text Color: #3B82F6 (blue link)
Font: 14px, Medium
Underline on press
```

### Input Field
```
Background: #1E2544
Border: 1px solid #2A3052
Height: 48px
Border Radius: 8px
Padding: 12px 16px
Font: 16px
Placeholder Color: #6B7280
Focus Border: #FFD700
Error Border: #FF4458
```

### Badge/Pill
```
Background: Color at 20% opacity
Border: 1px solid same color
Height: 24px
Padding: 4px 12px
Font: 10-12px, Uppercase, Bold
Border Radius: 12px (fully rounded)
```

---

## Disclaimer Placements (Legal Compliance)

### Required on Every Screen

**1. Persistent Banner** (Top of screen)
```
Text: "⚠️ DEMO MODE - SIMULATED DATA ⚠️"
Position: Below header, full width
Color: Red background with transparency
```

**2. Footer Disclaimer** (Bottom of screen)
```
Text: "⚠️ Not investment advice. Consult licensed
professionals before investing."
Position: Bottom, 16px margin
Color: Gray, small font (11px)
```

### Additional Context-Specific Disclaimers

**Stock Picks**:
- Each stock card: "Educational Sample" badge
- Section header: "(For learning purposes only)"

**AI Analysis**:
- "AI analysis is for educational purposes only"
- "Not investment advice"

**Balance/Portfolio**:
- "ⓘ Simulated for demo purposes"

---

## Animation Guidelines

### Timing Functions
```javascript
Ease Out:    cubic-bezier(0.25, 0.1, 0.25, 1)
Ease In Out: cubic-bezier(0.42, 0, 0.58, 1)
Spring:      stiffness: 300, damping: 30
```

### Animation Durations
```
Fast:    150-200ms  (Button presses, small UI changes)
Medium:  300-400ms  (Transitions, fades)
Slow:    500-800ms  (Screen transitions)
```

### Allowed Animations
- Opacity changes
- Scale transforms (0.95-1.05 range)
- Translate (slides, scrolls)
- Color transitions
- Rotation (limited, icons only)

### Prohibited Animations
- Excessive rotations
- Zoom effects that obscure disclaimers
- Flashing/strobing effects
- Animations that hide legal text

---

## Accessibility Requirements

### Text Contrast
- Minimum 4.5:1 for body text
- Minimum 3:1 for large text (>= 18px)
- Test all colors with contrast checker

### Touch Targets
- Minimum 44px × 44px (iOS)
- Minimum 48dp × 48dp (Android)
- 8px spacing between tappable elements

### Screen Reader Support
- All images: alt text
- All buttons: descriptive labels
- Forms: proper labels and hints
- Headings: semantic hierarchy

### Motion Sensitivity
- Respect "Reduce Motion" system setting
- Disable complex animations when enabled
- Provide static alternatives

### Font Scaling
- Support Dynamic Type (iOS)
- Support Font Scaling (Android)
- Test at 200% scale
- Ensure layouts don't break

---

## Responsive Design

### Breakpoints

**Phone Sizes**:
- Small: < 375px width (iPhone SE)
- Medium: 375px - 414px (iPhone 13, Pixel)
- Large: > 414px (iPhone Pro Max, Plus models)

**Tablet Sizes** (if supporting):
- Small Tablet: 768px (iPad Mini)
- Large Tablet: 1024px (iPad Pro)

### Adaptive Layouts

**Small Screens**:
- Reduce font sizes by 10%
- Tighter spacing (use spacing system -1 step)
- Single column layouts only
- Smaller cards

**Large Screens**:
- Optional: 2-column layout for stock picks
- Larger charts
- More spacing (use spacing system +1 step)

---

## Dark Mode (Default)

BrightFlow uses dark mode by default. If implementing light mode (future):

**Light Mode Palette**:
```
Background:     #F5F5F7
Card BG:        #FFFFFF
Text Primary:   #1D1D1F
Text Secondary: #6E6E73
Gold:           #B8860B (darker for contrast)
```

Currently: **Dark mode only** for v1.0

---

## Edge Cases & Error States

### No Internet Connection
- Show error banner: "No internet connection. Displaying cached data."
- Disable refresh actions
- Show reconnecting indicator

### Data Load Failures
- Show error message: "Unable to load data. Please try again."
- Provide retry button
- Log error for monitoring

### Empty States
- If no stock picks: Show placeholder with message
- If no balance history: Show demo message
- Never show completely blank screens

### Loading States
- Skeleton screens for data loading
- Shimmer effect on placeholders
- Spinner for actions (login, refresh)

---

## Performance Targets

### Metrics
- **Time to Interactive**: < 2 seconds
- **Frame Rate**: 60 FPS minimum
- **Memory Usage**: < 150 MB
- **App Size**: < 50 MB
- **Network Usage**: < 1 MB per session (mock data = minimal)

### Optimization Techniques
- Lazy load images
- Virtualize long lists
- Memoize expensive components
- Use native driver for animations
- Compress images (WebP format)
- Code splitting

---

## Testing Checklist

### Visual Testing
- [ ] All screens match designs on multiple devices
- [ ] Colors are consistent across app
- [ ] Spacing follows system
- [ ] Typography is correct
- [ ] Animations are smooth

### Functional Testing
- [ ] Navigation works correctly
- [ ] All buttons trigger correct actions
- [ ] Forms validate properly
- [ ] Mock login works
- [ ] Pull to refresh works
- [ ] Data updates correctly

### Legal/Compliance Testing
- [ ] All disclaimers are visible
- [ ] Warning banners appear on every screen
- [ ] Terms/Privacy links work
- [ ] Educational language is used (not investment advice)
- [ ] "Simulated/Demo" clearly marked

### Accessibility Testing
- [ ] VoiceOver/TalkBack reads all content
- [ ] Color contrast passes WCAG AA
- [ ] Touch targets are large enough
- [ ] Works with reduced motion
- [ ] Font scaling works correctly

### Performance Testing
- [ ] App loads in < 2 seconds
- [ ] Animations run at 60 FPS
- [ ] Memory usage is acceptable
- [ ] No memory leaks
- [ ] Battery usage is minimal

---

## Design File Deliverables

### Required Assets

**Icons** (SVG or PNG @1x, @2x, @3x):
- App icon (1024×1024)
- Golden bull (60×60)
- All UI icons (24×24, 32×32)

**Logos**:
- BrightFlow logo (horizontal, vertical)
- Logo with tagline
- Monochrome version

**Images**:
- Placeholder user avatar
- Empty state illustrations
- Error state illustrations

**Animations** (Lottie JSON or video):
- Bull running animation
- Particle burst effect
- Loading spinner

---

This comprehensive UI/UX specification ensures BrightFlow is engaging, legally compliant, and clearly educational. All designs prioritize user safety through prominent disclaimers while maintaining an attractive, modern interface.
