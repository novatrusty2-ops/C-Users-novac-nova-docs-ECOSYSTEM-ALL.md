/** Copy and destination data adapted from boatel.world product surface. */

export const brand = {
  name: "Boatel",
  tagline: "Any boat, anytime",
  headline: "Sail, stay, or explore — your choice",
  lede:
    "Choose from floating villas, yacht suites, and boutique boatels across stunning locations.",
  supportEmail: "info@boatel.world",
  supportPhone: "+44 7547 049846",
  address: "College House, 2nd Floor, 17 King Edwards Road, HA4 7AE London",
};

export const modes = [
  {
    id: "stay",
    title: "Stay",
    text: "Sleep on the water in floating villas, yacht suites, and harbour boatels.",
  },
  {
    id: "sail",
    title: "Sail",
    text: "Cast off with a captain or skipper for sunsets, coastal hops, and open water.",
  },
  {
    id: "explore",
    title: "Explore",
    text: "Day adventures, marina hopping, and boundless routes from city to sea.",
  },
] as const;

export const howItWorks = [
  {
    step: "01",
    title: "Discover your dream stay",
    text: "Search by city, marina, or address. Filter by stay, sail, or explore — then compare floating homes.",
  },
  {
    step: "02",
    title: "Book with confidence",
    text: "See capacity, amenities, check-in times, and cancellation policy before you confirm your nights aboard.",
  },
  {
    step: "03",
    title: "Live the reality, sail the dream",
    text: "Arrive at the marina, meet your host, and wake to water light — any boat, anytime.",
  },
] as const;

export const useCases = [
  {
    title: "Romantic weekend",
    text: "Yacht suites and sail cabins for couples who want salt air without a hotel lobby.",
  },
  {
    title: "City water escape",
    text: "London, Brighton, and harbour boatels minutes from restaurants — with a private deck.",
  },
  {
    title: "Family adventure",
    text: "Spacious catamarans and houseboats with room to cook, play, and watch the tide.",
  },
  {
    title: "Corporate retreat",
    text: "Charter a floating meeting room — captain included options for coastal team days.",
  },
  {
    title: "Solo reset",
    text: "Quiet loch boatels and cabin cruisers when you need silence and a horizon.",
  },
  {
    title: "Host income",
    text: "List your boat, set availability, and welcome guests looking for nights on the water.",
  },
] as const;

export const platformReviews = [
  {
    name: "Elena M.",
    place: "Brighton",
    rating: 5,
    body: "Felt like a boutique hotel that happened to float. Check-in was effortless.",
  },
  {
    name: "James K.",
    place: "Falmouth",
    rating: 5,
    body: "Morning coffee on the foredeck beat any Airbnb balcony. We’ll sail again.",
  },
  {
    name: "Sofia R.",
    place: "London",
    rating: 5,
    body: "Canary Wharf skyline from a floating villa — surreal and perfectly quiet.",
  },
  {
    name: "Omar H.",
    place: "Salcombe",
    rating: 5,
    body: "The catamaran was stable, spacious, and stocked. Kids never wanted to leave.",
  },
] as const;

export const destinations = [
  {
    slug: "london",
    name: "London",
    country: "United Kingdom",
    blurb: "River villas and marina suites with skyline mornings.",
    image:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&q=80",
  },
  {
    slug: "brighton",
    name: "Brighton",
    country: "United Kingdom",
    blurb: "Pier-side yachts and seaside walks from the pontoon.",
    image:
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80",
  },
  {
    slug: "cornwall",
    name: "Cornwall",
    country: "United Kingdom",
    blurb: "Harbour sail suites and Atlantic light in Falmouth.",
    image:
      "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80",
  },
  {
    slug: "scotland",
    name: "Scotland",
    country: "United Kingdom",
    blurb: "Loch boatels, mist, mountains, and wood-stove evenings.",
    image:
      "https://images.unsplash.com/photo-1468413253725-0d5181091126?w=1600&q=80",
  },
  {
    slug: "monaco",
    name: "Monaco",
    country: "Monaco",
    blurb: "Mediterranean yacht suites steps from the harbour.",
    image:
      "https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=1600&q=80",
  },
  {
    slug: "maldives",
    name: "Maldives",
    country: "Maldives",
    blurb: "Overwater energy — lagoon boatels and turquoise stays.",
    image:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&q=80",
  },
  {
    slug: "amalfi",
    name: "Amalfi Coast",
    country: "Italy",
    blurb: "Cliff-harbour nights and lemon-bright Mediterranean sails.",
    image:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&q=80",
  },
  {
    slug: "dubai",
    name: "Dubai",
    country: "United Arab Emirates",
    blurb: "Marina yacht suites with desert-sunset decks.",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80",
  },
] as const;

export const categories = [
  "Floating villa",
  "Yacht suite",
  "Sailboat",
  "Houseboat",
  "Catamaran",
  "Cabin cruiser",
  "Boatel",
] as const;

export const legal = {
  privacy: {
    title: "Privacy Policy",
    updated: "27 July 2026",
    sections: [
      {
        heading: "Who we are",
        body: "Boatel operates a marketplace connecting guests with hosts offering floating stays. Contact: info@boatel.world.",
      },
      {
        heading: "What we collect",
        body: "Account details (name, email), booking dates, listing content you publish, and messages you send to support.",
      },
      {
        heading: "How we use data",
        body: "To run bookings, show listings, improve the product, and respond to support requests. We do not sell personal data.",
      },
      {
        heading: "Cookies",
        body: "We use essential cookies for sign-in sessions. See the Cookies Policy for details.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "27 July 2026",
    sections: [
      {
        heading: "Marketplace role",
        body: "Boatel provides the platform. Hosts are responsible for vessel condition, safety, and local regulations. Guests must follow marina and host rules.",
      },
      {
        heading: "Bookings",
        body: "MVP bookings confirm without card capture. When payments go live, refunds follow each listing’s cancellation policy.",
      },
      {
        heading: "Acceptable use",
        body: "No illegal activity, harassment, or fraudulent listings. We may suspend accounts that harm guests, hosts, or the platform.",
      },
    ],
  },
  cookies: {
    title: "Cookies Policy",
    updated: "27 July 2026",
    sections: [
      {
        heading: "Essential cookies",
        body: "Session cookies keep you signed in and secure forms. These are required for the site to work.",
      },
      {
        heading: "Analytics",
        body: "We may add privacy-friendly analytics later. You will see an updated notice before non-essential cookies are used.",
      },
    ],
  },
} as const;
