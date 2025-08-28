-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApiLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "queryParams" JSONB,
    "body" JSONB,
    "userAgent" TEXT,
    "ipAddress" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT,
    "statusCode" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "message" TEXT NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "responseSize" INTEGER,
    "errorDetails" JSONB,

    CONSTRAINT "ApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "ApiLog_timestamp_idx" ON "public"."ApiLog"("timestamp");

-- CreateIndex
CREATE INDEX "ApiLog_userId_idx" ON "public"."ApiLog"("userId");

-- CreateIndex
CREATE INDEX "ApiLog_path_idx" ON "public"."ApiLog"("path");

-- CreateIndex
CREATE INDEX "ApiLog_requestId_idx" ON "public"."ApiLog"("requestId");

-- AddForeignKey
ALTER TABLE "public"."ApiLog" ADD CONSTRAINT "ApiLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
