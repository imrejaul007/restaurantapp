'use client'

import { useState } from 'react'
import { 
  HomeIcon,
  BriefcaseIcon,
  ShoppingCartIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ShareIcon,
  PlusIcon,
  PhotoIcon,
  LinkIcon,
  MapPinIcon,
  CalendarIcon,
  BellIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

const navigationItems = [
  { name: 'Home', icon: HomeIcon, id: 'home' },
  { name: 'Jobs', icon: BriefcaseIcon, id: 'jobs' },
  { name: 'Marketplace', icon: ShoppingCartIcon, id: 'marketplace' },
  { name: 'Profile', icon: UserIcon, id: 'profile' },
  { name: 'Find Employees', icon: MagnifyingGlassIcon, id: 'search' },
]

const communityPosts = [
  {
    id: 1,
    user: { name: 'Ocean View Diner', avatar: '🍽️', type: 'Restaurant' },
    content: 'Just launched our new weekend brunch menu! Looking for experienced brunch cooks to join our team. Any recommendations from the community?',
    image: '/api/placeholder/400/200',
    time: '2 hours ago',
    likes: 24,
    comments: 8,
    shares: 3,
    isLiked: false,
    category: 'Job Inquiry'
  },
  {
    id: 2,
    user: { name: 'Chef Maria Santos', avatar: '👩‍🍳', type: 'Employee' },
    content: 'Sharing my experience working with Fresh Farm Supplies - excellent quality produce and reliable delivery. Highly recommend for any restaurant looking for fresh ingredients!',
    time: '4 hours ago',
    likes: 18,
    comments: 12,
    shares: 6,
    isLiked: true,
    category: 'Vendor Review'
  },
  {
    id: 3,
    user: { name: 'Mumbai Food Vendors', avatar: '🚚', type: 'Vendor' },
    content: 'Special offer for this week: 20% off on all kitchen equipment rentals! Perfect for restaurants looking to upgrade or expand their kitchen setup.',
    time: '1 day ago',
    likes: 35,
    comments: 15,
    shares: 12,
    isLiked: false,
    category: 'Business Offer'
  }
]

const jobListings = [
  { 
    id: 1, 
    title: 'Senior Chef', 
    restaurant: 'Tasty Bites', 
    location: 'Mumbai', 
    salary: '₹25k-35k', 
    type: 'Full-time',
    posted: '2 days ago',
    applicants: 12,
    description: 'Looking for experienced chef with 3+ years in Indian cuisine'
  },
  { 
    id: 2, 
    title: 'Restaurant Manager', 
    restaurant: 'Spice Garden', 
    location: 'Delhi', 
    salary: '₹30k-45k', 
    type: 'Full-time',
    posted: '1 day ago',
    applicants: 8,
    description: 'Seeking dynamic manager with leadership skills'
  },
  { 
    id: 3, 
    title: 'Waiter/Waitress', 
    restaurant: 'Ocean Grill', 
    location: 'Bangalore', 
    salary: '₹18k-25k', 
    type: 'Part-time',
    posted: '3 hours ago',
    applicants: 15,
    description: 'Customer service oriented individual needed'
  }
]

const marketplaceItems = [
  {
    id: 1,
    vendor: 'Fresh Farm Supplies',
    item: 'Organic Vegetables Bundle',
    price: '₹500/kg',
    rating: 4.8,
    image: '/api/placeholder/150/150',
    description: 'Fresh organic vegetables sourced directly from farms'
  },
  {
    id: 2,
    vendor: 'Kitchen Pro Equipment',
    item: 'Commercial Gas Stove',
    price: '₹25,000',
    rating: 4.6,
    image: '/api/placeholder/150/150',
    description: 'High-quality commercial grade gas stove'
  },
  {
    id: 3,
    vendor: 'Packaging Solutions',
    item: 'Food Delivery Containers',
    price: '₹5/piece',
    rating: 4.7,
    image: '/api/placeholder/150/150',
    description: 'Eco-friendly food delivery containers'
  }
]

const employeeSearchResults = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    position: 'Head Chef',
    experience: '8 years',
    rating: 4.9,
    location: 'Mumbai',
    verified: true,
    avatar: '👨‍🍳',
    skills: ['Indian Cuisine', 'Menu Planning', 'Team Leadership']
  },
  {
    id: 2,
    name: 'Priya Sharma',
    position: 'Restaurant Manager',
    experience: '5 years',
    rating: 4.7,
    location: 'Delhi',
    verified: true,
    avatar: '👩‍💼',
    skills: ['Operations', 'Staff Management', 'Customer Service']
  },
  {
    id: 3,
    name: 'Ahmed Ali',
    position: 'Sous Chef',
    experience: '4 years',
    rating: 4.6,
    location: 'Bangalore',
    verified: false,
    avatar: '👨‍🍳',
    skills: ['Continental Cuisine', 'Food Preparation', 'Kitchen Management']
  }
]

export default function RestaurantDashboard() {
  const [activeSection, setActiveSection] = useState('home')
  const [likedPosts, setLikedPosts] = useState(new Set())

  const toggleLike = (postId: number) => {
    const newLikedPosts = new Set(likedPosts)
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId)
    } else {
      newLikedPosts.add(postId)
    }
    setLikedPosts(newLikedPosts)
  }

  const renderHome = () => (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Create Post */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            🏪
          </div>
          <input 
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-gray-500 cursor-pointer"
            placeholder="What's happening in your restaurant?"
            readOnly
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex space-x-4 text-gray-500">
            <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2">
              <PhotoIcon className="w-5 h-5" />
              <span>Photo</span>
            </button>
            <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2">
              <BriefcaseIcon className="w-5 h-5" />
              <span>Job</span>
            </button>
            <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2">
              <MapPinIcon className="w-5 h-5" />
              <span>Location</span>
            </button>
          </div>
          <button className="btn-primary">Post</button>
        </div>
      </div>

      {/* Community Posts */}
      {communityPosts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-sm border">
          {/* Post Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                  {post.user.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{post.user.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{post.time}</span>
                    <span>•</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {post.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="p-4">
            <p className="text-gray-900 mb-3">{post.content}</p>
            {post.image && (
              <div className="bg-gray-200 rounded-lg h-48 mb-3 flex items-center justify-center">
                <span className="text-gray-500">📸 Image</span>
              </div>
            )}
          </div>

          {/* Post Actions */}
          <div className="px-4 py-2 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex space-x-6">
                <button 
                  onClick={() => toggleLike(post.id)}
                  className="flex items-center space-x-2 text-gray-500 hover:text-red-500"
                >
                  {likedPosts.has(post.id) || post.isLiked ? (
                    <HeartSolidIcon className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5" />
                  )}
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  <span>{post.comments}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500">
                  <ShareIcon className="w-5 h-5" />
                  <span>{post.shares}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderJobs = () => (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Job Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Job Listings</h2>
          <button className="btn-primary">
            <PlusIcon className="w-4 h-4 mr-2" />
            Post New Job
          </button>
        </div>
        <div className="flex space-x-4">
          <select className="px-3 py-2 border border-gray-300 rounded-lg">
            <option>All Locations</option>
            <option>Mumbai</option>
            <option>Delhi</option>
            <option>Bangalore</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg">
            <option>All Positions</option>
            <option>Chef</option>
            <option>Waiter</option>
            <option>Manager</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg">
            <option>All Types</option>
            <option>Full-time</option>
            <option>Part-time</option>
          </select>
        </div>
      </div>

      {/* Job Cards */}
      {jobListings.map((job) => (
        <div key={job.id} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                <span>🏪 {job.restaurant}</span>
                <span>📍 {job.location}</span>
                <span>💰 {job.salary}</span>
                <span>📅 {job.type}</span>
              </div>
              <p className="text-gray-600 mb-3">{job.description}</p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-500">Posted {job.posted}</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  {job.applicants} applicants
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="btn border border-gray-300 text-gray-700 hover:bg-gray-50">
                View Details
              </button>
              <button className="btn-primary">Apply Now</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderMarketplace = () => (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Marketplace Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Marketplace</h2>
          <div className="flex space-x-2">
            <input 
              className="px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Search vendors, products..."
            />
            <button className="btn-primary">Search</button>
          </div>
        </div>
        <div className="flex space-x-4">
          <button className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm">All Categories</button>
          <button className="text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-100">Raw Materials</button>
          <button className="text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-100">Equipment</button>
          <button className="text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-100">Packaging</button>
          <button className="text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-100">Services</button>
        </div>
      </div>

      {/* Marketplace Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {marketplaceItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">📦 Product Image</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{item.item}</h3>
              <p className="text-sm text-gray-600 mb-2">by {item.vendor}</p>
              <p className="text-sm text-gray-500 mb-3">{item.description}</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-blue-600">{item.price}</span>
                <div className="flex items-center">
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-sm text-gray-600 ml-1">{item.rating}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 btn border border-gray-300 text-gray-700 hover:bg-gray-50">
                  View Details
                </button>
                <button className="flex-1 btn-primary">Order Now</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderProfile = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg"></div>
        <div className="p-6 -mt-16">
          <div className="flex items-end space-x-4">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-white flex items-center justify-center text-3xl">
              🏪
            </div>
            <div className="flex-1 mt-16">
              <h1 className="text-2xl font-bold text-gray-900">Tasty Bites Restaurant</h1>
              <p className="text-gray-600">Casual Dining • Mumbai, Maharashtra</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>⭐ 4.5 rating</span>
                <span>👥 25 employees</span>
                <span>✅ Verified</span>
              </div>
            </div>
            <button className="btn-primary">Edit Profile</button>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Restaurant Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Owner:</span>
              <span>John Doe</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cuisine Type:</span>
              <span>Indian, Continental</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Operating Hours:</span>
              <span>10:00 AM - 11:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone:</span>
              <span>+91-9876543210</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span>contact@tastybites.com</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Business Metrics</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Monthly Revenue:</span>
              <span>₹10L - 50L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Years in Business:</span>
              <span>8 years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Seating Capacity:</span>
              <span>60 people</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Current Jobs Posted:</span>
              <span>4 active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Trust Score:</span>
              <span className="text-green-600 font-semibold">85/100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSearch = () => (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-xl font-semibold mb-4">Find Employees</h2>
        <div className="flex space-x-4 mb-4">
          <input 
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Search by name, position, location..."
          />
          <button className="btn-primary">Search</button>
        </div>
        <div className="flex space-x-4">
          <select className="px-3 py-2 border border-gray-300 rounded-lg">
            <option>All Positions</option>
            <option>Chef</option>
            <option>Manager</option>
            <option>Waiter</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg">
            <option>All Locations</option>
            <option>Mumbai</option>
            <option>Delhi</option>
            <option>Bangalore</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg">
            <option>All Experience</option>
            <option>0-2 years</option>
            <option>3-5 years</option>
            <option>5+ years</option>
          </select>
        </div>
      </div>

      {/* Employee Results */}
      <div className="grid lg:grid-cols-2 gap-6">
        {employeeSearchResults.map((employee) => (
          <div key={employee.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                {employee.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                  {employee.verified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{employee.position}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <span>📍 {employee.location}</span>
                  <span>💼 {employee.experience}</span>
                  <span>⭐ {employee.rating}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {employee.skills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <button className="btn border border-gray-300 text-gray-700 hover:bg-gray-50">
                    View Profile
                  </button>
                  <button className="btn-primary">Request Verification</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'home': return renderHome()
      case 'jobs': return renderJobs()
      case 'marketplace': return renderMarketplace()
      case 'profile': return renderProfile()
      case 'search': return renderSearch()
      default: return renderHome()
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-bold text-blue-600">RestaurantHub</div>
              
              {/* Navigation Tabs */}
              <nav className="hidden md:flex space-x-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === item.id 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-2" />
                      {item.name}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-gray-600 hover:bg-gray-100 relative">
                <BellIcon className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  🏪
                </div>
                <span className="hidden md:block text-sm font-medium">Tasty Bites</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto py-2 px-4 space-x-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === item.id 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600'
                }`}
              >
                <Icon className="w-4 h-4 mr-1" />
                {item.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="py-6">
        {renderContent()}
      </main>
    </div>
  )
}