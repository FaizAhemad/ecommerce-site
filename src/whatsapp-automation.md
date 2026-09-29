I want you to act as a Senior Solution Architect, AI Engineer, Full-Stack Developer, DevOps Engineer, and Security Engineer.

I am building an ecommerce platform and I receive product information through WhatsApp. These WhatsApp messages may contain:

- Product name
- Product description
- Price
- Discount price
- Brand
- Category
- Quantity
- SKU or product code
- Specifications
- Variants
- Colors
- Sizes
- Seller/supplier information
- Images
- Videos
- Documents
- Multiple messages belonging to the same product

I want to automate the complete process of extracting this information from WhatsApp and converting it into structured ecommerce product data.

IMPORTANT CONTEXT

Currently, I use a personal WhatsApp number.

I do NOT currently have WhatsApp Business API configured.

Therefore, I want the system to support two phases.

PHASE 1:
Process exported WhatsApp chats manually.

PHASE 2:
Later integrate with the official Meta WhatsApp Business Platform for fully automated incoming-message processing.

Do NOT use unofficial WhatsApp automation libraries that could result in account blocking or violate WhatsApp policies unless you clearly identify them as experimental and explain the risk.

My preferred technology stack is:

Frontend:
- React
- TypeScript
- Vite
- Material UI

Backend:
- Node.js
- Express
- TypeScript

Database:
- Prisma ORM
- PostgreSQL or another suitable relational database

AI:
- OpenAI multimodal/vision-capable models or another suitable AI service

Storage:
- Azure Blob Storage, Cloudflare R2, AWS S3, or another object-storage solution

Automation:
- Node.js workers
- BullMQ/Redis if required
- n8n may be used where useful

Excel:
- ExcelJS or XLSX

My ecommerce project already uses React, Node.js/Express, Prisma, and TypeScript, so prefer solutions that integrate cleanly with this architecture.

==================================================
PRIMARY GOAL
==================================================

Build a complete WhatsApp Product Import and Automation System.

The system should be capable of:

1. Accepting exported WhatsApp ZIP files.

2. Extracting:
   - _chat.txt
   - Images
   - Videos
   - Documents
   - Other attachments

3. Parsing WhatsApp messages.

4. Identifying which messages belong to which product.

5. Associating images/videos with the correct product.

6. Using AI to convert unstructured WhatsApp messages into structured product data.

7. Allowing the user to review and correct the extracted information.

8. Exporting the final data into Excel.

9. Storing media in organized folders or object storage.

10. Eventually importing approved products directly into my ecommerce database.

==================================================
PHASE 1 — WHATSAPP CHAT IMPORT
==================================================

Build a module where the user can upload an exported WhatsApp ZIP file.

Example:

whatsapp-export.zip

Inside it may contain:

_chat.txt

IMG-20260920-WA001.jpg
IMG-20260920-WA002.jpg
VID-20260920-WA003.mp4
DOC-20260920-WA004.pdf

The system should:

- Extract the ZIP safely.
- Prevent zip-slip/path traversal attacks.
- Validate file extensions.
- Validate MIME types.
- Apply maximum upload/file-size limits.
- Reject dangerous/executable files.
- Sanitize filenames.
- Store extracted files temporarily.

==================================================
WHATSAPP MESSAGE PARSER
==================================================

Create a robust WhatsApp chat parser.

Support common WhatsApp formats such as:

12/09/2026, 10:35 - Supplier: Prestige Mixer Grinder
12/09/2026, 10:36 - Supplier: Price 3499
12/09/2026, 10:36 - Supplier: 750W, 3 jars
12/09/2026, 10:37 - Supplier: <attached: IMG-20260912-WA001.jpg>
12/09/2026, 10:37 - Supplier: <attached: IMG-20260912-WA002.jpg>

Also handle:

- Multi-line messages
- Different date formats
- 12-hour and 24-hour timestamps
- Different locales
- Android export formats
- iPhone export formats
- Group chats
- Sender names
- Missing attachments
- Deleted messages
- Captions
- Emojis
- URLs

Create a normalized message structure like:

{
  "id": "...",
  "timestamp": "...",
  "sender": "...",
  "text": "...",
  "attachments": []
}

==================================================
PRODUCT GROUPING LOGIC
==================================================

One product may be represented across multiple WhatsApp messages.

Example:

Message 1:
Prestige Mixer Grinder

Message 2:
₹3,499

Message 3:
750W
3 jars
Black

Message 4:
Image

Message 5:
Image

Message 6:
Video

The system should intelligently group these messages into one product.

Use a combination of:

- Timestamp proximity
- Sender
- Text similarity
- Product name detection
- Media proximity
- Explicit separators
- AI reasoning

Do not blindly merge messages.

Generate a confidence score for product grouping.

Example:

{
  "productGroupId": "PG-0001",
  "confidence": 0.92
}

If confidence is low, mark the product for manual review.

==================================================
AI PRODUCT EXTRACTION
==================================================

Use an AI model to convert the grouped WhatsApp messages into structured product JSON.

Target format:

{
  "productName": "",
  "brand": "",
  "category": "",
  "subcategory": "",
  "description": "",
  "shortDescription": "",
  "price": null,
  "salePrice": null,
  "currency": "INR",
  "sku": "",
  "quantity": null,
  "stockStatus": "",
  "color": [],
  "size": [],
  "specifications": {},
  "seller": "",
  "source": "WhatsApp",
  "images": [],
  "videos": [],
  "documents": [],
  "confidence": {
    "productName": 0,
    "price": 0,
    "category": 0
  }
}

IMPORTANT:

The AI must NOT invent missing information.

If information is unavailable, return null or an empty value.

For example:

{
  "brand": null
}

instead of guessing the brand.

==================================================
IMAGE ANALYSIS
==================================================

Images may contain additional product information.

Use multimodal AI where useful to detect:

- Product type
- Brand/logo
- Model number
- Product color
- Product packaging
- Labels
- Visible specifications
- Dimensions
- Text printed on packaging

Use OCR only when necessary.

Do not assume visible information is perfectly accurate.

Store confidence values.

==================================================
VIDEO PROCESSING
==================================================

Do NOT send complete large videos directly to an AI model unless required.

Instead:

1. Extract metadata.
2. Generate thumbnails.
3. Extract representative frames.
4. Optionally extract audio/transcript.
5. Analyze only useful frames.

Store:

- Original video
- Thumbnail
- Duration
- Resolution
- Video URL

==================================================
MEDIA ORGANIZATION
==================================================

Initially support local organized folders.

Example:

products/
  P000001/
    images/
      001.jpg
      002.jpg

    videos/
      001.mp4
      thumbnail.jpg

    documents/
      specification.pdf

Later support object storage.

Recommended structure:

products/{productId}/images/{uuid}.jpg
products/{productId}/videos/{uuid}.mp4
products/{productId}/documents/{uuid}.pdf

Database should store URLs, not binary files.

==================================================
PRODUCT REVIEW UI
==================================================

Create an admin interface.

Workflow:

Upload WhatsApp ZIP
↓
Process Chat
↓
Detect Products
↓
AI Extraction
↓
Review Products
↓
Approve / Reject / Edit
↓
Export Excel
↓
Import into Ecommerce

Create pages/components for:

1. WhatsApp Import
2. Processing Status
3. Product Review
4. Media Preview
5. Validation Errors
6. Import History

For every detected product display:

- Product name
- Description
- Price
- Category
- Specifications
- Images
- Videos
- Original WhatsApp messages
- Confidence score

Allow:

- Editing fields
- Removing incorrect images
- Adding missing images
- Merging products
- Splitting products
- Rejecting products
- Approving products

==================================================
EXCEL EXPORT
==================================================

Create products.xlsx.

Suggested columns:

Product ID
Product Name
Brand
Category
Subcategory
Description
Price
Sale Price
Currency
SKU
Quantity
Stock Status
Color
Size
Specifications
Image URLs
Video URLs
Document URLs
WhatsApp Sender
WhatsApp Timestamp
Import Batch ID
AI Confidence
Review Status

Do NOT embed large images/videos directly in Excel.

Use URLs or relative file paths.

==================================================
DATABASE DESIGN
==================================================

Design Prisma models for:

ImportBatch
WhatsAppMessage
ProductCandidate
Product
ProductMedia
ProductAttribute
ProcessingJob
AIExtractionResult

Include relationships.

Example concept:

ImportBatch
 ├── WhatsAppMessages
 ├── ProductCandidates
 └── ProcessingJobs

ProductCandidate
 ├── Messages
 ├── Media
 ├── AIExtraction
 └── ReviewStatus

==================================================
BACKGROUND JOB PROCESSING
==================================================

Large imports should NOT block HTTP requests.

Design background workers.

Recommended flow:

API
↓
Queue
↓
Worker
↓
ZIP extraction
↓
Chat parsing
↓
Product grouping
↓
AI extraction
↓
Media processing
↓
Database update

Use BullMQ + Redis if appropriate.

Possible job types:

WHATSAPP_IMPORT
MEDIA_PROCESSING
AI_EXTRACTION
EXCEL_EXPORT
PRODUCT_IMPORT

Include:

- Retry mechanism
- Dead-letter handling
- Job progress
- Error logging
- Idempotency

==================================================
DUPLICATE PRODUCT DETECTION
==================================================

Before importing a product into ecommerce, detect duplicates.

Possible checks:

- SKU
- Product code
- Product name
- Brand
- Image similarity
- Supplier
- Existing ecommerce product

Show possible duplicates to the user.

Do NOT automatically overwrite existing products.

==================================================
SECURITY
==================================================

Security is very important.

Implement:

- Upload file validation
- MIME validation
- Filename sanitization
- ZIP bomb protection
- Zip-slip protection
- Maximum file limits
- Malware scanning where practical
- Authentication
- Authorization
- Rate limiting
- Secure temporary storage
- Signed media URLs
- Audit logging
- Encryption where applicable
- Environment variables for secrets
- API key protection
- Input sanitization

Never expose AI API keys or storage credentials in the frontend.

==================================================
PRIVACY
==================================================

WhatsApp exports may contain private conversations.

Therefore:

- Only process explicitly uploaded chats.
- Do not process unrelated conversations unnecessarily.
- Allow the user to delete an import.
- Delete temporary extracted files after processing.
- Avoid storing unnecessary personal information.
- Mask phone numbers where possible.
- Create configurable retention policies.

==================================================
PHASE 2 — OFFICIAL WHATSAPP AUTOMATION
==================================================

After Phase 1 works, design Phase 2 using the official Meta WhatsApp Business Platform / WhatsApp Cloud API.

Expected architecture:

Supplier
↓
WhatsApp Business
↓
Meta WhatsApp Webhook
↓
Backend API
↓
Message Processor
↓
Media Downloader
↓
AI Product Extraction
↓
Product Candidate
↓
Admin Approval
↓
Ecommerce Database

Explain:

- How Meta webhooks work
- Webhook verification
- Message events
- Media IDs
- Media download
- Access tokens
- WhatsApp Business Account
- Phone number requirements
- Template messages
- Messaging windows
- Security considerations

Do NOT suggest unofficial WhatsApp-Web scraping as the production architecture.

==================================================
PERSONAL WHATSAPP NUMBER
==================================================

I currently use my personal WhatsApp number.

Explain clearly:

1. What is safe to automate with a personal WhatsApp account.

2. What should NOT be automated.

3. Whether exported-chat processing is safe.

4. Whether I should create a separate business number.

5. How I could migrate to WhatsApp Business later.

My preference is:

Personal WhatsApp
→ Continue normal personal use.

Separate Business Number
→ Suppliers
→ Product submissions
→ Automation.

==================================================
FUTURE FEATURE — SUPPLIER PRODUCT SUBMISSION
==================================================

Eventually I want suppliers/friends to submit products through WhatsApp.

For example:

ADD PRODUCT

Name: Smart Mop
Price: 1499
Category: Cleaning
Stock: 10

+ Images
+ Video

The AI should extract this and generate a ProductCandidate.

The product must NOT automatically become public.

Workflow:

Supplier submission
↓
AI extraction
↓
Validation
↓
Duplicate check
↓
Admin approval
↓
Publish

==================================================
FUTURE FEATURE — GADGIFY INTEGRATION
==================================================

Eventually connect this system to my ecommerce application.

After approval:

ProductCandidate
↓
Product API
↓
Prisma
↓
Database
↓
Product goes live

Create a service abstraction such as:

ProductImportService

with methods:

createCandidate()
validateCandidate()
detectDuplicates()
approveCandidate()
publishProduct()

==================================================
WHAT I WANT YOU TO PRODUCE
==================================================

Do NOT immediately generate thousands of lines of code.

First analyze the requirement and produce:

1. Complete architecture.

2. System flow diagram.

3. Folder/project structure.

4. Database schema.

5. Prisma model design.

6. API endpoint design.

7. Background-job architecture.

8. WhatsApp parser design.

9. Product-grouping algorithm.

10. AI extraction strategy.

11. Media-processing strategy.

12. Excel-export strategy.

13. Security architecture.

14. Error-handling strategy.

15. Logging and monitoring strategy.

16. Phase 1 implementation plan.

17. Phase 2 implementation plan.

18. Recommended packages/libraries.

19. Local-development setup.

20. Deployment architecture.

21. Cost-conscious recommendations.

22. Testing strategy.

23. Sample input/output.

24. Risks and limitations.

25. Step-by-step implementation roadmap.

==================================================
IMPLEMENTATION ROADMAP
==================================================

Break development into small milestones.

Example:

MILESTONE 1
Upload ZIP and safely extract files.

MILESTONE 2
Parse _chat.txt.

MILESTONE 3
Associate media with WhatsApp messages.

MILESTONE 4
Create ProductCandidate grouping.

MILESTONE 5
Integrate AI extraction.

MILESTONE 6
Build Product Review UI.

MILESTONE 7
Add Excel export.

MILESTONE 8
Add object storage.

MILESTONE 9
Integrate ecommerce product API.

MILESTONE 10
Integrate official WhatsApp Business API.

For every milestone provide:

- Goal
- Files to create
- Backend changes
- Frontend changes
- Database changes
- Security considerations
- Test cases
- Definition of Done

==================================================
CODING RULES
==================================================

When we start coding:

- Use TypeScript.
- Follow SOLID principles.
- Keep modules small.
- Avoid very large service classes.
- Separate controllers/services/repositories.
- Use dependency injection where useful.
- Use Zod for request validation where appropriate.
- Use async/await.
- Use centralized error handling.
- Use structured logging.
- Avoid hardcoded secrets.
- Add comments only where necessary.
- Write production-quality code.
- Add unit tests.
- Add integration tests.
- Consider performance.
- Consider security.
- Do not silently swallow errors.

Before adding a new npm package, explain:

- Why it is required.
- Whether it is actively maintained.
- Whether there are simpler alternatives.
- Any important security concerns.

==================================================
IMPORTANT DESIGN PRINCIPLE
==================================================

This system should be HUMAN-IN-THE-LOOP.

AI must assist product creation, not automatically publish potentially incorrect products.

The core workflow should be:

WhatsApp
↓
AI Extraction
↓
Product Candidate
↓
Human Review
↓
Approval
↓
Publish

==================================================
START NOW
==================================================

Begin by producing the complete Phase 1 technical architecture.

Then give me:

1. Architecture diagram.
2. Recommended folder structure.
3. Prisma database schema proposal.
4. API design.
5. Processing pipeline.
6. Product grouping algorithm.
7. AI extraction design.
8. Security design.
9. Milestone-by-milestone implementation plan.

After that, begin implementing Milestone 1 only.

Do not jump ahead and implement the entire system at once.