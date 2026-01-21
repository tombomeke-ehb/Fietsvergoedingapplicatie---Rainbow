-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "bikeType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "fullCommuteKm" REAL NOT NULL,
    "partialCommuteKm" REAL NOT NULL,
    CONSTRAINT "EmployeeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CountrySettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "country" TEXT NOT NULL,
    "ratePerKm" REAL NOT NULL,
    "deadlineDayNextMonth" INTEGER NOT NULL,
    "capType" TEXT NOT NULL DEFAULT 'NONE',
    "monthlyCapAmount" REAL,
    "yearlyCapAmount" REAL,
    "beBlockAfterCap" BOOLEAN NOT NULL DEFAULT true,
    "exportDayOfMonth" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TripEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "tripType" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "kmSnapshot" REAL NOT NULL,
    "amountSnapshot" REAL NOT NULL,
    "fiscalStatusSnapshot" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TripEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MonthlyExport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "totalKm" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "totalTaxFreeAmount" REAL,
    "totalTaxedAmount" REAL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MonthlyExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_userId_key" ON "EmployeeProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CountrySettings_country_key" ON "CountrySettings"("country");

-- CreateIndex
CREATE INDEX "TripEntry_userId_date_idx" ON "TripEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TripEntry_userId_date_sequence_key" ON "TripEntry"("userId", "date", "sequence");

-- CreateIndex
CREATE INDEX "MonthlyExport_yearMonth_idx" ON "MonthlyExport"("yearMonth");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyExport_userId_yearMonth_key" ON "MonthlyExport"("userId", "yearMonth");
