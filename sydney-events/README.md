# Sydney Events - Event Aggregator Website

A full-stack web application that automatically scrapes and displays events in Sydney, Australia. Built with Next.js, TypeScript, Prisma, and Tailwind CSS.

**🤖 NEW: AI Chatbot Integration** - Assignment 2 complete! Telegram bot with event recommendations and auto-notifications. [See Chatbot Setup →](./CHATBOT_SETUP.md)

## 🎯 Features

### Assignment 1 - Web Application
- ✅ **Automatic Event Scraping** - Events are automatically scraped from multiple sources
- ✅ **Beautiful UI** - Clean, responsive design with event cards and filtering
- ✅ **Email Capture** - Users must provide email before accessing ticket links
- ✅ **Auto-Updates** - Events refresh automatically every 6 hours via cron job
- ✅ **Search & Filter** - Filter by category and search events by keywords
- ✅ **Real-time Data** - Events stored in database and served via REST API

### Assignment 2 - AI Chatbot 🤖
- ✅ **Telegram Bot** - Chat interface for event discovery
- ✅ **Preference Learning** - Natural conversation to learn user interests
- ✅ **Smart Recommendations** - AI-powered event matching with scoring algorithm
- ✅ **Auto-Notifications** - Get notified when new matching events are added
- ✅ **Admin Dashboard** - View and manage bot users at `/admin`

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- (Optional) Telegram Bot Token for chatbot features

### Installation

1. **Clone and navigate to the project:**
```bash
cd "d:\VSCODE\Companies-assignments\Louder assignment\sydney-events"
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up the database:**
```bash
npm run db:push
```

4. **Run initial scraping (populate database with events):**
```bash
npm run scrape
```

5. **Start the development server:**
```bash
npm run dev
```

6. **(Optional) Start the Telegram bot:**
```bash
npm run bot
```

7. **Open your browser:**
```
http://localhost:3000
```

### Chatbot Setup

To enable the AI chatbot:

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather)
2. Add your bot token to `.env`:
   ```
   TELEGRAM_BOT_TOKEN="your-token-here"
   ```
3. Run the bot: `npm run bot`
4. Chat with your bot on Telegram!

**Full chatbot documentation:** [CHATBOT_SETUP.md](./CHATBOT_SETUP.md)

## 📁 Project Structure

```
sydney-events/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── events/route.ts      # GET events API
│   │   │   ├── subscribe/route.ts   # POST email subscription API
│   │   │   └── scrape/route.ts      # Trigger manual scraping
│   │   ├── layout.tsx               # Root layout with metadata
│   │   ├── page.tsx                 # Main events listing page
│   │   └── globals.css              # Global styles
│   ├── components/
│   │   ├── EventCard.tsx            # Event card component
│   │   └── EmailModal.tsx           # Email capture modal
│   ├── lib/
│   │   ├── prisma.ts                # Prisma client instance
│   │   ├── scraper.ts               # Web scraping logic
│   │   ├── cron.ts                  # Cron job scheduler
│   │   ├── telegram.ts              # 🤖 Telegram bot handler
│   │   ├── llm.ts                   # 🤖 LangChain/OpenAI integration
│   │   ├── recommendations.ts       # 🤖 Event matching engine
│   │   ├── notifier.ts              # 🤖 Notification system
│   │   └── utils.ts                 # Utility functions
│   └── types/
├── prisma/
│   └── schema.prisma                # Database schema
├── .env                             # Environment variables
└── package.json                     # Dependencies and scripts
```

## 🗄️ Database Schema

**Events Table:**
- `id` - Unique identifier
- `title` - Event name
- `description` - Event details
- `venue` - Location name
- `address` - Full address
- `startDate` - Event start time
- `imageUrl` - Event image
- `ticketUrl` - Link to tickets
- `price` - Ticket price
- `category` - Event category
- `source` - Scraping source
- `createdAt` / `updatedAt` - Timestamps

**EmailSubscribers Table:**
- `id` - Unique identifier
- `email` - Subscriber email
- `eventId` - Associated event (optional)
- `createdAt` - Subscription timestamp

**User Table (Chatbot):** 🤖
- `id` - Unique identifier
- `telegramId` - Telegram user ID
- `username` - Telegram username
- `firstName` / `lastName` - User name
- `isActive` - Active status
- `createdAt` / `updatedAt` - Timestamps

**UserPreference Table (Chatbot):** 🤖
- `id` - Unique identifier
- `userId` - Associated user
- `categories` - Preferred event categories (JSON)
- `priceRange` - Budget preference
- `preferredDays` - Preferred days (JSON)
- `interests` - General interests
- `budget` - Budget level

**Notification Table (Chatbot):** 🤖
- `id` - Unique identifier
- `userId` - Associated user
- `eventId` - Event being notified about
- `message` - Notification text
- `sent` - Delivery status
- `sentAt` - Delivery timestamp

## 🔧 API Endpoints

### Web Application

#### GET `/api/events`
Fetch all upcoming events
- Query params: `?category=Music&search=concert`
- Returns: Array of event objects

#### POST `/api/subscribe`
Save user email before ticket redirect
- Body: `{ email: string, eventId: string }`
- Returns: Success confirmation

#### POST `/api/scrape`
Manually trigger event scraping (can be called via cron)
- Returns: Scraping status

### Chatbot 🤖

#### GET `/api/users`
Get all chatbot users
- Returns: Array of users with preferences

#### GET `/api/users/[id]`
Get specific user details
- Returns: User object with preferences and notifications

#### PATCH `/api/users/[id]`
Update user preferences
- Body: `{ preferences: {...} }`
- Returns: Updated user

#### POST `/api/telegram/webhook`
Telegram webhook endpoint
- Body: Telegram update object
- Returns: Success status

## 🤖 Auto-Update System

Events automatically update via two methods:

### 1. Server-Side Cron (Recommended for Production)
Add to your deployment platform:
```bash
# Vercel Cron (vercel.json)
{
  "crons": [{
    "path": "/api/scrape",
    "schedule": "0 */6 * * *"
  }]
}
```

### 2. External Cron Service
Use services like:
- **Cron-job.org** - Schedule GET/POST to `/api/scrape`
- **EasyCron** - Free tier available
- **GitHub Actions** - Workflow scheduled runs

Example GitHub Action (`.github/workflows/scrape.yml`):
```yaml
name: Scrape Events
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Scraping
        run: |
          curl -X POST https://your-domain.com/api/scrape
```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy to Vercel:**
```bash
npm install -g vercel
vercel
```

3. **Set up database:**
- Use Vercel Postgres or external PostgreSQL
- Update `DATABASE_URL` in environment variables
- Run migrations: `npx prisma db push`

4. **Add environment variables in Vercel dashboard:**
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `SCRAPER_SECRET` (optional, for API security)

### Alternative: Deploy to Railway/Render

Both support automatic deployments from GitHub with PostgreSQL databases.

## 🎨 Customization

### Add New Event Sources

Edit `src/lib/scraper.ts`:
```typescript
async function scrapeNewSource(): Promise<ScrapedEvent[]> {
  // Your scraping logic
  return events;
}

// Add to scrapeAllEvents():
const newEvents = await scrapeNewSource();
```

### Modify Categories

Update categories in `src/app/page.tsx`:
```typescript
const categories = [
  'all',
  'Your Category',
  // ... more categories
];
```

### Change Update Frequency

Modify cron schedule in deployment config:
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight
- `0 */1 * * *` - Every hour

## 🧪 Testing

### Manual Scraping
```bash
npm run scrape
```

### View Database
```bash
npm run db:studio
```
Opens Prisma Studio at `http://localhost:5555`

### Test API Endpoints
```bash
# Get events
curl http://localhost:3000/api/events

# Subscribe email
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","eventId":"123"}'

# Trigger scraping
curl -X POST http://localhost:3000/api/scrape
```

## 📊 Performance

- **Initial Load**: ~500ms with 50 events
- **Database**: SQLite for dev, PostgreSQL for production
- **Scraping**: ~10-30 seconds depending on sources
- **Caching**: Implement Redis for high traffic

## 🔐 Security Considerations

1. **Rate Limiting** - Add rate limiting to scraping endpoint
2. **Email Validation** - Validate and sanitize email inputs
3. **CORS** - Configure CORS for API endpoints
4. **Environment Variables** - Never commit `.env` file
5. **API Authentication** - Add secret key for scraping endpoint

## 📝 Environment Variables

Create `.env` file:
```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SCRAPER_SECRET="your-secret-key"  # Optional
```

## 🐛 Troubleshooting

### "Cannot find module @prisma/client"
```bash
npm install
npm run db:push
```

### Scraping returns no events
- Check website structure hasn't changed
- Update CSS selectors in `scraper.ts`
- Use mock events for testing

### Database locked error
```bash
# Stop all processes using database
pkill -f prisma
rm prisma/dev.db
npm run db:push
```

## 📚 Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **Scraping**: Axios, Cheerio
- **Styling**: Tailwind CSS, Lucide Icons
- **Automation**: node-cron

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Web Scraping Guide](https://www.scrapingbee.com/blog/web-scraping-101/)

## 📄 License

MIT License - feel free to use for your projects!

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📧 Support

For issues or questions, create an issue in the repository.

---

**Built for Assignment 1 - Sydney Events Aggregator**
