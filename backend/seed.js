/**
 * seed.js — Curated seed script for ecommerce recommendation engine
 * 
 * Features:
 * - 50 realistic products across 5 categories
 * - Real product images from reliable sources
 * - No pre-registered users (fresh start)
 * - Proper Pakistani Rupee pricing
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config();

const Product = require("./models/Product");
const User = require("./models/User");
const Category = require("./models/Category");

// Optional models
let Interaction, Order;
try { Interaction = require("./models/Interaction"); } catch (e) { }
try { Order = require("./models/Order"); } catch (e) { }

// Curated products with real images
const PRODUCTS = [
  // ==================== ELECTRONICS (10 products) ====================
  {
    name: "Apple iPhone 15 Pro Max",
    description: "The latest iPhone featuring A17 Pro chip, titanium design, 48MP camera system, and all-day battery life. Experience the future of mobile technology.",
    price: 549999,
    category: "Electronics",
    brand: "Apple",
    tags: ["smartphone", "apple", "iphone", "5g", "premium"],
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
    stock: 25,
    rating: 4.9,
    numReviews: 234
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    description: "Samsung's flagship with Galaxy AI, 200MP camera, S Pen included, titanium frame, and 5000mAh battery. Ultimate Android experience.",
    price: 449999,
    category: "Electronics",
    brand: "Samsung",
    tags: ["smartphone", "samsung", "android", "5g", "camera"],
    imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80",
    stock: 30,
    rating: 4.8,
    numReviews: 189
  },
  {
    name: "Sony WH-1000XM5 Headphones",
    description: "Industry-leading noise cancellation, exceptional sound quality, 30-hour battery life, and ultra-comfortable design for all-day listening.",
    price: 89999,
    category: "Electronics",
    brand: "Sony",
    tags: ["headphones", "wireless", "noise-cancelling", "sony", "audio"],
    imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80",
    stock: 45,
    rating: 4.7,
    numReviews: 456
  },
  {
    name: "MacBook Pro 14-inch M3",
    description: "Supercharged by M3 Pro chip, stunning Liquid Retina XDR display, up to 18 hours battery life. Built for professionals.",
    price: 649999,
    category: "Electronics",
    brand: "Apple",
    tags: ["laptop", "apple", "macbook", "professional", "m3"],
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
    stock: 15,
    rating: 4.9,
    numReviews: 178
  },
  {
    name: "iPad Pro 12.9-inch",
    description: "M2 chip, Liquid Retina XDR display, works with Apple Pencil and Magic Keyboard. The ultimate iPad experience.",
    price: 329999,
    category: "Electronics",
    brand: "Apple",
    tags: ["tablet", "apple", "ipad", "creative", "professional"],
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
    stock: 20,
    rating: 4.8,
    numReviews: 234
  },
  {
    name: "Dell XPS 15 Laptop",
    description: "15.6-inch 4K OLED display, Intel Core i9, 32GB RAM, 1TB SSD. Premium Windows laptop for creators.",
    price: 449999,
    category: "Electronics",
    brand: "Dell",
    tags: ["laptop", "dell", "windows", "4k", "creator"],
    imageUrl: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80",
    stock: 18,
    rating: 4.6,
    numReviews: 145
  },
  {
    name: "AirPods Pro 2nd Gen",
    description: "Active noise cancellation, adaptive transparency, personalized spatial audio. The magic of AirPods, Icons.",
    price: 74999,
    category: "Electronics",
    brand: "Apple",
    tags: ["earbuds", "apple", "airpods", "wireless", "noise-cancelling"],
    imageUrl: "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=600&q=80",
    stock: 60,
    rating: 4.7,
    numReviews: 567
  },
  {
    name: "Samsung 65\" Neo QLED 4K TV",
    description: "Quantum Matrix Technology, Neural Quantum Processor, stunning picture quality with deep blacks and vivid colors.",
    price: 379999,
    category: "Electronics",
    brand: "Samsung",
    tags: ["tv", "samsung", "4k", "smart-tv", "qled"],
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&q=80",
    stock: 12,
    rating: 4.8,
    numReviews: 89
  },
  {
    name: "JBL Flip 6 Bluetooth Speaker",
    description: "Bold sound, IP67 waterproof, 12-hour playtime. Portable speaker for adventures anywhere.",
    price: 24999,
    category: "Electronics",
    brand: "JBL",
    tags: ["speaker", "bluetooth", "portable", "waterproof", "jbl"],
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80",
    stock: 75,
    rating: 4.5,
    numReviews: 312
  },
  {
    name: "Canon EOS R6 Mark II Camera",
    description: "24.2MP full-frame sensor, 40fps continuous shooting, 4K60 video. Professional mirrorless camera.",
    price: 599999,
    category: "Electronics",
    brand: "Canon",
    tags: ["camera", "mirrorless", "professional", "canon", "photography"],
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80",
    stock: 8,
    rating: 4.9,
    numReviews: 67
  },

  // ==================== FASHION (10 products) ====================
  {
    name: "Nike Air Max 270",
    description: "Iconic Air Max with the largest heel Air unit yet. Comfortable, stylish, and perfect for everyday wear.",
    price: 32999,
    category: "Fashion",
    brand: "Nike",
    tags: ["sneakers", "nike", "airmax", "casual", "shoes"],
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    stock: 40,
    rating: 4.6,
    numReviews: 423
  },
  {
    name: "Levi's 501 Original Jeans",
    description: "The original blue jean. Button fly, straight leg, sits at waist. Timeless American style since 1873.",
    price: 14999,
    category: "Fashion",
    brand: "Levi's",
    tags: ["jeans", "levis", "denim", "501", "classic"],
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
    stock: 55,
    rating: 4.5,
    numReviews: 678
  },
  {
    name: "Adidas Ultraboost Running Shoes",
    description: "Responsive Boost midsole, Primeknit upper, Continental rubber outsole. Run further, run faster.",
    price: 39999,
    category: "Fashion",
    brand: "Adidas",
    tags: ["running", "adidas", "ultraboost", "sports", "shoes"],
    imageUrl: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&q=80",
    stock: 35,
    rating: 4.7,
    numReviews: 345
  },
  {
    name: "Ray-Ban Aviator Sunglasses",
    description: "Classic aviator shape, gold metal frame, green G-15 lenses. Iconic style since 1937.",
    price: 34999,
    category: "Fashion",
    brand: "Ray-Ban",
    tags: ["sunglasses", "rayban", "aviator", "classic", "accessories"],
    imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80",
    stock: 28,
    rating: 4.8,
    numReviews: 234
  },
  {
    name: "Tommy Hilfiger Polo Shirt",
    description: "Classic fit, signature stripe collar, premium cotton. Preppy American style for any occasion.",
    price: 12999,
    category: "Fashion",
    brand: "Tommy Hilfiger",
    tags: ["polo", "shirt", "tommy", "casual", "cotton"],
    imageUrl: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600&q=80",
    stock: 65,
    rating: 4.4,
    numReviews: 189
  },
  {
    name: "Michael Kors Leather Watch",
    description: "Sleek stainless steel case, genuine leather strap, water resistant. Elegant timepiece for women.",
    price: 44999,
    category: "Fashion",
    brand: "Michael Kors",
    tags: ["watch", "leather", "women", "accessories", "luxury"],
    imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&q=80",
    stock: 22,
    rating: 4.6,
    numReviews: 156
  },
  {
    name: "The North Face Puffer Jacket",
    description: "700-fill goose down, water-resistant finish, packable design. Stay warm in extreme cold.",
    price: 54999,
    category: "Fashion",
    brand: "The North Face",
    tags: ["jacket", "winter", "puffer", "outdoor", "warm"],
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80",
    stock: 30,
    rating: 4.7,
    numReviews: 278
  },
  {
    name: "Guess Leather Handbag",
    description: "Genuine leather, signature hardware, spacious interior with multiple pockets. Everyday elegance.",
    price: 29999,
    category: "Fashion",
    brand: "Guess",
    tags: ["handbag", "leather", "women", "accessories", "fashion"],
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
    stock: 18,
    rating: 4.5,
    numReviews: 134
  },
  {
    name: "Calvin Klein Slim Fit Suit",
    description: "Modern slim fit, premium wool blend, two-button closure. Sharp and sophisticated for business.",
    price: 79999,
    category: "Fashion",
    brand: "Calvin Klein",
    tags: ["suit", "formal", "business", "men", "professional"],
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
    stock: 15,
    rating: 4.6,
    numReviews: 89
  },
  {
    name: "Puma RS-X Sneakers",
    description: "Retro-inspired design, chunky sole, bold colorway. Stand out with street style.",
    price: 27999,
    category: "Fashion",
    brand: "Puma",
    tags: ["sneakers", "puma", "retro", "streetwear", "casual"],
    imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80",
    stock: 42,
    rating: 4.4,
    numReviews: 267
  },

  // ==================== HOME & KITCHEN (10 products) ====================
  {
    name: "Dyson V15 Detect Vacuum",
    description: "Laser reveals microscopic dust, LCD screen shows real-time particle count. Most powerful cordless vacuum.",
    price: 149999,
    category: "Home & Kitchen",
    brand: "Dyson",
    tags: ["vacuum", "cordless", "cleaning", "dyson", "smart"],
    imageUrl: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80",
    stock: 20,
    rating: 4.8,
    numReviews: 345
  },
  {
    name: "Philips Air Fryer XXL",
    description: "Rapid Air Technology, 7.3L capacity, digital display. Crispy food with up to 90% less fat.",
    price: 54999,
    category: "Home & Kitchen",
    brand: "Philips",
    tags: ["air-fryer", "cooking", "healthy", "kitchen", "appliance"],
    imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80",
    stock: 35,
    rating: 4.7,
    numReviews: 456
  },
  {
    name: "Nespresso Vertuo Plus Coffee Machine",
    description: "Centrifusion technology, 5 cup sizes, automatic blend recognition. Barista-quality coffee at home.",
    price: 34999,
    category: "Home & Kitchen",
    brand: "Nespresso",
    tags: ["coffee", "nespresso", "espresso", "kitchen", "automatic"],
    imageUrl: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&q=80",
    stock: 28,
    rating: 4.6,
    numReviews: 289
  },
  {
    name: "KitchenAid Stand Mixer",
    description: "Iconic tilt-head design, 10 speeds, 5-quart bowl. The heart of every kitchen since 1919.",
    price: 89999,
    category: "Home & Kitchen",
    brand: "KitchenAid",
    tags: ["mixer", "baking", "kitchenaid", "appliance", "cooking"],
    imageUrl: "https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=600&q=80",
    stock: 15,
    rating: 4.9,
    numReviews: 567
  },
  {
    name: "Instant Pot Duo Plus",
    description: "9-in-1 pressure cooker, slow cooker, rice cooker, steamer and more. One pot to rule them all.",
    price: 24999,
    category: "Home & Kitchen",
    brand: "Instant Pot",
    tags: ["pressure-cooker", "multi-cooker", "instant-pot", "cooking", "smart"],
    imageUrl: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80",
    stock: 45,
    rating: 4.7,
    numReviews: 789
  },
  {
    name: "Le Creuset Dutch Oven",
    description: "Enameled cast iron, superior heat distribution, lifetime guarantee. French craftsmanship since 1925.",
    price: 74999,
    category: "Home & Kitchen",
    brand: "Le Creuset",
    tags: ["dutch-oven", "cast-iron", "cooking", "premium", "french"],
    imageUrl: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600&q=80",
    stock: 12,
    rating: 4.9,
    numReviews: 234
  },
  {
    name: "Ninja Blender Pro",
    description: "1400-watt motor, Auto-iQ technology, 72oz pitcher. Crush ice, blend smoothies, make soup.",
    price: 29999,
    category: "Home & Kitchen",
    brand: "Ninja",
    tags: ["blender", "smoothie", "ninja", "kitchen", "powerful"],
    imageUrl: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80",
    stock: 38,
    rating: 4.5,
    numReviews: 423
  },
  {
    name: "IKEA MALM Bed Frame",
    description: "Clean lines, real wood veneer, adjustable bed sides. Scandinavian design for restful sleep.",
    price: 44999,
    category: "Home & Kitchen",
    brand: "IKEA",
    tags: ["bed", "furniture", "bedroom", "ikea", "modern"],
    imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80",
    stock: 10,
    rating: 4.4,
    numReviews: 156
  },
  {
    name: "Philips Hue Starter Kit",
    description: "Smart LED bulbs, Hue Bridge included, 16 million colors. Control your lights with voice or app.",
    price: 34999,
    category: "Home & Kitchen",
    brand: "Philips",
    tags: ["smart-home", "lighting", "hue", "led", "smart"],
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
    stock: 32,
    rating: 4.6,
    numReviews: 345
  },
  {
    name: "Breville Smart Oven Air",
    description: "Air fry, dehydrate, roast, bake, and more. 13 cooking functions in one countertop oven.",
    price: 79999,
    category: "Home & Kitchen",
    brand: "Breville",
    tags: ["oven", "air-fryer", "smart", "cooking", "versatile"],
    imageUrl: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&q=80",
    stock: 18,
    rating: 4.7,
    numReviews: 234
  },

  // ==================== SPORTS & FITNESS (10 products) ====================
  {
    name: "Peloton Bike+",
    description: "22-inch rotating HD touchscreen, auto-follow resistance, studio-quality sound. The future of fitness.",
    price: 549999,
    category: "Sports & Fitness",
    brand: "Peloton",
    tags: ["bike", "cycling", "cardio", "peloton", "home-gym"],
    imageUrl: "https://images.unsplash.com/photo-1591291621164-2c6367723315?w=600&q=80",
    stock: 8,
    rating: 4.8,
    numReviews: 234
  },
  {
    name: "Bowflex Adjustable Dumbbells",
    description: "Replace 15 sets of weights, 5-52.5 lbs per hand. Quick-change dial system.",
    price: 89999,
    category: "Sports & Fitness",
    brand: "Bowflex",
    tags: ["dumbbells", "weights", "strength", "adjustable", "home-gym"],
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
    stock: 25,
    rating: 4.7,
    numReviews: 456
  },
  {
    name: "Garmin Forerunner 945",
    description: "GPS running watch with music, maps, and Garmin Pay. Train smarter with advanced metrics.",
    price: 124999,
    category: "Sports & Fitness",
    brand: "Garmin",
    tags: ["smartwatch", "running", "gps", "garmin", "fitness"],
    imageUrl: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&q=80",
    stock: 22,
    rating: 4.6,
    numReviews: 312
  },
  {
    name: "Yeti Rambler Water Bottle",
    description: "18/8 stainless steel, double-wall vacuum insulation. Keeps drinks cold or hot for hours.",
    price: 7999,
    category: "Sports & Fitness",
    brand: "Yeti",
    tags: ["water-bottle", "insulated", "yeti", "outdoor", "hydration"],
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
    stock: 80,
    rating: 4.8,
    numReviews: 567
  },
  {
    name: "Theragun Pro Massage Gun",
    description: "Professional-grade percussive therapy, 6 attachments, OLED screen. Elite recovery tool.",
    price: 124999,
    category: "Sports & Fitness",
    brand: "Therabody",
    tags: ["massage", "recovery", "theragun", "muscle", "therapy"],
    imageUrl: "https://images.unsplash.com/photo-1596357395217-80de13130e92?w=600&q=80",
    stock: 18,
    rating: 4.7,
    numReviews: 234
  },
  {
    name: "Manduka PRO Yoga Mat",
    description: "6mm thick, lifetime guarantee, closed-cell surface. The gold standard of yoga mats.",
    price: 24999,
    category: "Sports & Fitness",
    brand: "Manduka",
    tags: ["yoga", "mat", "exercise", "manduka", "fitness"],
    imageUrl: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&q=80",
    stock: 45,
    rating: 4.8,
    numReviews: 389
  },
  {
    name: "NordicTrack Treadmill 2450",
    description: "22-inch touchscreen, -3% to 15% incline, 12 mph speed. Interactive personal training.",
    price: 449999,
    category: "Sports & Fitness",
    brand: "NordicTrack",
    tags: ["treadmill", "running", "cardio", "home-gym", "smart"],
    imageUrl: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&q=80",
    stock: 6,
    rating: 4.6,
    numReviews: 145
  },
  {
    name: "TRX Suspension Trainer",
    description: "Military-grade straps, 300+ exercises, portable design. Full-body workout anywhere.",
    price: 34999,
    category: "Sports & Fitness",
    brand: "TRX",
    tags: ["suspension", "training", "portable", "strength", "bodyweight"],
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
    stock: 35,
    rating: 4.5,
    numReviews: 278
  },
  {
    name: "Wilson Pro Staff Tennis Racket",
    description: "Roger Federer's choice. Precision and feel at the highest level of tennis.",
    price: 44999,
    category: "Sports & Fitness",
    brand: "Wilson",
    tags: ["tennis", "racket", "wilson", "professional", "sports"],
    imageUrl: "https://images.unsplash.com/photo-1617083934555-ac7b4d0c8be8?w=600&q=80",
    stock: 20,
    rating: 4.7,
    numReviews: 156
  },
  {
    name: "Osprey Atmos 65L Backpack",
    description: "Anti-Gravity suspension, adjustable harness, rain cover included. Adventure-ready.",
    price: 54999,
    category: "Sports & Fitness",
    brand: "Osprey",
    tags: ["backpack", "hiking", "outdoor", "travel", "camping"],
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    stock: 15,
    rating: 4.8,
    numReviews: 234
  },

  // ==================== BOOKS (10 products) ====================
  {
    name: "Atomic Habits by James Clear",
    description: "The #1 New York Times bestseller. Tiny changes, remarkable results. Transform your life with the power of habits.",
    price: 2499,
    category: "Books",
    brand: "Penguin",
    tags: ["self-help", "habits", "bestseller", "productivity", "motivation"],
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80",
    stock: 100,
    rating: 4.9,
    numReviews: 1234
  },
  {
    name: "The Psychology of Money",
    description: "Timeless lessons on wealth, greed, and happiness by Morgan Housel. How to think about money.",
    price: 1999,
    category: "Books",
    brand: "Harriman House",
    tags: ["finance", "money", "psychology", "investing", "bestseller"],
    imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80",
    stock: 85,
    rating: 4.8,
    numReviews: 892
  },
  {
    name: "Think and Grow Rich",
    description: "Napoleon Hill's classic guide to success. 13 principles that have created millionaires for 80+ years.",
    price: 1499,
    category: "Books",
    brand: "TarcherPerigee",
    tags: ["success", "wealth", "classic", "motivation", "business"],
    imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&q=80",
    stock: 75,
    rating: 4.7,
    numReviews: 678
  },
  {
    name: "Python Crash Course",
    description: "A hands-on, project-based introduction to programming. Best-selling Python book for beginners.",
    price: 4999,
    category: "Books",
    brand: "No Starch Press",
    tags: ["programming", "python", "coding", "technology", "learning"],
    imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&q=80",
    stock: 60,
    rating: 4.6,
    numReviews: 456
  },
  {
    name: "Sapiens: A Brief History",
    description: "Yuval Noah Harari explores the history of humankind. From Stone Age to Silicon Age.",
    price: 2999,
    category: "Books",
    brand: "Harper",
    tags: ["history", "science", "anthropology", "bestseller", "non-fiction"],
    imageUrl: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&q=80",
    stock: 70,
    rating: 4.8,
    numReviews: 789
  },
  {
    name: "Clean Code by Robert Martin",
    description: "A handbook of agile software craftsmanship. Write code that is clean, elegant, and efficient.",
    price: 5999,
    category: "Books",
    brand: "Prentice Hall",
    tags: ["programming", "software", "clean-code", "professional", "development"],
    imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80",
    stock: 45,
    rating: 4.7,
    numReviews: 567
  },
  {
    name: "The Alchemist by Paulo Coelho",
    description: "A magical story about following your dreams. The most translated book by a living author.",
    price: 1799,
    category: "Books",
    brand: "HarperOne",
    tags: ["fiction", "classic", "inspirational", "adventure", "bestseller"],
    imageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80",
    stock: 90,
    rating: 4.6,
    numReviews: 1456
  },
  {
    name: "Rich Dad Poor Dad",
    description: "Robert Kiyosaki's guide to financial freedom. What the rich teach their kids about money.",
    price: 1999,
    category: "Books",
    brand: "Plata Publishing",
    tags: ["finance", "money", "investing", "education", "bestseller"],
    imageUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&q=80",
    stock: 80,
    rating: 4.5,
    numReviews: 923
  },
  {
    name: "The 48 Laws of Power",
    description: "Robert Greene's guide to the art of power. Essential reading for ambitious minds.",
    price: 2499,
    category: "Books",
    brand: "Penguin",
    tags: ["power", "strategy", "psychology", "self-improvement", "classic"],
    imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=80",
    stock: 55,
    rating: 4.7,
    numReviews: 678
  },
  {
    name: "Steve Jobs Biography",
    description: "Walter Isaacson's exclusive biography based on interviews with Steve Jobs. The definitive story.",
    price: 3499,
    category: "Books",
    brand: "Simon & Schuster",
    tags: ["biography", "apple", "technology", "inspiration", "business"],
    imageUrl: "https://images.unsplash.com/photo-1529590003495-b2646e2718bf?w=600&q=80",
    stock: 40,
    rating: 4.8,
    numReviews: 567
  }
];

async function runSeed() {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce";
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({});
    await Category.deleteMany({});
    if (Interaction) await Interaction.deleteMany({});
    if (Order) await Order.deleteMany({});
    console.log("🗑️  Cleared existing data");

    // Seed categories with images
    const CATEGORIES = [
      {
        name: "Electronics",
        imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
        description: "Gadgets, devices, and tech essentials"
      },
      {
        name: "Fashion",
        imageUrl: "https://images.unsplash.com/photo-1488161628813-99425260addc?auto=format&fit=crop&w=800&q=80",
        description: "Clothing, accessories, and style"
      },
      {
        name: "Home & Kitchen",
        imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=800&q=80",
        description: "Appliances, furniture, and home essentials"
      },
      {
        name: "Sports & Fitness",
        imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
        description: "Equipment for sports and workout"
      },
      {
        name: "Books",
        imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
        description: "Knowledge, stories, and learning"
      }
    ];
    await Category.insertMany(CATEGORIES);
    console.log(`📁 Seeded ${CATEGORIES.length} categories`);

    // Create only ONE admin user (no demo users - fresh start)
    // Note: User model pre-save hook handles hashing, so we pass plain text
    await User.create({
      name: "Admin",
      email: "admin@sagestudio.com",
      password: "admin123",
      role: "admin"
    });
    console.log("👤 Created admin user");

    // Insert products
    await Product.insertMany(PRODUCTS);
    console.log(`✅ Seeded ${PRODUCTS.length} products`);

    // Summary
    const categories = [...new Set(PRODUCTS.map(p => p.category))];
    console.log("\n📊 Products by Category:");
    for (const cat of categories) {
      const count = PRODUCTS.filter(p => p.category === cat).length;
      console.log(`   • ${cat}: ${count} products`);
    }

    console.log("\n🔐 Admin Login:");
    console.log("   📧 admin@sagestudio.com");
    console.log("   🔑 admin123");

    console.log("\n💡 New users should register to use the site!");
    console.log("🎉 Database seeded successfully!\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
}

runSeed();