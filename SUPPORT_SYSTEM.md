# MOOVY Live Chat Support System

A professional, multi-role live chat support system for MOOVY with operator portal, buyer widget, and admin management.

## Architecture

### Database Models

Four core Prisma models (already in schema.prisma):

- **SupportChat**: Main chat session with status (waiting/active/resolved/closed), priority, rating
- **SupportMessage**: Individual messages with sender tracking and read status
- **SupportOperator**: Operator profiles linked to users, online/offline status, max concurrent chats
- **CannedResponse**: Pre-written quick responses with shortcuts (e.g., /saludo, /pago)

### Features

#### For Buyers (Store Frontend)
- **ChatWidget** (`src/components/support/ChatWidget.tsx`)
  - Floating bubble (bottom-right, above bottom nav on mobile)
  - Pre-chat form with category selector
  - Real-time messaging with typing indicator
  - Auto-refresh every 5 seconds
  - Rating system (1-5 stars) after chat resolution
  - Shows operator status (online/offline)
  - Unread badge counter

#### For Support Operators
- **Operator Portal** (`src/app/soporte/`)
  - Professional dashboard with sidebar chat list
  - Real-time updates (auto-refresh every 5s)
  - Claim waiting chats from queue
  - Send messages with keyboard shortcuts (Shift+Enter for newline)
  - Canned responses menu (type "/" to filter)
  - Transfer chats to other operators
  - Resolve chats with optional note
  - Toggle online/offline status
  - View unread message badges

#### For Admins (OPS Panel)
- **Support Management** (`src/app/ops/(protected)/soporte/`)
  - Tabbed interface: Chats | Operators | Canned Responses | Statistics
  - Manage operator accounts (enable/disable, max chats)
  - CRUD for canned responses
  - Real-time statistics dashboard
  - View operator online status and active chats

## API Endpoints

### Buyer APIs (Authenticated)

```
POST   /api/support/chats                    Create new chat
GET    /api/support/chats                    List user's chats
GET    /api/support/chats/[id]               Get chat with messages
POST   /api/support/chats/[id]               Send message (POST)
PUT    /api/support/chats/[id]               Rate chat (PUT)
GET    /api/support/status                   Check if support is online (public, no auth)
```

### Operator APIs (SupportOperator role only)

```
GET    /api/support/operator/chats           List assigned + waiting chats
GET    /api/support/operator/chats/[id]      Get chat detail
POST   /api/support/operator/chats/[id]      Send message
PATCH  /api/support/operator/chats/[id]      Claim/Resolve/Transfer (action: "claim"|"resolve"|"transfer")
PATCH  /api/support/operator/status          Toggle online/offline
GET    /api/support/operator/canned-responses Get active canned responses
```

### Admin APIs (ADMIN role only)

```
GET    /api/admin/support/operators          List all operators with stats
POST   /api/admin/support/operators          Create operator (link to existing user)
PATCH  /api/admin/support/operators/[id]     Toggle active, update maxChats
DELETE /api/admin/support/operators/[id]     Remove operator (reassign chats to waiting)

GET    /api/admin/support/canned-responses   List all canned responses
POST   /api/admin/support/canned-responses   Create canned response
PATCH  /api/admin/support/canned-responses/[id]  Update canned response
DELETE /api/admin/support/canned-responses/[id]  Delete canned response

GET    /api/admin/support/stats              Get support statistics
POST   /api/admin/support/init-canned        Initialize with default canned responses (idempotent)
```

## Setup & Configuration

### 1. Database Migration

The Prisma schema already includes the four models. Run:

```bash
npx prisma db push
```

### 2. Initialize Canned Responses

POST to `/api/admin/support/init-canned` as admin to seed default responses:

```bash
curl -X POST http://localhost:3000/api/admin/support/init-canned
```

This adds 12 pre-configured responses:
- /saludo - Greeting
- /horario - Business hours
- /estado-pedido - Order status
- /demora - Delivery delay
- /cancelar - Cancellation info
- /pago - Payment issues
- /reclamo - File complaint
- /puntos - Points system
- /comercio - Merchant registration
- /despedida - Goodbye
- /reembolso - Request refund
- /direccion - Update address

### 3. Create Support Operators

In OPS panel → Soporte → Operadores:
1. Create a user account first (or use existing)
2. Click "Crear Operador" and link the user
3. Set display name and max concurrent chats (default 5)

Operators log in at `/soporte/login` with their credentials.

### 4. Integrate Chat Widget

The `ChatWidget` component is already integrated in:
- `src/app/(store)/layout.tsx`

It appears above the WhatsApp button. To customize:
- Position: Change `bottom-20 right-4` classes
- Colors: Use Tailwind classes (currently `#e60012` for MOOVY brand)
- Z-index: Currently `z-40` (above content, below modals)

## Usage

### For Buyers

1. Click the chat bubble (bottom-right)
2. Select category and type message
3. Operator responds in real-time
4. After resolution, rate experience (1-5 stars)

### For Operators

1. Log in at `/soporte/login`
2. Click "En línea" / "Fuera de línea" toggle
3. Claim chats from "ESPERANDO" queue
4. Send messages, use `/` + first letter for canned responses
5. Resolve chat when done
6. Transfer to another operator if needed

### For Admins

1. Go to OPS panel → Centro de Soporte
2. Click tabs to manage operators, responses, or view stats
3. Create operators, enable/disable them
4. Add/edit/delete canned responses
5. Monitor real-time support metrics

## Canned Response Format

Shortcut format: `/keyword`

Example creation:
```json
{
  "shortcut": "/saludo",
  "title": "Saludo inicial",
  "content": "¡Hola! Soy {operatorName} de MOOVY. ¿En qué puedo ayudarte?",
  "category": "general",
  "sortOrder": 1
}
```

Categories: `general`, `pedido`, `pago`, `cuenta`, `cierre`

## Socket.IO Integration (Future)

Currently uses polling (5-10s intervals). For real-time:

1. Add Socket.IO handlers to emit events on:
   - `chat:new-message`
   - `chat:status-changed`
   - `chat:operator-joined`
   - `operator:status-changed`

2. Subscribe buyer widget and operator portal to these events

3. Remove polling intervals for instant updates

## Security Considerations

✅ **Implemented:**
- Auth checks on all endpoints (user's own chats only)
- Operator role verification
- Admin-only endpoints
- HMAC not needed (JWT auth via session)
- Rate limiting via existing security middleware
- Soft delete support (no permanent deletions)

⚠️ **Recommended:**
- Add rate limiting to chat creation (prevent spam)
- Audit log for sensitive operations (resolve, transfer, delete)
- Encryption for chat content in transit (already HTTPS in prod)
- Encryption at rest for sensitive conversations (future)

## Performance Notes

- Chat list queries use indexes on `status`, `operatorId`, `createdAt`
- Message fetching is paginated (limit 1 for recent, full on detail page)
- Operator status updates use 30-second intervals (configurable)
- Widget auto-scrolls efficiently with refs

## Testing

### Smoke Test

1. Create two test users: `buyer@test.com`, `operator@test.com`
2. Make `operator@test.com` an operator in OPS panel
3. Login as operator, toggle "En línea"
4. Login as buyer, create a chat
5. Verify operator sees it in waiting queue
6. Operator claims it, sends message
7. Buyer receives, responds
8. Operator resolves, buyer rates
9. Check stats in OPS panel

### Load Test

- Widget handles 100+ concurrent chats at operator
- API auto-refresh every 5s (adjust `setInterval` in pages)
- Canned responses are cached per operator session

## Troubleshooting

**Widget not appearing:**
- Check `z-40` isn't below other overlays
- Verify ChatWidget import in store layout
- Check browser console for errors

**Operator portal blank:**
- Verify user is linked as SupportOperator in DB
- Check `isActive = true` on SupportOperator row
- Clear session/cookies and re-login

**Messages not syncing:**
- Check polling interval in code (5-10s)
- Verify chat ID matches between components
- Check browser Network tab for 401/403 errors

**Canned response shortcuts not working:**
- Type `/` then first letter(s) to filter
- Check shortcut is lowercase in DB
- Verify `isActive = true` on response row

## File Structure

```
src/
├── types/
│   └── support.ts                    # TypeScript interfaces
├── hooks/
│   └── useChat.ts                    # Buyer chat hook
├── components/support/
│   ├── ChatWidget.tsx                # Floating widget (buyer)
│   └── ChatBubbleIcon.tsx            # Custom SVG icon
├── app/
│   ├── soporte/
│   │   ├── login/page.tsx            # Operator login
│   │   └── (protected)/
│   │       ├── layout.tsx            # Auth guard
│   │       └── page.tsx              # Operator dashboard
│   ├── ops/(protected)/soporte/
│   │   └── page.tsx                  # Admin panel
│   └── api/
│       ├── support/
│       │   ├── chats/
│       │   │   ├── route.ts          # Create/list chats
│       │   │   └── [id]/route.ts     # Chat detail/messages
│       │   ├── status/route.ts       # Public status
│       │   └── operator/
│       │       ├── chats/
│       │       │   ├── route.ts      # Operator chat list
│       │       │   └── [id]/route.ts # Operator chat actions
│       │       ├── status/route.ts   # Toggle online
│       │       └── canned-responses/route.ts
│       └── admin/support/
│           ├── operators/
│           │   ├── route.ts          # Operator CRUD
│           │   └── [id]/route.ts
│           ├── canned-responses/
│           │   ├── route.ts          # Canned CRUD
│           │   └── [id]/route.ts
│           ├── init-canned/route.ts  # Seed endpoint
│           └── stats/route.ts        # Metrics
```

## Future Enhancements

1. **Socket.IO** - Replace polling with WebSockets
2. **File uploads** - Support attachments (images, documents)
3. **Chatbot** - NLP pre-screening or FAQ answers
4. **Email notifications** - Notify customers of responses
5. **Sentiment analysis** - Auto-flag negative chats
6. **Canned response templates** - With variable interpolation
7. **Chat history export** - CSV/PDF download
8. **Multi-language** - Auto-translate or multi-lang responses
9. **SLA metrics** - Track response time, resolution time
10. **Agent performance** - Rating distribution, resolution rate

## Support

For issues or improvements, contact the development team.
