import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

type SeedListing = {
  title: string;
  tagline: string;
  description: string;
  location: string;
  city: string;
  country: string;
  region: string;
  category: string;
  mode: string;
  lat: number;
  lng: number;
  pricePerNight: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  photos: string[];
  featured?: boolean;
  captainIncluded?: boolean;
  breakfastIncluded?: boolean;
  cancellationPolicy?: string;
  checkInText?: string;
  checkOutText?: string;
  review?: string;
};

const listings: SeedListing[] = [
  {
    title: "Thames Floating Villa",
    tagline: "Skyline mornings on the river",
    description:
      "Wake to river light on a private floating villa moored near Canary Wharf. Sun deck, chef’s galley, and skyline views — stay docked or arrange a short evening cruise. Imported from the classic boatel stay model: boutique comfort, marina access, and unforgettable water nights.",
    location: "Canary Wharf Marina, London",
    city: "London",
    country: "United Kingdom",
    region: "london",
    category: "Floating villa",
    mode: "stay",
    lat: 51.5054,
    lng: -0.0235,
    pricePerNight: 420,
    capacity: 4,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["Wi‑Fi", "Kitchen", "Sun deck", "Heating", "Private bath", "Workspace"],
    photos: [
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1600&q=80",
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80",
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&q=80",
    ],
    featured: true,
    breakfastIncluded: true,
    review: "Canary Wharf from a floating villa — surreal and perfectly quiet.",
  },
  {
    title: "Cornish Sail Suite",
    tagline: "Teak cabin, harbour hush",
    description:
      "A boutique sailboat suite in Falmouth harbour. Soft linens, teak cabin, and morning coffee on the foredeck as fishing boats slide past. Ideal for couples discovering Cornwall by water.",
    location: "Falmouth Harbour, Cornwall",
    city: "Falmouth",
    country: "United Kingdom",
    region: "cornwall",
    category: "Sailboat",
    mode: "sail",
    lat: 50.152,
    lng: -5.066,
    pricePerNight: 185,
    capacity: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["Kitchenette", "Linens", "Harbour view", "Parking nearby", "Blankets"],
    photos: [
      "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80",
    ],
    featured: true,
    review: "Morning coffee on the foredeck beat any hotel balcony.",
  },
  {
    title: "Brighton Pier Yacht",
    tagline: "Salt air by the pier",
    description:
      "Sleep aboard a classic motor yacht steps from the pier. Perfect for couples seeking a weekend of seaside walks, indie coffee, and night lights on the water.",
    location: "Brighton Marina",
    city: "Brighton",
    country: "United Kingdom",
    region: "brighton",
    category: "Yacht suite",
    mode: "stay",
    lat: 50.812,
    lng: -0.1,
    pricePerNight: 240,
    capacity: 3,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["Wi‑Fi", "Shower", "BBQ", "Parking", "Bluetooth speaker"],
    photos: [
      "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=1600&q=80",
      "https://images.unsplash.com/photo-1526761122248-c31c93f8b2b9?w=1600&q=80",
    ],
    featured: true,
    review: "Felt like a boutique hotel that happened to float.",
  },
  {
    title: "Scottish Loch Boatel",
    tagline: "Mist, mountains, wood stove",
    description:
      "A quiet houseboat on Loch Lomond with misty mornings and mountain light. Wood stove evenings and kayaks at the stern for boundless loch adventures.",
    location: "Loch Lomond, Scotland",
    city: "Balloch",
    country: "United Kingdom",
    region: "scotland",
    category: "Houseboat",
    mode: "explore",
    lat: 56.002,
    lng: -4.58,
    pricePerNight: 210,
    capacity: 5,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ["Wood stove", "Kayaks", "Kitchen", "Hot water", "Blankets"],
    photos: [
      "https://images.unsplash.com/photo-1468413253725-0d5181091126?w=1600&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
    ],
    review: "Silence, horizon, and a stove — exactly the reset I needed.",
  },
  {
    title: "Devon Coastal Catamaran",
    tagline: "Twin hulls, wide sunset deck",
    description:
      "Spacious catamaran berth in Salcombe. Twin hulls mean stable nights and a wide trampoline deck for sunset lounging with the whole crew.",
    location: "Salcombe, Devon",
    city: "Salcombe",
    country: "United Kingdom",
    region: "cornwall",
    category: "Catamaran",
    mode: "sail",
    lat: 50.237,
    lng: -3.769,
    pricePerNight: 310,
    capacity: 6,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ["Wi‑Fi", "Full kitchen", "Outdoor cushions", "Tender", "Snorkel kit"],
    photos: [
      "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=1600&q=80",
      "https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=1600&q=80",
    ],
    captainIncluded: true,
    featured: true,
    review: "Stable, spacious, stocked — kids never wanted to leave.",
  },
  {
    title: "Isle of Wight Cabin Cruiser",
    tagline: "Cowes race-week energy",
    description:
      "Compact cabin cruiser in Cowes — race-week buzz or quiet midweek tides. Ideal solo or couple base for island exploring.",
    location: "Cowes Marina, Isle of Wight",
    city: "Cowes",
    country: "United Kingdom",
    region: "brighton",
    category: "Cabin cruiser",
    mode: "explore",
    lat: 50.762,
    lng: -1.3,
    pricePerNight: 145,
    capacity: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["Kitchenette", "Shower block nearby", "Bike storage"],
    photos: [
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&q=80",
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1600&q=80",
    ],
    review: "Perfect launchpad for island days and harbour nights.",
  },
  {
    title: "Monaco Harbour Suite",
    tagline: "Mediterranean polish",
    description:
      "A yacht suite on Port Hercules with soft Mediterranean light and café mornings a short walk from the pontoon. Stay mode luxury with optional captain evenings.",
    location: "Port Hercules, Monaco",
    city: "Monaco",
    country: "Monaco",
    region: "monaco",
    category: "Yacht suite",
    mode: "stay",
    lat: 43.735,
    lng: 7.425,
    pricePerNight: 890,
    capacity: 4,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["Wi‑Fi", "Air conditioning", "Champagne fridge", "Linens", "Concierge tips"],
    photos: [
      "https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=1600&q=80",
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1600&q=80",
    ],
    featured: true,
    captainIncluded: true,
    breakfastIncluded: true,
    cancellationPolicy: "Moderate",
    review: "Harbour mornings in Monaco — worth every pound.",
  },
  {
    title: "Maldives Lagoon Boatel",
    tagline: "Turquoise at the transom",
    description:
      "Lagoon boatel energy with reef snorkelling off the stern and sunrise swims. Floating-villa comfort in the warm Indian Ocean.",
    location: "South Malé Atoll",
    city: "Malé",
    country: "Maldives",
    region: "maldives",
    category: "Floating villa",
    mode: "stay",
    lat: 4.175,
    lng: 73.509,
    pricePerNight: 760,
    capacity: 4,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["Snorkel kit", "Outdoor shower", "Kayaks", "Solar power", "Mosquito nets"],
    photos: [
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80",
    ],
    featured: true,
    breakfastIncluded: true,
    cancellationPolicy: "Strict",
    review: "Woke up and stepped into turquoise. Unreal.",
  },
  {
    title: "Amalfi Coast Sail Night",
    tagline: "Lemon light & cliff harbours",
    description:
      "Overnight sail along the Amalfi coast — cliff towns, limoncello sunsets, and a private cabin when the wind softens.",
    location: "Amalfi Harbour",
    city: "Amalfi",
    country: "Italy",
    region: "amalfi",
    category: "Sailboat",
    mode: "sail",
    lat: 40.634,
    lng: 14.602,
    pricePerNight: 390,
    capacity: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ["Captain option", "Deck dining", "Cooler", "Linens"],
    photos: [
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&q=80",
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1600&q=80",
    ],
    captainIncluded: true,
    featured: true,
    review: "Sailed into Positano light — unforgettable evening.",
  },
  {
    title: "Dubai Marina Yacht",
    tagline: "Desert sunset deck",
    description:
      "Glass-tower views from a marina yacht suite. Stay aboard for skyline nights or book a sail mode evening along the Gulf.",
    location: "Dubai Marina",
    city: "Dubai",
    country: "United Arab Emirates",
    region: "dubai",
    category: "Yacht suite",
    mode: "stay",
    lat: 25.08,
    lng: 55.14,
    pricePerNight: 520,
    capacity: 6,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ["Wi‑Fi", "Air conditioning", "BBQ", "Jet ski tip sheet", "Parking"],
    photos: [
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80",
      "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b2?w=1600&q=80",
    ],
    captainIncluded: true,
    review: "Sunset over the marina towers from our own deck.",
  },
  {
    title: "Stockholm Archipelago Houseboat",
    tagline: "Nordic islands, slow mornings",
    description:
      "A warm timber houseboat in the Stockholm archipelago — sauna nearby, cinnamon rolls on the quay, endless island hops.",
    location: "Vaxholm, Stockholm Archipelago",
    city: "Stockholm",
    country: "Sweden",
    region: "stockholm",
    category: "Houseboat",
    mode: "explore",
    lat: 59.403,
    lng: 18.353,
    pricePerNight: 275,
    capacity: 5,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ["Heating", "Kitchen", "Fishing gear", "Blankets", "Wi‑Fi"],
    photos: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
      "https://images.unsplash.com/photo-1468413253725-0d5181091126?w=1600&q=80",
    ],
    review: "Nordic light and quiet islands — we’ll return in winter.",
  },
  {
    title: "Santorini Caldera Sail",
    tagline: "White cliffs, wine-dark sea",
    description:
      "Evening sail beneath the caldera with overnight berth options. Explore mode by day, yacht suite comfort by night.",
    location: "Athinio Port, Santorini",
    city: "Santorini",
    country: "Greece",
    region: "santorini",
    category: "Sailboat",
    mode: "sail",
    lat: 36.393,
    lng: 25.461,
    pricePerNight: 430,
    capacity: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ["Captain included", "Wine cooler", "Snorkel kit", "Sun cushions"],
    photos: [
      "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1600&q=80",
      "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80",
    ],
    captainIncluded: true,
    featured: true,
    breakfastIncluded: true,
    review: "Caldera sunset from the water — better than any cliff hotel.",
  },
];

async function main() {
  await prisma.contactMessage.deleteMany();
  await prisma.review.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash("password123", 10);

  const host = await prisma.user.create({
    data: {
      name: "Maya Harbour",
      email: "host@boatel.local",
      passwordHash,
      role: Role.HOST,
    },
  });

  const guest = await prisma.user.create({
    data: {
      name: "Alex Tide",
      email: "guest@boatel.local",
      passwordHash,
      role: Role.GUEST,
    },
  });

  for (const item of listings) {
    const listing = await prisma.listing.create({
      data: {
        title: item.title,
        tagline: item.tagline,
        description: item.description,
        location: item.location,
        city: item.city,
        country: item.country,
        region: item.region,
        category: item.category,
        mode: item.mode,
        lat: item.lat,
        lng: item.lng,
        pricePerNight: item.pricePerNight,
        capacity: item.capacity,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        amenities: JSON.stringify(item.amenities),
        photos: JSON.stringify(item.photos),
        featured: Boolean(item.featured),
        captainIncluded: Boolean(item.captainIncluded),
        breakfastIncluded: Boolean(item.breakfastIncluded),
        cancellationPolicy: item.cancellationPolicy ?? "Flexible",
        checkInText: item.checkInText ?? "15:00",
        checkOutText: item.checkOutText ?? "11:00",
        hostId: host.id,
        platformFee: 0.1,
      },
    });

    if (item.review) {
      await prisma.review.create({
        data: {
          listingId: listing.id,
          authorId: guest.id,
          rating: 5,
          comment: item.review,
        },
      });
    }
  }

  console.log("Seeded host@boatel.local / guest@boatel.local (password123)");
  console.log(`Created ${listings.length} world listings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
