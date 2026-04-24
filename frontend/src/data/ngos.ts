export interface NGO {
  _id?: string;
  id: string;
  name: string;
  area: string;
  city: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone: string;
  email: string;
  website: string;
  cause: string;
  distanceKm: number;
  estimatedTravelTime?: string;
  serviceRadiusKm?: number;
  acceptedCategories?: Array<"junk" | "normal" | "healthy">;
  maxPickupQuantityKg?: number;
  rating: number;
  mealsServed: number;
  description: string;
  image: string;
}

export const NGOS: NGO[] = [
  {
    id: "ngo1",
    name: "Roti Bank Foundation",
    area: "Andheri West",
    city: "Mumbai",
    address: "Andheri West, Mumbai, Maharashtra",
    lat: 19.1363,
    lng: 72.8277,
    phone: "+91 98201 11122",
    email: "contact@rotibank.org",
    website: "https://rotibank.org",
    cause: "Hunger relief & daily meals",
    distanceKm: 1.2,
    serviceRadiusKm: 8,
    acceptedCategories: ["healthy", "normal", "junk"],
    maxPickupQuantityKg: 80,
    rating: 4.8,
    mealsServed: 124000,
    description: "Picks up surplus food from kitchens and distributes to slums in Andheri & Bandra.",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600",
  },
  {
    id: "ngo2",
    name: "Feeding India - Mumbai Chapter",
    area: "Bandra East",
    city: "Mumbai",
    address: "Bandra East, Mumbai, Maharashtra",
    lat: 19.0551,
    lng: 72.8465,
    phone: "+91 98765 22233",
    email: "mumbai@feedingindia.org",
    website: "https://feedingindia.org",
    cause: "Zero hunger, child nutrition",
    distanceKm: 2.4,
    serviceRadiusKm: 12,
    acceptedCategories: ["healthy", "normal"],
    maxPickupQuantityKg: 150,
    rating: 4.9,
    mealsServed: 980000,
    description: "Pan-India movement working with restaurants and event venues to redirect surplus food.",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600",
  },
  {
    id: "ngo3",
    name: "Annapurna Seva Trust",
    area: "Dadar",
    city: "Mumbai",
    address: "Dadar, Mumbai, Maharashtra",
    lat: 19.0178,
    lng: 72.8478,
    phone: "+91 99300 44455",
    email: "info@annapurnaseva.in",
    website: "https://annapurnaseva.in",
    cause: "Elderly & street children",
    distanceKm: 3.1,
    serviceRadiusKm: 10,
    acceptedCategories: ["healthy", "normal"],
    maxPickupQuantityKg: 60,
    rating: 4.7,
    mealsServed: 56000,
    description: "Daily kitchens for senior citizens and street children across central Mumbai.",
    image: "https://images.unsplash.com/photo-1593113616828-6f22bca04804?w=600",
  },
  {
    id: "ngo4",
    name: "Helping Hands Society",
    area: "Powai",
    city: "Mumbai",
    address: "Powai, Mumbai, Maharashtra",
    lat: 19.1176,
    lng: 72.906,
    phone: "+91 91111 88899",
    email: "hello@helpinghands.org.in",
    website: "https://helpinghands.org.in",
    cause: "Disaster response & daily meals",
    distanceKm: 4.6,
    serviceRadiusKm: 15,
    acceptedCategories: ["healthy", "normal", "junk"],
    maxPickupQuantityKg: 120,
    rating: 4.6,
    mealsServed: 38000,
    description: "Rapid pickup teams across eastern suburbs. 24x7 hotline.",
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600",
  },
  {
    id: "ngo5",
    name: "Aahaar Daan",
    area: "Goregaon",
    city: "Mumbai",
    address: "Goregaon, Mumbai, Maharashtra",
    lat: 19.1646,
    lng: 72.8493,
    phone: "+91 90909 33344",
    email: "team@aahaardaan.org",
    website: "https://aahaardaan.org",
    cause: "Food rescue & redistribution",
    distanceKm: 5.2,
    serviceRadiusKm: 10,
    acceptedCategories: ["normal", "junk"],
    maxPickupQuantityKg: 90,
    rating: 4.5,
    mealsServed: 22000,
    description: "Volunteer-driven NGO partnering with weddings and caterers for food rescue.",
    image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600",
  },
  {
    id: "ngo6",
    name: "Khushiyaan Foundation",
    area: "Thane",
    city: "Mumbai",
    address: "Thane West, Maharashtra",
    lat: 19.2183,
    lng: 72.9781,
    phone: "+91 92929 77788",
    email: "connect@khushiyaan.org",
    website: "https://khushiyaan.org",
    cause: "Children, education & meals",
    distanceKm: 6.8,
    serviceRadiusKm: 18,
    acceptedCategories: ["healthy", "normal"],
    maxPickupQuantityKg: 110,
    rating: 4.7,
    mealsServed: 45000,
    description: "Combines education with daily nutrition for underprivileged children in Thane.",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600",
  },
];

export const IMPACT_STORIES = [
  {
    id: "s1",
    title: "A warm meal brought smiles in Andheri",
    body: "A donation of 5 kg of rice and dal was distributed to 20 families in Andheri East through Roti Bank Foundation. Volunteers shared photos of children eating their first proper dinner in days.",
    date: "Yesterday",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=900",
    source: "Roti Bank Foundation",
  },
  {
    id: "s2",
    title: "How sharing food changes lives",
    body: "Meet Ramesh — a daily wage worker who received a nutritious meal thanks to a donor like you. He says it gave him strength to go look for work the next morning.",
    date: "3 days ago",
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=900",
    source: "Feeding India",
  },
  {
    id: "s3",
    title: "100 meals shared this month in Mumbai",
    body: "Together, donors in Mumbai have shared over 100 meals this month alone. The momentum is building — and every plate counts.",
    date: "1 week ago",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900",
    source: "BhojanSetu Network",
  },
  {
    id: "s4",
    title: "Wedding leftovers feed 200 children",
    body: "A South Mumbai wedding party donated their entire surplus buffet — 200 children at a Dadar shelter had a full dinner that night.",
    date: "2 weeks ago",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900",
    source: "Annapurna Seva Trust",
  },
];

export const SLIDESHOW_IMAGES = [
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200",
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200",
  "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1200",
  "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1200",
  "https://images.unsplash.com/photo-1593113616828-6f22bca04804?w=1200",
];
