# KarmDeep Platform - API Documentation

## Base URL
```
https://api.karmdeep.com/v1
```

## Authentication
All API requests require a Bearer token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

## Response Format
All responses follow this structure:
```json
{
  "success": true|false,
  "data": { ... },
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req_xxx"
  }
}
```

---

## Vendor Management

### Register Vendor
```
POST /vendors
```

**Request Body:**
```json
{
  "companyName": "string",
  "email": "string",
  "phoneNumber": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postalCode": "string"
  },
  "certifications": ["string"]
}
```

**Response:** `201 Created`

### Get Vendor Profile
```
GET /vendors/{vendorId}
```

**Response:** `200 OK`

### Update Vendor Profile
```
PUT /vendors/{vendorId}
```

**Request Body:**
```json
{
  "companyName": "string",
  "phoneNumber": "string",
  "address": { ... },
  "certifications": ["string"]
}
```

**Response:** `200 OK`

### List Vendors
```
GET /vendors?limit=20&nextToken=xxx
```

**Response:** `200 OK`

---

## Product Management

### Create Product
```
POST /vendors/{vendorId}/products
```

**Request Body:**
```json
{
  "productName": "string",
  "category": "string",
  "subcategory": "string",
  "specifications": { ... },
  "pricing": {
    "basePrice": 0,
    "currency": "USD",
    "negotiable": true
  },
  "availability": "IN_STOCK",
  "images": ["string"],
  "certifications": ["string"],
  "warranty": {
    "duration": 12,
    "unit": "MONTHS",
    "terms": "string"
  }
}
```

**Response:** `201 Created`

### Get Product
```
GET /vendors/{vendorId}/products/{productId}
```

**Response:** `200 OK`

### Update Product
```
PUT /vendors/{vendorId}/products/{productId}
```

**Request Body:** (same as create, all fields optional)

**Response:** `200 OK`

### List Products
```
GET /products?vendorId=xxx&category=xxx&limit=20
```

**Response:** `200 OK`

### Search Products
```
GET /products/search?q=keyword&category=xxx&minPrice=0&maxPrice=1000&availability=IN_STOCK&limit=20
```

**Response:** `200 OK`

---

## Tender Management

### Create Tender
```
POST /tenders
```

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "specifications": { ... },
  "commercialTerms": {
    "budget": 0,
    "currency": "USD",
    "paymentTerms": "string"
  },
  "deadline": "2024-12-31T23:59:59Z",
  "status": "DRAFT"
}
```

**Response:** `201 Created`

### Get Tender
```
GET /tenders/{tenderId}
```

**Response:** `200 OK`

### List Tenders
```
GET /tenders?status=PUBLISHED&buyerId=xxx&limit=20
```

**Response:** `200 OK`

### Submit Bid
```
POST /tenders/{tenderId}/bids
```

**Request Body:**
```json
{
  "bidAmount": 0,
  "currency": "USD",
  "technicalProposal": "string",
  "commercialTerms": "string",
  "validUntil": "2024-12-31T23:59:59Z"
}
```

**Response:** `201 Created`

### Get Bids
```
GET /tenders/{tenderId}/bids
```

**Response:** `200 OK` (Only for tender owner or admin)

---

## Order Management

### Create Order
```
POST /orders
```

**Request Body:**
```json
{
  "vendorId": "string",
  "productId": "string",
  "quantity": 1,
  "totalAmount": 0,
  "currency": "USD",
  "shippingAddress": {
    "street": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postalCode": "string"
  }
}
```

**Response:** `201 Created`

### Get Order
```
GET /orders/{orderId}
```

**Response:** `200 OK`

### Update Order Status
```
PUT /orders/{orderId}/status
```

**Request Body:**
```json
{
  "status": "CONFIRMED"
}
```

**Status Values:** `PENDING`, `CONFIRMED`, `IN_PRODUCTION`, `SHIPPED`, `DELIVERED`, `INSTALLED`, `COMPLETED`, `CANCELLED`

**Response:** `200 OK`

### List Orders
```
GET /orders?buyerId=xxx&vendorId=xxx&status=PENDING&limit=20
```

**Response:** `200 OK`

---

## Maintenance Management

### Create Maintenance Schedule
```
POST /maintenance/schedules
```

**Request Body:**
```json
{
  "machineId": "string",
  "maintenanceType": "PREVENTIVE",
  "frequency": "MONTHLY",
  "nextDueDate": "2024-12-31T23:59:59Z",
  "instructions": "string",
  "priority": "MEDIUM"
}
```

**Maintenance Types:** `PREVENTIVE`, `CORRECTIVE`, `PREDICTIVE`
**Priority:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

**Response:** `201 Created`

### Create Work Order
```
POST /maintenance/work-orders
```

**Request Body:**
```json
{
  "machineId": "string",
  "scheduleId": "string",
  "maintenanceType": "PREVENTIVE",
  "assignedTechnician": "string",
  "scheduledDate": "2024-12-31T23:59:59Z"
}
```

**Response:** `201 Created`

### Update Work Order
```
PUT /maintenance/work-orders/{workOrderId}
```

**Request Body:**
```json
{
  "status": "COMPLETED",
  "findings": "string",
  "partsUsed": ["string"],
  "cost": 0
}
```

**Status Values:** `CREATED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

**Response:** `200 OK`

### Get Work Orders
```
GET /maintenance/work-orders?technicianId=xxx&machineId=xxx&limit=20
```

**Response:** `200 OK`

---

## Analytics

### Track User Behavior
```
POST /analytics/behavior
```

**Request Body:**
```json
{
  "action": "VIEW_PRODUCT",
  "resourceType": "PRODUCT",
  "resourceId": "string",
  "sessionId": "string",
  "metadata": { ... }
}
```

**Resource Types:** `PRODUCT`, `VENDOR`, `TENDER`, `ORDER`

**Response:** `201 Created`

### Get Recommendations
```
GET /analytics/recommendations?limit=10
```

**Response:** `200 OK`
```json
{
  "recommendations": [
    {
      "productId": "string",
      "score": 0.8,
      "reason": "string"
    }
  ],
  "basedOn": {
    "viewedProducts": 10,
    "topCategories": ["string"]
  }
}
```

### Generate Report
```
POST /analytics/reports
```

**Request Body:**
```json
{
  "reportType": "PROCUREMENT",
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

**Report Types:** `PROCUREMENT`, `VENDOR_PERFORMANCE`, `MARKET_TRENDS`, `COST_OPTIMIZATION`

**Response:** `201 Created`

### Get Platform Metrics
```
GET /analytics/metrics?period=current_month
```

**Response:** `200 OK` (Admin only)
```json
{
  "totalUsers": 1250,
  "activeUsers": 890,
  "totalVendors": 45,
  "totalProducts": 3200,
  "totalOrders": 450,
  "totalRevenue": 15000000,
  "averageOrderValue": 33333,
  "period": "current_month"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request data |
| `INTERNAL_ERROR` | Server error |

---

## Rate Limiting

- **Development:** 1,000 requests/hour
- **Production:** 10,000 requests/hour

Rate limit headers:
```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9999
X-RateLimit-Reset: 1640995200
```

---

## Pagination

List endpoints support pagination:
```
GET /endpoint?limit=20&nextToken=xxx
```

Response includes:
```json
{
  "items": [...],
  "nextToken": "xxx",
  "total": 100
}
```

---

## Webhooks

Configure webhooks to receive real-time notifications:

**Events:**
- `tender.published`
- `tender.closed`
- `bid.submitted`
- `order.created`
- `order.status_changed`
- `work_order.created`
- `work_order.completed`

**Webhook Payload:**
```json
{
  "eventType": "order.created",
  "eventId": "string",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": { ... }
}
```

---

## SDKs

Official SDKs available for:
- JavaScript/TypeScript
- Python
- Java
- Go

```bash
npm install @karmdeep/sdk
```

```javascript
import { KarmDeepClient } from '@karmdeep/sdk';

const client = new KarmDeepClient({
  apiKey: 'your-api-key'
});

const vendors = await client.vendors.list();
```
