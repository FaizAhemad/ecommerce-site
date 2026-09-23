CREATE TABLE "SupportAttachment" (
  "id" TEXT PRIMARY KEY,
  "ticketId" TEXT NOT NULL REFERENCES "SupportTicket"("id") ON DELETE CASCADE,
  "contentType" TEXT NOT NULL,
  "data" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportAttachment_size" CHECK (length("data") <= 350000)
);
CREATE INDEX "SupportAttachment_ticketId_idx" ON "SupportAttachment"("ticketId");
