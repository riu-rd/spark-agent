# SPARK Frontend - AI-Powered Digital Banking Interface

## 🚀 Quick Setup

### Prerequisites
- Node.js 16+ and npm
- Configured `.env` file in root directory
- PostgreSQL database running
- Backend agents running (optional for full functionality)

### Installation & Running

1. **Install Dependencies**:
```bash
npm install
```

2. **Verify Environment**:
Ensure `.env` file exists in the root directory with proper database configuration:
```env
DB_NAME=your_database_name
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

3. **Run the Application**:

#### Option A: Run Frontend and Backend Separately
```bash
# Terminal 1 - Start Express backend server (Port 3001)
npm run server

# Terminal 2 - Start React development server (Port 5173)
npm run dev
```

#### Option B: Run Both Together
```bash
# Single terminal - Runs both concurrently
npm run dev:all
```

## 📁 Project Overview

SPARK Frontend is a modern React application built with Vite, providing an intuitive interface for AI-powered banking transaction monitoring and resolution. It seamlessly integrates with the SPARK multi-agent system to deliver real-time transaction intelligence.

### Technology Stack
- **Frontend Framework**: React 18.2
- **Build Tool**: Vite 4.3+
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Backend**: Express.js with PostgreSQL

## 🏗️ Application Structure

```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── BottomNavigation.js    # Mobile navigation bar
│   │   ├── ChatModal.js           # AI chat interface
│   │   ├── FloatingChatButton.js  # Chat launcher
│   │   ├── PaymentInfoCard.js     # Payment details display
│   │   ├── PrivacyNoticeModal.js  # Privacy information
│   │   ├── TransactionList.js     # Transaction history
│   │   └── VybeLogo.js            # Brand identity
│   │
│   ├── pages/                # Application pages
│   │   ├── Home.js               # Dashboard with balance
│   │   ├── AddMoney.js           # Fund transfer interface
│   │   ├── Transactions.js       # Transaction management
│   │   ├── Dashboard.js          # Admin dashboard
│   │   ├── PaymentDelayedScreen.js # Delay handling
│   │   └── NotFound.js           # 404 error page
│   │
│   ├── services/             # API and data services
│   │   ├── api.js                # Core API client
│   │   ├── agentApi.js           # Agent communication
│   │   └── dataRefreshService.js # Real-time updates
│   │
│   ├── utils/                # Utility functions
│   │   ├── transactionManager.js       # Transaction logic
│   │   └── databaseTransactionManager.js # DB operations
│   │
│   ├── styles/               # Global styles
│   │   └── main.css              # Tailwind imports
│   │
│   ├── App.js                # Main application component
│   └── index.js              # Application entry point
│
├── public/                   # Static assets
│   ├── index.html
│   └── vybe-logo.png
│
├── server.js                 # Express backend server
├── package.json              # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS config
└── postcss.config.js        # PostCSS configuration
```

## 🎨 Component Architecture

### Core Components

#### `BottomNavigation`
- Mobile-first navigation bar
- Route switching between main pages
- Active state indicators
- Responsive design

#### `TransactionList`
- Real-time transaction status display
- Color-coded status indicators
- Automatic refresh capability
- Sorting and filtering options

#### `PaymentInfoCard`
- Detailed payment information
- Transaction metadata display
- Status tracking
- Action buttons for retry/cancel

#### `ChatModal`
- AI-powered chat interface
- Direct connection to Host Agent
- Real-time response streaming
- Context-aware conversations

#### `FloatingChatButton`
- Persistent chat launcher
- Badge notifications
- Smooth animations
- Mobile-optimized positioning

### Page Components

#### `Home`
- Account balance display
- Quick action buttons
- Recent transaction summary
- Navigation to key features

#### `AddMoney`
- Multiple funding options
- Bank transfer interface
- E-wallet integration
- Payment method selection

#### `Transactions`
- Complete transaction history
- Status filtering
- Search functionality
- Export capabilities

#### `PaymentDelayedScreen`
- Intelligent delay handling
- Auto-retry initiation
- Status updates
- User notifications

## 🔌 Backend Integration

### Express Server (`server.js`)

The Express backend provides:
- **Database Connection**: PostgreSQL integration
- **API Endpoints**: RESTful services
- **CORS Support**: Cross-origin requests
- **Error Handling**: Comprehensive error management

Key Endpoints:
- `GET /api/transactions` - Fetch transaction list
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction status
- `GET /api/balance` - Get account balance
- `POST /api/retry` - Initiate transaction retry

### Agent Communication

The frontend communicates with SPARK agents through:
1. **Direct API calls** to Host Agent (Port 8000)
2. **Express proxy** for database operations
3. **Server-Sent Events** for real-time updates

## 🎯 Key Features

### Real-Time Transaction Monitoring
- Live status updates
- Automatic anomaly detection
- Visual status indicators
- Push notifications

### Intelligent Resolution
- Auto-retry for failed transactions
- Smart escalation to agents
- Comprehensive reporting
- User feedback collection

### Mobile-First Design
- Responsive layouts
- Touch-optimized controls
- Progressive Web App ready
- Offline capability

### Security Features
- Secure API communication
- Session management
- Data encryption
- Privacy controls

## 📜 Available Scripts

### Development
```bash
npm run dev          # Start Vite dev server
npm run server       # Start Express backend
npm run dev:all      # Start both concurrently
```

### Production
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Code Quality
```bash
npm run lint         # Run ESLint
```

## 🔧 Configuration

### Vite Configuration (`vite.config.js`)
```javascript
export default {
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
}
```

### Tailwind Configuration (`tailwind.config.js`)
- Custom color schemes
- Responsive breakpoints
- Animation utilities
- Component classes

## 🎨 Styling Guidelines

### Tailwind CSS Classes
- Use utility-first approach
- Prefer composition over custom CSS
- Maintain consistent spacing
- Follow responsive design patterns

### Color Scheme
- Primary: Blue shades for actions
- Success: Green for confirmations
- Warning: Yellow for attention
- Error: Red for failures
- Neutral: Gray for backgrounds

## 📱 Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Optimizations
- Touch-friendly buttons (min 44px)
- Simplified navigation
- Optimized images
- Reduced data usage

## 🔐 Security Considerations

1. **API Security**
   - Use HTTPS in production
   - Implement rate limiting
   - Validate all inputs
   - Sanitize user data

2. **Authentication**
   - Secure session management
   - Token-based authentication
   - Regular session refresh
   - Logout functionality

3. **Data Protection**
   - Encrypt sensitive data
   - Minimize data exposure
   - Implement proper CORS
   - Use environment variables

---

For more information about the complete SPARK system, refer to the main [documentation](../README.md).