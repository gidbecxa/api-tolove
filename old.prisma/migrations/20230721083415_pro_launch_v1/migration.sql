-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('male', 'female', 'neutre');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "TypeMatch" AS ENUM ('boost', 'normal');

-- CreateEnum
CREATE TYPE "LastMessageStatus" AS ENUM ('pending', 'send', 'unsend', 'received', 'read');

-- CreateEnum
CREATE TYPE "TypeMessage" AS ENUM ('image', 'gift', 'text', 'custom');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('pending', 'send', 'unsend', 'received', 'read');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "username" TEXT,
    "photoProfil" TEXT,
    "birthday" TIMESTAMP(3),
    "horoscope" TEXT,
    "hobbies" JSONB,
    "langage" JSONB,
    "description" TEXT,
    "preference" JSONB,
    "genre" "Genre",
    "coins" INTEGER NOT NULL DEFAULT 0,
    "isCertified" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isFake" BOOLEAN NOT NULL DEFAULT false,
    "longitude" DECIMAL(65,30),
    "latitude" DECIMAL(65,30),
    "pays" TEXT,
    "villes" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "isVideoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isLockEnabled" BOOLEAN NOT NULL DEFAULT false,
    "firstOtherPhoto" TEXT,
    "secondOtherPhoto" TEXT,
    "thirdOtherPhoto" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "deviceToken" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "fromId" INTEGER NOT NULL,
    "toId" INTEGER NOT NULL,
    "isConfirm" BOOLEAN NOT NULL DEFAULT false,
    "typeMatch" "TypeMatch" NOT NULL DEFAULT 'normal',

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fromNotifiedId" INTEGER NOT NULL,
    "toNotifiedId" INTEGER NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" SERIAL NOT NULL,
    "participant" JSONB NOT NULL,
    "lastMessage" VARCHAR(1000),
    "lastMessageSender" INTEGER,
    "lastMessageStatus" "LastMessageStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "contenu" VARCHAR(1000) NOT NULL,
    "title" TEXT,
    "mediaUrl" TEXT,
    "typeMessage" "TypeMessage" NOT NULL DEFAULT 'text',
    "sender" INTEGER NOT NULL,
    "dateMessage" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'pending',
    "chatId" INTEGER NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gift" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prix" DECIMAL(65,30) NOT NULL,
    "image" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocketMapping" (
    "id" SERIAL NOT NULL,
    "socketId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "SocketMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LockedConversation" (
    "id" SERIAL NOT NULL,
    "initiatorId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,

    CONSTRAINT "LockedConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SocketMapping_socketId_key" ON "SocketMapping"("socketId");

-- CreateIndex
CREATE UNIQUE INDEX "SocketMapping_userId_key" ON "SocketMapping"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LockedConversation_initiatorId_receiverId_key" ON "LockedConversation"("initiatorId", "receiverId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_fromNotifiedId_fkey" FOREIGN KEY ("fromNotifiedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_toNotifiedId_fkey" FOREIGN KEY ("toNotifiedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "ChatRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocketMapping" ADD CONSTRAINT "SocketMapping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LockedConversation" ADD CONSTRAINT "LockedConversation_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LockedConversation" ADD CONSTRAINT "LockedConversation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
