import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const listings = [
  {
    title: "Thames Floating Villa",
    description:
      "Wake to river light on a private floating villa moored near Canary Wharf. Sun deck, chef’s galley, and skyline views — stay docked or arrange a short evening cruise.",
    location: "Canary Wharf Marina, London",
    city: "London",
    lat: 51.5054,
    lng: -0.0235,
    pricePerNight: 420,
    capacity: 4,
    amenities: ["Wi‑Fi", "Kitchen", "Sun deck", "Heating", "Private bath"],
    photos: [
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1600&q=80",
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80",
    ],
  },
  {
    title: "Cornish Sail Suite",
    description:
      "A boutique sailboat suite in Falmouth harbour. Soft linens, teak cabin, and morning coffee on the foredeck as fishing boats slide past.",
    location: "Falmouth Harbour, Cornwall",
    city: "Falmouth",
    lat: 50.152,
    lng: -5.066,
    pricePerNight: 185,
    capacity: 2,
    amenities: ["Kitchenette", "Linens", "Harbour view", "Parking nearby"],
    photos: [
      "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80",
    ],
  },
  {
    title: "Brighton Pier Yacht",
    description:
      "Sleep aboard a classic motor yacht steps from the pier. Perfect for couples seeking a weekend of salt air and seaside walks.",
    location: "Brighton Marina",
    city: "Brighton",
    lat: 50.812,
    lng: -0.1,
    pricePerNight: 240,
    capacity: 3,
    amenities: ["Wi‑Fi", "Shower", "BBQ", "Parking"],
    photos: [
      "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=1600&q=80",
      "https://images.unsplash.com/photo-1526761122248-c31c93f8b2b9?w=1600&q=80",
    ],
  },
  {
    title: "Scottish Loch Boatel",
    description:
      "A quiet houseboat on Loch Lomond with misty mornings and mountain light. Wood stove evenings and kayaks at the stern.",
    location: "Loch Lomond, Scotland",
    city: "Balloch",
    lat: 56.002,
    lng: -4.58,
    pricePerNight: 210,
    capacity: 5,
    amenities: ["Wood stove", "Kayaks", "Kitchen", "Hot water"],
    photos: [
      "https://images.unsplash.com/photo-1468413253725-0d5181091126?w=1600&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
    ],
  },
  {
    title: "Devon Coastal Catamaran",
    description:
      "Spacious catamaran berth in Salcombe. Twin hulls mean stable nights and a wide trampoline deck for sunset lounging.",
    location: "Salcombe, Devon",
    city: "Salcombe",
    lat: 50.237,
    lng: -3.769,
    pricePerNight: 310,
    capacity: 6,
    amenities: ["Wi‑Fi", "Full kitchen", "Outdoor cushions", "Tender"],
    photos: [
      "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=1600&q=80",
      "https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=1600&q=80",
    ],
  },
  {
    title: "Isle of Wight Cabin Cruiser",
    description:
      "Compact cabin cruiser in Cowes — race-week buzz or quiet midweek tides. Ideal solo or couple base for island exploring.",
    location: "Cowes Marina, Isle of Wight",
    city: "Cowes",
    lat: 50.762,
    lng: -1.3,
    pricePerNight: 145,
    capacity: 2,
    amenities: ["Kitchenette", "Shower block nearby", "Bike storage"],
    photos: [
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&q=80",
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1600&q=80",
    ],
  },
];

async function main() {
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
        description: item.description,
        location: item.location,
        city: item.city,
        lat: item.lat,
        lng: item.lng,
        pricePerNight: item.pricePerNight,
        capacity: item.capacity,
        amenities: JSON.stringify(item.amenities),
        photos: JSON.stringify(item.photos),
        hostId: host.id,
        platformFee: 0.1,
      },
    });

    await prisma.review.create({
      data: {
        listingId: listing.id,
        authorId: guest.id,
        rating: 5,
        comment: "Unforgettable night on the water — will book again.",
      },
    });
  }

  console.log("Seeded host@boatel.local / guest@boatel.local (password123)");
  console.log(`Created ${listings.length} listings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
