# KitchenMania - Smart Pantry & Recipe Management

A modern web application for managing your pantry inventory, tracking prices, and generating AI-powered recipes based on what you have available.

## Features

- **Smart Pantry Management**: Track items with quantities, expiration dates, and automatic emoji generation
- **AI-Powered Features**:
  - Receipt scanning with image recognition (GPT-4o vision)
  - Bulk text parsing for quick item addition
  - Intelligent recipe generation based on available ingredients
  - Automatic emoji selection for items
- **Price Tracking**: Monitor price history and trends across different merchants
- **Recipe Management**: Save, rate, and organize recipes with ingredient tracking
- **Unit System Support**: Toggle between Imperial (lb/oz) and Metric (kg/g) units
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15.4.2 with TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui with Radix UI
- **AI Integration**: OpenAI API (GPT-3.5-turbo, GPT-4o vision, DALL-E)
- **State Management**: React hooks and localStorage
- **Deployment**: Optimized for Vercel

## Prerequisites

- Node.js 18+ and npm/yarn
- OpenAI API key (for AI features)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/KitchenMania.git
   cd KitchenMania
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local`
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## Deployment to Vercel

### Option 1: Deploy with Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables:**
   ```bash
   vercel env add OPENAI_API_KEY
   ```

### Option 2: Deploy via GitHub

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables in project settings
   - Deploy!

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key for AI features | Yes (for AI features) |
| `NEXT_PUBLIC_APP_URL` | Your app's URL (for production) | No |

## Project Structure

```
KitchenMania/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/            # API routes
│   │   ├── pantry/         # Pantry management page
│   │   ├── recipes/        # Recipe pages
│   │   └── tracker/        # Price tracker page
│   ├── components/         # Reusable UI components
│   ├── lib/               # Utility functions
│   └── utils/             # Helper utilities
├── public/                # Static assets
└── package.json          # Dependencies and scripts
```

## Key Features Documentation

### Pantry Management
- Add items manually or via bulk text/receipt scanning
- Track quantities with decimal support
- Set expiration dates and purchase dates
- Organize by categories with drag-and-drop

### Recipe Generation
- Select specific items to use in recipes
- Set serving sizes and dietary preferences
- AI generates 2-3 recipe suggestions
- Automatically deducts used ingredients

### Price Tracking
- Historical price data from receipts
- Price trend analysis
- Filter by merchant and date
- Edit mode for reordering and deletion

### Receipt Scanning
- Upload receipt images
- AI extracts items, prices, and merchant info
- Supports multiple languages (auto-translation)
- Matches existing pantry items

## Running Without OpenAI API

The app includes fallback functionality when no API key is provided:
- Manual item entry still works
- Basic recipe templates are available
- Price tracking functions normally
- Receipt scanning shows mock data

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for personal or commercial purposes.
