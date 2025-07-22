import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Utensils, TrendingDown } from 'lucide-react';
import { Toast, useToast } from '@/components/toast';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to KitchenMania 🍳
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Your smart pantry tracking solution. Keep track of your ingredients, 
          reduce food waste, and discover amazing recipes with AI-powered recommendations.
        </p>
        <div className="text-center">
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign In to Get Started
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-4 gap-8 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📦 Smart Inventory
            </CardTitle>
            <CardDescription>
              Keep track of all your pantry items with expiry dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Organize your pantry items by category, track quantities, 
              and get notified about items nearing expiry.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 AI Recipe Suggestions
            </CardTitle>
            <CardDescription>
              Get personalized recipe recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Our AI analyzes your available ingredients and suggests 
              delicious recipes you can make right now.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💰 Price Tracking
            </CardTitle>
            <CardDescription>
              Track prices and shopping history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Scan receipts to track prices over time, compare costs 
              between stores, and make smarter shopping decisions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ♻️ Reduce Waste
            </CardTitle>
            <CardDescription>
              Minimize food waste and save money
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Use up ingredients before they expire with smart 
              meal planning and timely recipe suggestions.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Section */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Get started with KitchenMania in three simple steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
              <h3 className="font-semibold mb-2">Add Your Items</h3>
              <p className="text-gray-600 text-sm">
                Add items from your pantry, fridge, or freezer with quantities and expiry dates.
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-2">2</div>
              <h3 className="font-semibold mb-2">Track & Organize</h3>
              <p className="text-gray-600 text-sm">
                Organize items by category and keep track of what you have available.
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-2">3</div>
              <h3 className="font-semibold mb-2">Get Recipes</h3>
              <p className="text-gray-600 text-sm">
                Click &quot;Get Recipe Ideas&quot; to receive AI-powered recipe recommendations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
