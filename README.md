# CBB Bikes Website

A full multi-page website for CBB Bikes, Durango CO — with a manager dashboard, MySQL backend, and Netlify hosting.

---

## 📁 File Structure

```
cbb-bikes/
├── index.html              # Homepage
├── bikes.html              # Product catalog
├── services.html           # Services page
├── events.html             # Events & registration
├── about.html              # About us
├── contact.html            # Contact form
├── manager-login.html      # Manager login
├── manager-dashboard.html  # Manager reports dashboard
│
├── css/
│   ├── global.css          # Design system, nav, footer, shared
│   ├── home.css            # Homepage styles
│   ├── bikes.css           # Catalog styles
│   ├── services.css        # Services + events + about + contact styles
│   ├── manager.css         # Login page styles
│   └── dashboard.css       # Dashboard styles
│
├── js/
│   ├── nav.js              # Shared navigation
│   ├── home.js             # Counter animation, events preview
│   ├── bikes.js            # Catalog, filters, product modal
│   ├── events.js           # Event listing, registration modal
│   ├── contact.js          # Contact form submission
│   ├── manager-login.js    # Login with API + demo fallback
│   └── dashboard.js        # All charts and report data
│
├── netlify/
│   └── functions/
│       ├── events.js           # GET /api/events
│       ├── register-event.js   # POST /api/register-event
│       ├── contact.js          # POST /api/contact
│       ├── products.js         # GET /api/products
│       ├── manager-login.js    # POST /api/manager/login
│       └── manager-reports.js  # GET /api/manager/* (all reports)
│
├── database/
│   └── schema.sql          # Full MySQL schema + sample data
│
├── netlify.toml            # Netlify config & redirects
├── package.json            # Node dependencies
└── .env.example            # Environment variables template
```

---

## 🚀 Deployment to Netlify

### Step 1 — Set up MySQL

Use any MySQL 8.0+ host. Recommended options:
- **PlanetScale** (free tier, serverless-friendly)
- **AWS RDS MySQL**
- **DigitalOcean Managed Database**
- **Railway.app**

```bash
# Import the schema
mysql -h YOUR_HOST -u YOUR_USER -p cbb_bikes < database/schema.sql
```

### Step 2 — Deploy to Netlify

**Option A: GitHub (recommended)**
1. Push this folder to a GitHub repository
2. Go to [netlify.com](https://netlify.com) → New site from Git
3. Select your repo, set publish directory to `.`

**Option B: Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Step 3 — Set Environment Variables

In Netlify dashboard → Site settings → Environment variables:

| Variable | Value |
|----------|-------|
| `DB_HOST` | Your MySQL host |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | `cbb_bikes` |
| `SALT` | Any random string |
| `JWT_SECRET` | Any random string |
| `SITE_URL` | Your Netlify URL |

### Step 4 — Manager Login

Demo credentials (work even without database):
- Username: `manager`
- Password: `cbb2025`

To create real manager accounts, insert into `Manager_Auth` table:
```sql
INSERT INTO Manager_Auth (EID, Username, Password_Hash, Role)
VALUES (1, 'your_username', SHA2(CONCAT('your_password', 'your_salt'), 256), 'Manager');
```

---

## 📊 Manager Dashboard Reports

| Report | Description |
|--------|-------------|
| Dashboard | KPI overview, revenue trend, sales mix |
| Revenue by Product | Units and revenue per product |
| Revenue Over Time | Daily/weekly/monthly trend charts |
| Profit by Product | Revenue vs COGS vs margin |
| Best Selling | Top products by units and revenue |
| Lagging Products | Below-average performers |
| Employee Transaction Count | # of sales per employee |
| Employee Total Revenue | Revenue generated per employee |
| Employee Avg Transaction | Average sale value per employee |

All reports support CSV export and date range filtering.

---

## 🔌 API Endpoints

All mapped via `netlify.toml` redirects:

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/events` | Fetch upcoming events |
| POST | `/api/register-event` | Register for an event |
| POST | `/api/contact` | Submit contact form |
| GET | `/api/products` | Fetch product catalog |
| POST | `/api/manager/login` | Manager authentication |
| GET | `/api/manager/*?report=TYPE` | All report queries |

Report types: `overview`, `revenue-by-product`, `revenue-over-time`, `profit-by-product`, `best-selling`, `lagging-products`, `emp-transactions`, `emp-revenue`, `emp-avg`

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#0a0a0a` |
| Dark surface | `#111111` |
| Accent (yellow) | `#e8ff4a` |
| Body font | DM Sans |
| Display font | Bebas Neue |
| Mono font | DM Mono |

---

## 🔒 Security Notes

- All manager routes require a valid Bearer token
- Tokens expire after 8 hours
- Passwords are SHA-256 hashed with a salt
- For production, upgrade to bcrypt and proper JWT (jsonwebtoken package)
- Enable Netlify's built-in DDoS protection
- Add rate limiting to auth endpoints for production
