-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "photoPath" TEXT,
    "retailPriceCents" INTEGER NOT NULL DEFAULT 0,
    "suggestedPriceCents" INTEGER NOT NULL DEFAULT 0,
    "listedPriceCents" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "identifiedProduct" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("category", "costCents", "createdAt", "description", "id", "identifiedProduct", "listedPriceCents", "photoPath", "retailPriceCents", "sellerId", "status", "suggestedPriceCents", "title", "updatedAt") SELECT "category", "costCents", "createdAt", "description", "id", "identifiedProduct", "listedPriceCents", "photoPath", "retailPriceCents", "sellerId", "status", "suggestedPriceCents", "title", "updatedAt" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
CREATE INDEX "Listing_status_createdAt_idx" ON "Listing"("status", "createdAt");
CREATE INDEX "Listing_sellerId_idx" ON "Listing"("sellerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
