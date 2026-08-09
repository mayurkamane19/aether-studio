# Aether Studio — AI Sales Copilot & Next Best Action Engine

This document details the AI Sales Copilot architecture, Next Best Action recommendation matrix, prompt injection security, AI failure fallback, and database logging model for **Aether Studio**.

---

## 1. AI Sales Copilot Architecture

The AI Sales Copilot operates as an intelligent sales assistant inside the Aether Studio Admin CRM. It analyzes real PostgreSQL lead records, historical proposals, activity logs, and follow-up states to generate real-time next best actions, deal health ratings, risk factors, and draft client communications.

### Core Security Principles
- **Recommendation-Only Execution**: The AI does NOT automatically modify lead status, send emails, send WhatsApp messages, mark projects WON/LOST, or generate proposals. All actions require explicit admin review and approval.
- **Prompt Injection Defense**: Client-submitted messages are treated as **untrusted data**. System instructions isolate user content in JSON wrappers, preventing prompt injection attacks from overriding security rules or revealing API keys.
- **Zero Secrets Exposure**: API keys (`OPENAI_API_KEY`), database strings (`DATABASE_URL`), and tokens (`ADMIN_CRM_TOKEN`) are kept strictly in server-side environment variables and are never sent to external AI prompts.

---

## 2. Next Best Action Matrix

| Next Action | Priority | Trigger Condition | Recommended Response |
| :--- | :--- | :--- | :--- |
| `CONTACT_NOW` | `URGENT` | New lead submitted (<24h). | Initial outreach via email or phone. |
| `SEND_PROPOSAL` | `URGENT` | Lead scope qualified; high purchase intent score (≥70). | Build proposal via Proposal Generator. |
| `CALL_CLIENT` | `URGENT` | Client viewed online proposal (`PROPOSAL_VIEWED`). | Direct phone/WhatsApp call while interest is peak. |
| `SEND_FOLLOWUP` | `HIGH` | Proposal sent >3 days without client activity. | Dispatch follow-up step (+2d, +5d, +10d). |
| `NEGOTIATION` | `HIGH` | Client requested milestone adjustment or pricing revision. | Adjust milestone terms or package option. |
| `REQUEST_INFORMATION` | `MEDIUM` | Incomplete project description or missing deadline. | Request target launch date or page count. |
| `WAIT` | `LOW` | Recent touchpoint completed; client reviewing. | Allow client time to review proposal. |
| `STOP_FOLLOWUP` | `LOW` | Proposal accepted, rejected, or lead closed. | Halt follow-up sequence. |

---

## 3. Deal Health & Risk Detection

The Copilot evaluates 5 deal health ratings:
1. `HEALTHY`: Active lead with recent positive touchpoints.
2. `HIGH_POTENTIAL`: Qualified enterprise inquiry or high budget range.
3. `STALE`: No recorded activity in past 7+ days.
4. `AT_RISK`: Aging proposal or unverified company handle.
5. `BLOCKED`: Client declined proposal or project cancelled.

---

## 4. Serverless API Endpoint (`POST /api/admin/copilot`)

### Request
```json
{
  "leadId": "AS-2026-123456"
}
```

### Response
```json
{
  "success": true,
  "leadId": "AS-2026-123456",
  "copilot": {
    "action": "SEND_FOLLOWUP",
    "priority": "HIGH",
    "confidence": "HIGH",
    "dealHealth": "HEALTHY",
    "reason": "Proposal sent 4 days ago without confirmation.",
    "summary": "High-value AI automation project.",
    "riskData": ["PROPOSAL_AGING: No activity in past 4 days."],
    "missingInformation": ["Target launch deadline."],
    "suggestedReply": "Hello Client...",
    "suggestedFollowup": "Hi Client, following up on..."
  }
}
```

---

## 5. Database Logging (`lead_copilot_recommendations`)

- **Migration**: [`docs/migrations/009_ai_sales_copilot.sql`](file:///c:/Users/mayur/OneDrive/Desktop/Mayur%20Creative%20Studio/docs/migrations/009_ai_sales_copilot.sql)
- Stores recommendation history, actions, priority, confidence, and generated reply drafts for audit logging.
