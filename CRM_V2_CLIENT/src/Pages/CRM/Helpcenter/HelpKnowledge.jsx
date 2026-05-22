import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import {
  Search,
  BookOpen,
  Key,
  Bug,
  CreditCard,
  Lightbulb,
  User,
  HelpCircle,
  ArrowRight,
  Headphones,
  ChevronRight,
  Star,
  Clock,
  Eye
} from "lucide-react"
import { Input } from "@/Components/ui/input"
import { Button } from "@/Components/ui/button"

const categories = [
  { id: "login", label: "Account & Login", icon: Key, count: 12 },
  { id: "bug", label: "Troubleshooting", icon: Bug, count: 18 },
  { id: "billing", label: "Billing & Payments", icon: CreditCard, count: 8 },
  { id: "features", label: "Features & How-to", icon: Lightbulb, count: 24 },
  { id: "account", label: "Settings & Profile", icon: User, count: 10 },
  { id: "general", label: "General Questions", icon: HelpCircle, count: 15 }
]

const articles = [
  {
    id: "1",
    title: "How to reset your password",
    description: "Step-by-step guide to recover your account access",
    category: "login",
    views: 1234,
    readTime: "2 min",
    featured: true
  },
  {
    id: "2",
    title: "Understanding your invoice",
    description: "Breakdown of charges and billing cycle explained",
    category: "billing",
    views: 892,
    readTime: "3 min",
    featured: true
  },
  {
    id: "3",
    title: "Two-factor authentication setup",
    description: "Secure your account with 2FA in minutes",
    category: "login",
    views: 756,
    readTime: "4 min",
    featured: true
  },
  {
    id: "4",
    title: "Troubleshooting login errors",
    description: "Common login issues and how to fix them",
    category: "login",
    views: 543,
    readTime: "3 min"
  },
  {
    id: "5",
    title: "Updating payment method",
    description: "How to change your credit card or billing info",
    category: "billing",
    views: 421,
    readTime: "2 min"
  },
  {
    id: "6",
    title: "Browser compatibility guide",
    description: "Supported browsers and known limitations",
    category: "bug",
    views: 389,
    readTime: "2 min"
  },
  {
    id: "7",
    title: "Getting started guide",
    description: "Everything you need to know to begin",
    category: "features",
    views: 2341,
    readTime: "5 min",
    featured: true
  },
  {
    id: "8",
    title: "Managing team members",
    description: "Add, remove, and manage user permissions",
    category: "account",
    views: 312,
    readTime: "3 min"
  },
  {
    id: "9",
    title: "Canceling your subscription",
    description: "How to cancel and what happens to your data",
    category: "billing",
    views: 287,
    readTime: "2 min"
  },
  {
    id: "10",
    title: "Clearing cache and cookies",
    description: "Quick fix for many common display issues",
    category: "bug",
    views: 654,
    readTime: "1 min"
  },
  {
    id: "11",
    title: "API integration basics",
    description: "Connect your tools using our REST API",
    category: "features",
    views: 198,
    readTime: "6 min"
  },
  {
    id: "12",
    title: "Privacy and data security",
    description: "How we protect your information",
    category: "general",
    views: 445,
    readTime: "4 min"
  }
]

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(null)

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        !selectedCategory || article.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  const popularArticles = useMemo(() => {
    return [...articles].sort((a, b) => b.views - a.views).slice(0, 4)
  }, [])

  const featuredArticles = useMemo(() => {
    return articles.filter(a => a.featured)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/helpcenter" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-600">
                <Headphones className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-display font-bold text-slate-900">
                  Plexis Studio
                </h1>
                <p className="text-xs text-slate-500">Knowledge Base</p>
              </div>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                to="/my-tickets"
                className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                My Tickets
              </Link>
              <Link
                to="/helpcenter"
                className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                Submit Ticket
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-purple-600 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BookOpen className="w-12 h-12 text-primary-foreground mx-auto mb-4" />
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary-foreground mb-3">
              How can we help you?
            </h1>
            <p className="text-primary-foreground/80 mb-6 text-sm sm:text-base">
              Search our knowledge base or browse by category
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-base bg-white border-0 shadow-lg rounded-xl"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Categories */}
        <section className="mb-10">
          <h2 className="text-lg font-display font-semibold text-slate-900 mb-4">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map(category => {
              const Icon = category.icon
              const isSelected = selectedCategory === category.id
              return (
                <button
                  key={category.id}
                  onClick={() =>
                    setSelectedCategory(isSelected ? null : category.id)
                  }
                  className={`p-4 rounded-xl border transition-all text-left ${
                    isSelected
                      ? "bg-purple-600 text-primary-foreground border-primary shadow-purple"
                      : "bg-white border-slate-200 hover:border-primary hover:shadow-md"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-2 ${
                      isSelected ? "text-primary-foreground" : "text-primary"
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      isSelected ? "text-primary-foreground" : "text-slate-900"
                    }`}
                  >
                    {category.label}
                  </p>
                  <p
                    className={`text-xs ${
                      isSelected
                        ? "text-primary-foreground/80"
                        : "text-slate-500"
                    }`}
                  >
                    {category.count} articles
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Articles */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-slate-900">
                {selectedCategory
                  ? `${categories.find(c => c.id === selectedCategory)?.label}`
                  : searchQuery
                  ? "Search Results"
                  : "All Articles"}
              </h2>
              <span className="text-sm text-slate-500">
                {filteredArticles.length} articles
              </span>
            </div>
            <div className="space-y-3">
              {filteredArticles.map((article, index) => (
                <motion.a
                  key={article.id}
                  href="#"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-primary hover:shadow-md transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {article.featured && (
                        <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                      )}
                      <h3 className="text-sm font-medium text-slate-900 group-hover:text-primary transition-colors truncate">
                        {article.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {article.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors flex-shrink-0" />
                </motion.a>
              ))}
              {filteredArticles.length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-500">No articles found</p>
                  <Link 
                    to="/helpcenter" 
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 mt-4 border border-slate-200 hover:bg-slate-50 px-4 py-2"
                  >
                    Submit a ticket
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Articles */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-warning" />
                Most Popular
              </h3>
              <div className="space-y-3">
                {popularArticles.map(article => (
                  <a key={article.id} href="#" className="block group">
                    <p className="text-sm text-slate-900 group-hover:text-primary transition-colors">
                      {article.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {article.views.toLocaleString()} views
                    </p>
                  </a>
                ))}
              </div>
            </div>

            {/* Still need help? */}
            <div className="bg-purple-600 rounded-xl p-5 text-primary-foreground">
              <h3 className="text-sm font-display font-semibold mb-2">
                Can't find what you need?
              </h3>
              <p className="text-xs text-primary-foreground/80 mb-4">
                Our support team is here to help
              </p>
              <Link 
                to="/helpcenter"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full bg-white text-purple-600 hover:bg-purple-50 px-3 py-2"
              >
                  Submit a Ticket
                  <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
