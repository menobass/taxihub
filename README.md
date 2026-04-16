# 🚕 TaxiHub - Hive Community Management Portal

A comprehensive Node.js/Express application for managing Hive blockchain communities, specifically designed for taxi driver hub administration. Built for Uber-on-Hive ecosystem.

## 🎯 Overview

TaxiHub enables taxi companies to manage their driver communities on the Hive blockchain. Certified drivers can be assigned roles, moderated, and tracked—all using the Hive blockchain as the single source of truth.

## ✨ Features

- **🔐 Hive Keychain Authentication** - Secure login using Hive Keychain
- **👥 Member Management** - View and manage community subscribers
- **🎭 Role Management** - Promote/demote users (member, mod, admin)
- **🛡️ Moderation Tools** - Mute/unmute users and manage content
- **📝 Post Management** - View, pin, and moderate community posts
- **📊 Analytics Dashboard** - Real-time community statistics
- **⚡ Real-time Operations** - Direct blockchain interactions via dhive

## 🏗️ Architecture

```
taxihub/
├── src/
│   ├── server.js              # Express server entry point
│   ├── controllers/           # Request handlers
│   │   └── community.controller.js
│   ├── routes/               # API routes
│   │   ├── auth.routes.js
│   │   └── community.routes.js
│   ├── services/             # Business logic
│   │   └── hive.service.js   # Hive blockchain operations
│   ├── middleware/           # Express middleware
│   │   └── auth.middleware.js
│   └── utils/               # Utility functions
│       ├── cache.utils.js
│       ├── hive.utils.js
│       └── response.utils.js
├── public/                  # Frontend assets
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── api.js          # API client
│       ├── auth.js         # Authentication logic
│       ├── dashboard.js    # Dashboard management
│       └── app.js          # Main application
├── HIVE_OPERATIONS.md      # Complete Hive operations reference
├── .env.example            # Environment variables template
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Hive account with posting authority
- Hive Keychain browser extension (for frontend auth)

### Installation

1. **Clone and navigate to project**
   ```bash
   cd /path/to/taxihub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` with your settings**
   ```env
   PORT=3000
   NODE_ENV=development
   
   # Your Hive community (e.g., hive-123456)
   HIVE_COMMUNITY=hive-123456
   
   # Admin account that will manage the community
   HIVE_ADMIN_ACCOUNT=youradmin
   
   # Posting key for the admin account (keep secret!)
   HIVE_POSTING_KEY=5JYourPrivatePostingKeyHere
   
   # JWT secret for TaxiHub local session management
   JWT_SECRET=your-super-secret-jwt-key-change-this
   # Optional: JWT secret expected by menosoft.xyz upstream
   MENOSOFT_JWT_SECRET=your-menosoft-upstream-jwt-secret
   JWT_EXPIRES_IN=24h
   
   # RPC endpoints (multiple for failover)
   HIVE_RPC_NODES=https://api.hive.blog,https://anyx.io,https://rpc.ausbit.dev
   
   # HiveTaxi External API (for community registry)
   COMMUNITIES_API_URL=https://menosoft.xyz/hivetaxi/api/communities
   REGISTER_API_URL=https://menosoft.xyz/api/communities/register
   HIVETAXI_API_KEY=your-hivetaxi-api-key-here
   ```

5. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Open the dashboard**
   
   Navigate to `http://localhost:3000` in your browser.

## 🔑 Authentication Setup

### Backend (Admin Operations)

The backend uses your admin account's posting key to perform community operations. This is stored securely in `.env`:

```env
HIVE_ADMIN_ACCOUNT=youradmin
HIVE_POSTING_KEY=5JYourPrivatePostingKeyHere
```

### Frontend (User Login)

Users log in using Hive Keychain:
1. Install [Hive Keychain](https://hive-keychain.com) browser extension
2. Click "Login with Keychain" on the portal
3. Sign the authentication message
4. Receive JWT token for session management

## 📖 API Endpoints

### Public Endpoints

- `GET /health` - Health check
- `GET /api/community` - Get community details
- `GET /api/posts` - Get community posts
- `GET /api/account/:username` - Get account info

### Protected Endpoints (Require Auth)

**Members**
- `GET /api/members` - List community members
- `GET /api/roles` - Get role assignments

**Role Management**
- `POST /api/role` - Update user role
  ```json
  { "account": "username", "role": "mod" }
  ```

**Moderation**
- `POST /api/mute` - Mute user
  ```json
  { "account": "username", "notes": "Reason" }
  ```
- `POST /api/unmute` - Unmute user
  ```json
  { "account": "username" }
  ```

**Content**
- `POST /api/pin` - Pin post
  ```json
  { "account": "author", "permlink": "post-slug", "notes": "Featured" }
  ```
- `POST /api/unpin` - Unpin post
  ```json
  { "account": "author", "permlink": "post-slug" }
  ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `HIVE_COMMUNITY` | Community ID | hive-123456 |
| `HIVE_ADMIN_ACCOUNT` | Admin username | - |
| `HIVE_POSTING_KEY` | Admin posting key | - |
| `JWT_SECRET` | JWT signing key for TaxiHub sessions | - |
| `MENOSOFT_JWT_SECRET` | JWT signing key for menosoft.xyz upstream calls (fallback: `JWT_SECRET`) | - |
| `JWT_EXPIRES_IN` | Token expiry | 24h |
| `HIVE_RPC_NODES` | RPC endpoints (comma-separated) | See .env.example |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | * |

### Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore` by default
2. **Use strong JWT secret** - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. **Rotate posting keys** - Change periodically for security
4. **Use HTTPS in production** - Configure reverse proxy (nginx/Apache)
5. **Enable rate limiting** - Already configured, adjust as needed

## 🎨 Frontend Features

### Dashboard Views

1. **Overview** - Community stats and metadata
2. **Members** - Searchable member list with role actions
3. **Roles** - Visual breakdown of admins, mods, members, muted
4. **Posts** - Community posts with sorting options
5. **Moderation** - Quick mute/unmute tools

### User Experience Highlights

- **Responsive Design** - Works on desktop, tablet, mobile
- **Real-time Updates** - Optimistic UI with blockchain confirmation
- **Search & Filter** - Find members quickly
- **Role Management** - One-click promote/demote
- **Clean UI** - Modern, professional design

## 📚 Hive Operations Reference

See [HIVE_OPERATIONS.md](./HIVE_OPERATIONS.md) for complete documentation of all Hive blockchain operations including:

- Community management
- Role assignments
- Moderation actions
- Post management
- Statistics retrieval
- Code examples and best practices

## 🛠️ Development

### Project Structure

- **Backend**: Express.js REST API
- **Frontend**: Vanilla JavaScript (easy to migrate to React/Vue later)
- **Database**: None required (blockchain is the source of truth)
- **Cache**: In-memory (can be upgraded to Redis)

### Running Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

Uses `nodemon` for auto-restart on file changes.

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use strong, unique `JWT_SECRET`
- [ ] Configure HTTPS with reverse proxy
- [ ] Set up process manager (PM2, systemd)
- [ ] Configure firewall rules
- [ ] Enable logging and monitoring
- [ ] Set up automated backups for `.env`
- [ ] Configure CORS for your domain only

### Using PM2

```bash
npm install -g pm2
pm2 start src/server.js --name taxihub
pm2 save
pm2 startup
```

### Using systemd

Create `/etc/systemd/system/taxihub.service`:

```ini
[Unit]
Description=TaxiHub Community Portal
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/taxihub
ExecStart=/usr/bin/node src/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable taxihub
sudo systemctl start taxihub
```

## 🔍 Troubleshooting

### Common Issues

**"Hive Keychain not found"**
- Install the browser extension from [hive-keychain.com](https://hive-keychain.com)

**"Missing required posting authority"**
- Verify your posting key is correct in `.env`
- Ensure the admin account has admin/mod rights in the community

**"Account not found"**
- Check that the Hive username exists
- Verify spelling (usernames are lowercase)

**"RPC connection error"**
- Check internet connection
- Try different RPC nodes in `HIVE_RPC_NODES`
- Some nodes may be temporarily down

### Logs

Enable detailed logging:
```bash
NODE_ENV=development npm start
```

Check server logs for errors and blockchain responses.

## 🤝 Contributing

This is a project for taxi hub management in the Uber-on-Hive ecosystem. Contributions welcome!

## 📄 License

ISC

## 🔗 Resources

- [Hive Blockchain](https://hive.io)
- [dhive Library](https://github.com/openhive-network/dhive)
- [Hive Keychain](https://hive-keychain.com)
- [Hive Developer Portal](https://developers.hive.io)
- [Bridge API Documentation](https://gitlab.syncad.com/hive/hivemind)

## 👤 Contact

For support with TaxiHub community management, contact your Hive community administrator.

---

**Built with ❤️ for the Hive Taxi Community**
