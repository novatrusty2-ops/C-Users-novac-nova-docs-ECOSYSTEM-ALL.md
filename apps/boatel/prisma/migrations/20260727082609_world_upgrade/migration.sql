-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'United Kingdom',
    "region" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'Boatel',
    "mode" TEXT NOT NULL DEFAULT 'stay',
    "lat" REAL,
    "lng" REAL,
    "pricePerNight" REAL NOT NULL,
    "capacity" INTEGER NOT NULL,
    "bedrooms" INTEGER NOT NULL DEFAULT 1,
    "bathrooms" INTEGER NOT NULL DEFAULT 1,
    "amenities" TEXT NOT NULL,
    "photos" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "captainIncluded" BOOLEAN NOT NULL DEFAULT false,
    "breakfastIncluded" BOOLEAN NOT NULL DEFAULT false,
    "cancellationPolicy" TEXT NOT NULL DEFAULT 'Flexible',
    "checkInText" TEXT NOT NULL DEFAULT '15:00',
    "checkOutText" TEXT NOT NULL DEFAULT '11:00',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "platformFee" REAL NOT NULL DEFAULT 0.1,
    "hostId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Listing_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("amenities", "capacity", "city", "createdAt", "description", "hostId", "id", "lat", "lng", "location", "photos", "platformFee", "pricePerNight", "status", "title", "updatedAt") SELECT "amenities", "capacity", "city", "createdAt", "description", "hostId", "id", "lat", "lng", "location", "photos", "platformFee", "pricePerNight", "status", "title", "updatedAt" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
