# 05-TAX-ENGINE.md

# 稅率自動化計算引擎模組

> **Module Purpose**: 根據商業領域、分類代碼和交易類型，自動判斷適用稅率，並允許用戶覆寫

---

## 模組聯動關係

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ 01-INDUSTRY     │   │ 02-TAX-RATES    │   │ 03-CLASSIFICATION│
│ -CONFIG.md      │   │ .md             │   │ .md             │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         │ 領域配置            │ 稅率規則            │ 分類代碼
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                               ▼
                 ┌─────────────────────────┐
                 │  本模組                 │
                 │  (05-TAX-ENGINE)        │
                 │                         │
                 │  輸入:                  │
                 │  - 商品/服務資訊        │
                 │  - 買家資訊             │
                 │  - 交易類型             │
                 │                         │
                 │  輸出:                  │
                 │  - 建議稅種             │
                 │  - 建議稅率             │
                 │  - 計算稅額             │
                 └─────────────────────────┘
                               │
                               ▼
                        E-Invoice.md
                        (最終提交)
```

---

## 1. 引擎概述

### 1.1 設計原則

| 原則 | 說明 |
|------|------|
| **自動優先** | 系統根據規則自動判斷稅率 |
| **用戶可覆寫** | 允許用戶修改系統建議 |
| **審計追蹤** | 記錄所有覆寫操作 |
| **合規驗證** | 驗證稅率是否符合法規 |
| **多層級規則** | 支援優先順序規則匹配 |

### 1.2 處理流程

```
稅率計算流程:
═══════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────┐
    │ 輸入                                                        │
    │                                                             │
    │  • 商品/服務描述                                            │
    │  • 分類代碼                                                 │
    │  • 單價、數量                                               │
    │  • 買家類型 (B2B/B2C/B2G)                                   │
    │  • 買家國籍 (馬來西亞公民/PR/外國人)                        │
    │  • 交易日期                                                 │
    └─────────────────────────────────────────────────────────────┘
                                │
                                ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ Step 1: 領域規則檢查                                        │
    │                                                             │
    │  檢查當前用戶的商業領域是否有特定稅率規則                   │
    │  例如: 餐飲業 (FNB) → 服務稅 6%                             │
    └─────────────────────────────────────────────────────────────┘
                                │
                                ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ Step 2: 分類代碼規則檢查                                    │
    │                                                             │
    │  根據分類代碼查找對應的稅率規則                             │
    │  例如: 003 (電腦) → 銷售稅 10%                              │
    └─────────────────────────────────────────────────────────────┘
                                │
                                ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ Step 3: 豁免條件檢查                                        │
    │                                                             │
    │  檢查是否符合豁免條件                                       │
    │  例如: 馬來西亞公民的私人醫療服務 → 豁免                    │
    └─────────────────────────────────────────────────────────────┘
                                │
                                ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ Step 4: 日期有效性檢查                                      │
    │                                                             │
    │  檢查規則的生效日期                                         │
    │  例如: 建築服務稅 → 2025年7月1日起生效                      │
    └─────────────────────────────────────────────────────────────┘
                                │
                                ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ Step 5: 計算稅額                                            │
    │                                                             │
    │  稅額 = 應稅金額 × 稅率                                     │
    └─────────────────────────────────────────────────────────────┘
                                │
                                ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ 輸出                                                        │
    │                                                             │
    │  • 建議稅種 (Tax Type Code)                                 │
    │  • 建議稅率                                                 │
    │  • 計算稅額                                                 │
    │  • 匹配的規則說明                                           │
    │  • 是否允許用戶覆寫                                         │
    └─────────────────────────────────────────────────────────────┘
```

---

## 2. 規則引擎設計

### 2.1 規則優先順序

規則按優先順序由高到低匹配：

| 優先順序 | 規則類型 | 說明 |
|----------|----------|------|
| **1 (最高)** | 用戶自訂覆寫 | 用戶對特定商品/服務的自訂稅率 |
| **2** | 豁免規則 | 符合豁免條件的項目 |
| **3** | 領域+分類組合規則 | 特定領域的特定分類代碼規則 |
| **4** | 分類代碼規則 | 分類代碼的預設稅率 |
| **5** | 領域預設規則 | 領域的預設稅率 |
| **6 (最低)** | 系統預設 | 無法匹配時的預設規則 |

### 2.2 規則定義結構

```typescript
interface TaxRule {
  id: string;
  name: string;
  priority: number;
  
  // 匹配條件
  conditions: {
    industryCode?: string | string[];
    classificationCode?: string | string[];
    productKeywords?: string[];
    buyerType?: 'B2B' | 'B2C' | 'B2G' | 'ALL';
    buyerNationality?: 'MALAYSIAN' | 'PR' | 'FOREIGNER' | 'ALL';
    transactionType?: 'SALE' | 'PURCHASE' | 'IMPORT' | 'EXPORT';
    amountRange?: {
      min?: number;
      max?: number;
    };
  };
  
  // 有效期
  effectiveFrom: Date;
  effectiveTo?: Date;
  
  // 結果
  result: {
    taxTypeCode: string;
    taxRate: number;
    isExempt: boolean;
    exemptionCode?: string;
    exemptionReason?: string;
  };
  
  // 元數據
  source: string;  // 規則來源 (LHDN, RMCD, USER)
  legalReference?: string;
  notes?: string;
}
```

### 2.3 內建規則範例

```yaml
built_in_rules:

  # 規則 1: 餐飲業服務稅 6%
  - id: "RULE_FNB_SERVICE_TAX"
    name: "F&B Service Tax 6%"
    priority: 3
    conditions:
      industryCode: "FNB"
      classificationCode: "022"
    effectiveFrom: "2024-03-01"
    result:
      taxTypeCode: "02"
      taxRate: 6
      isExempt: false
    source: "RMCD"
    notes: "餐飲服務維持 6%，非 8%"

  # 規則 2: 電子產品銷售稅 10%
  - id: "RULE_ELECTRONICS_SALES_TAX"
    name: "Electronics Sales Tax 10%"
    priority: 4
    conditions:
      classificationCode: "003"
    effectiveFrom: "2018-09-01"
    result:
      taxTypeCode: "01"
      taxRate: 10
      isExempt: false
    source: "RMCD"

  # 規則 3: 建築材料銷售稅 5%
  - id: "RULE_CONSTRUCTION_MATERIALS"
    name: "Construction Materials Sales Tax 5%"
    priority: 4
    conditions:
      classificationCode: "005"
    effectiveFrom: "2018-09-01"
    result:
      taxTypeCode: "01"
      taxRate: 5
      isExempt: false
    source: "RMCD"
    legalReference: "LPIPM Act 1994 Fourth Schedule"

  # 規則 4: 馬來西亞公民私人醫療豁免
  - id: "RULE_CITIZEN_HEALTHCARE_EXEMPT"
    name: "Malaysian Citizen Healthcare Exemption"
    priority: 2
    conditions:
      industryCode: "HEALTH"
      classificationCode: ["019", "020", "021", "041", "042", "043"]
      buyerNationality: "MALAYSIAN"
    effectiveFrom: "2025-07-01"
    result:
      taxTypeCode: "E"
      taxRate: 0
      isExempt: true
      exemptionCode: "EXSVT-01"
      exemptionReason: "Malaysian citizen exempt from private healthcare service tax"
    source: "RMCD"

  # 規則 5: 外國人私人醫療服務稅 6%
  - id: "RULE_FOREIGNER_HEALTHCARE"
    name: "Foreigner Healthcare Service Tax 6%"
    priority: 3
    conditions:
      industryCode: "HEALTH"
      classificationCode: ["020", "021", "041", "042", "043"]
      buyerNationality: "FOREIGNER"
    effectiveFrom: "2025-07-01"
    result:
      taxTypeCode: "02"
      taxRate: 6
      isExempt: false
    source: "RMCD"

  # 規則 6: 住宿服務稅 6%
  - id: "RULE_ACCOMMODATION_SERVICE_TAX"
    name: "Accommodation Service Tax 6%"
    priority: 3
    conditions:
      industryCode: "TOURISM"
    effectiveFrom: "2018-09-01"
    result:
      taxTypeCode: "02"
      taxRate: 6
      isExempt: false
    source: "RMCD"
    notes: "另需加收 Tourism Tax RM10/房/晚"

  # 規則 7: 書籍豁免
  - id: "RULE_BOOKS_EXEMPT"
    name: "Books and Publications Exemption"
    priority: 2
    conditions:
      classificationCode: "026"
    effectiveFrom: "2018-09-01"
    result:
      taxTypeCode: "E"
      taxRate: 0
      isExempt: true
      exemptionCode: "EXSST-01"
      exemptionReason: "Books, magazines, newspapers exempt from sales tax"
    source: "RMCD"

  # 規則 8: 專業服務稅 8%
  - id: "RULE_PROFESSIONAL_SERVICE_TAX"
    name: "Professional Services Tax 8%"
    priority: 5
    conditions:
      industryCode: "PROF_SVC"
    effectiveFrom: "2024-03-01"
    result:
      taxTypeCode: "02"
      taxRate: 8
      isExempt: false
    source: "RMCD"

  # 規則 9: 墊付款項不課稅
  - id: "RULE_DISBURSEMENT_NOT_TAXABLE"
    name: "Disbursement Not Taxable"
    priority: 2
    conditions:
      classificationCode: "006"
    effectiveFrom: "2018-09-01"
    result:
      taxTypeCode: "06"
      taxRate: 0
      isExempt: false
    source: "LHDN"
    notes: "墊付款項不構成應稅供應"

  # 規則 10: 系統預設 - 銷售稅 10%
  - id: "RULE_DEFAULT_SALES_TAX"
    name: "Default Sales Tax 10%"
    priority: 6
    conditions: {}
    effectiveFrom: "2018-09-01"
    result:
      taxTypeCode: "01"
      taxRate: 10
      isExempt: false
    source: "SYSTEM"
    notes: "無法匹配其他規則時的預設"
```

---

## 3. 用戶覆寫機制

### 3.1 覆寫類型

| 覆寫類型 | 說明 | 範圍 |
|----------|------|------|
| **商品級覆寫** | 對特定商品設定固定稅率 | 單一商品 |
| **分類級覆寫** | 對分類代碼設定稅率 | 該分類下所有商品 |
| **客戶級覆寫** | 對特定客戶設定稅率 | 該客戶的所有交易 |
| **發票級覆寫** | 對單張發票臨時修改 | 單一發票 |

### 3.2 覆寫資料結構

```typescript
interface TaxOverride {
  id: string;
  organizationId: string;
  
  // 覆寫類型
  overrideType: 'PRODUCT' | 'CLASSIFICATION' | 'CUSTOMER' | 'INVOICE';
  
  // 覆寫目標
  target: {
    productId?: string;
    productName?: string;
    classificationCode?: string;
    customerId?: string;
    invoiceId?: string;
  };
  
  // 覆寫值
  override: {
    taxTypeCode: string;
    taxRate: number;
    exemptionCode?: string;
  };
  
  // 原因 (必填)
  reason: string;
  
  // 有效期
  effectiveFrom: Date;
  effectiveTo?: Date;
  
  // 審計
  createdBy: string;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}
```

### 3.3 覆寫流程

```
用戶覆寫流程:
═══════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────┐
    │ 系統顯示建議稅率                                            │
    │                                                             │
    │  商品: iPhone 15 Pro Max                                    │
    │  分類代碼: 003 (電腦、智慧手機)                             │
    │  建議稅種: 銷售稅 (01)                                      │
    │  建議稅率: 10%                                              │
    │  稅額: RM 500.00                                            │
    │                                                             │
    │  [✏️ 修改稅率]                                              │
    └─────────────────────────────────────────────────────────────┘
                                │
                                ▼ (用戶點擊修改)
    ┌─────────────────────────────────────────────────────────────┐
    │ 稅率修改表單                                                │
    │                                                             │
    │  新稅種: [Service Tax ▼]                                    │
    │  新稅率: [8 %]                                              │
    │                                                             │
    │  修改原因 (必填):                                           │
    │  [此商品附帶安裝服務，應適用服務稅______]                   │
    │                                                             │
    │  適用範圍:                                                  │
    │  ○ 僅此發票                                                 │
    │  ○ 此商品 (永久)                                            │
    │  ○ 此分類代碼 (003)                                         │
    │                                                             │
    │  [取消]  [確認修改]                                         │
    └─────────────────────────────────────────────────────────────┘
                                │
                                ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ 系統驗證                                                    │
    │                                                             │
    │  ✓ 稅率在合法範圍內                                         │
    │  ✓ 已填寫修改原因                                           │
    │  ⚠️ 此修改將記錄於審計日誌                                  │
    └─────────────────────────────────────────────────────────────┘
                                │
                                ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ 審計日誌記錄                                                │
    │                                                             │
    │  時間: 2025-12-26 15:30:00                                  │
    │  操作: 稅率覆寫                                             │
    │  用戶: user@company.com                                     │
    │  商品: iPhone 15 Pro Max                                    │
    │  原稅率: Sales Tax 10%                                      │
    │  新稅率: Service Tax 8%                                     │
    │  原因: 此商品附帶安裝服務，應適用服務稅                     │
    │  範圍: 僅此發票                                             │
    └─────────────────────────────────────────────────────────────┘
```

### 3.4 覆寫驗證規則

```typescript
interface OverrideValidation {
  // 允許的稅種
  allowedTaxTypes: string[];  // ['01', '02', '03', '04', '05', '06', 'E']
  
  // 允許的稅率範圍
  taxRateRange: {
    min: number;  // 0
    max: number;  // 100
  };
  
  // 必填欄位
  requiredFields: string[];  // ['reason']
  
  // 需要審批的情況
  requiresApproval: {
    // 稅率差異超過此值需要審批
    taxRateDifferenceThreshold: number;  // 例如 5%
    
    // 免稅覆寫需要審批
    exemptionRequiresApproval: boolean;  // true
  };
}
```

---

## 4. 稅額計算邏輯

### 4.1 計算公式

```typescript
interface TaxCalculation {
  // 輸入
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  chargeAmount: number;
  
  // 計算
  lineAmount: number;           // unitPrice × quantity
  taxableAmount: number;        // lineAmount - discountAmount + chargeAmount
  taxRate: number;              // 從規則引擎獲取
  taxAmount: number;            // taxableAmount × (taxRate / 100)
  
  // 輸出
  totalExcludingTax: number;    // taxableAmount
  totalTax: number;             // taxAmount
  totalIncludingTax: number;    // taxableAmount + taxAmount
}

// 計算函數
function calculateTax(input: TaxCalculationInput): TaxCalculation {
  const lineAmount = input.unitPrice * input.quantity;
  const taxableAmount = lineAmount - (input.discountAmount || 0) + (input.chargeAmount || 0);
  const taxAmount = taxableAmount * (input.taxRate / 100);
  
  return {
    unitPrice: input.unitPrice,
    quantity: input.quantity,
    discountAmount: input.discountAmount || 0,
    chargeAmount: input.chargeAmount || 0,
    lineAmount,
    taxableAmount,
    taxRate: input.taxRate,
    taxAmount: Math.round(taxAmount * 100) / 100,  // 四捨五入到分
    totalExcludingTax: taxableAmount,
    totalTax: Math.round(taxAmount * 100) / 100,
    totalIncludingTax: taxableAmount + Math.round(taxAmount * 100) / 100
  };
}
```

### 4.2 多稅種處理

當同一發票包含多種稅種時：

```typescript
interface MultiTaxInvoice {
  lines: Array<{
    lineNumber: number;
    description: string;
    taxType: string;
    taxRate: number;
    taxableAmount: number;
    taxAmount: number;
  }>;
  
  // 按稅種彙總
  taxSummary: Array<{
    taxType: string;
    taxTypeName: string;
    totalTaxableAmount: number;
    taxRate: number;
    totalTaxAmount: number;
  }>;
  
  // 發票總計
  totals: {
    totalExcludingTax: number;
    totalTax: number;
    totalIncludingTax: number;
    totalPayable: number;
  };
}
```

### 4.3 Tourism Tax 特殊處理

旅遊稅按房間/晚計算，非百分比：

```typescript
interface TourismTaxCalculation {
  roomNights: number;         // 房間數 × 晚數
  ratePerRoomNight: number;   // RM 10
  totalTourismTax: number;    // roomNights × ratePerRoomNight
}

function calculateTourismTax(rooms: number, nights: number): TourismTaxCalculation {
  const roomNights = rooms * nights;
  const ratePerRoomNight = 10;  // RM 10
  
  return {
    roomNights,
    ratePerRoomNight,
    totalTourismTax: roomNights * ratePerRoomNight
  };
}
```

---

## 5. 資料庫 Schema

```sql
-- 稅率規則表
CREATE TABLE tax_rules (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(200) NOT NULL,
    priority                INTEGER NOT NULL DEFAULT 0,
    
    -- 匹配條件 (JSON)
    conditions              JSONB NOT NULL,
    
    -- 有效期
    effective_from          DATE NOT NULL,
    effective_to            DATE,
    
    -- 結果
    tax_type_code           VARCHAR(10) NOT NULL,
    tax_rate                DECIMAL(5,2),
    is_exempt               BOOLEAN DEFAULT false,
    exemption_code          VARCHAR(20),
    exemption_reason        VARCHAR(500),
    
    -- 元數據
    source                  VARCHAR(50) NOT NULL,  -- 'LHDN', 'RMCD', 'SYSTEM', 'USER'
    legal_reference         VARCHAR(200),
    notes                   TEXT,
    
    -- 狀態
    is_active               BOOLEAN DEFAULT true,
    
    -- 審計
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              VARCHAR(100)
);

-- 用戶覆寫表
CREATE TABLE tax_overrides (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    
    -- 覆寫類型
    override_type           VARCHAR(20) NOT NULL,  -- 'PRODUCT', 'CLASSIFICATION', 'CUSTOMER', 'INVOICE'
    
    -- 覆寫目標 (JSON)
    target                  JSONB NOT NULL,
    
    -- 覆寫值
    tax_type_code           VARCHAR(10) NOT NULL,
    tax_rate                DECIMAL(5,2) NOT NULL,
    exemption_code          VARCHAR(20),
    
    -- 原因
    reason                  TEXT NOT NULL,
    
    -- 有效期
    effective_from          DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to            DATE,
    
    -- 審計
    created_by              VARCHAR(100) NOT NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by             VARCHAR(100),
    approved_at             TIMESTAMP,
    
    -- 狀態
    status                  VARCHAR(20) DEFAULT 'ACTIVE'  -- 'ACTIVE', 'EXPIRED', 'REVOKED'
);

-- 稅率計算日誌
CREATE TABLE tax_calculation_logs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    invoice_id              UUID,
    line_number             INTEGER,
    
    -- 輸入
    classification_code     VARCHAR(10),
    product_description     VARCHAR(500),
    taxable_amount          DECIMAL(18,2) NOT NULL,
    
    -- 規則匹配
    matched_rule_id         UUID REFERENCES tax_rules(id),
    override_id             UUID REFERENCES tax_overrides(id),
    
    -- 結果
    tax_type_code           VARCHAR(10) NOT NULL,
    tax_rate                DECIMAL(5,2) NOT NULL,
    tax_amount              DECIMAL(18,2) NOT NULL,
    is_overridden           BOOLEAN DEFAULT false,
    
    -- 時間
    calculated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_tax_rules_priority ON tax_rules(priority DESC, effective_from);
CREATE INDEX idx_tax_rules_conditions ON tax_rules USING gin(conditions);
CREATE INDEX idx_tax_overrides_org ON tax_overrides(organization_id);
CREATE INDEX idx_tax_overrides_type ON tax_overrides(override_type);
CREATE INDEX idx_tax_calc_logs_invoice ON tax_calculation_logs(invoice_id);
```

---

## 6. API 介面

### 6.1 計算稅率 API

```typescript
// 請求
POST /api/v1/tax/calculate

{
  "organizationId": "org-123",
  "industryCode": "RETAIL",
  "items": [
    {
      "lineNumber": 1,
      "classificationCode": "003",
      "description": "iPhone 15 Pro Max",
      "unitPrice": 5000.00,
      "quantity": 1,
      "discountAmount": 0,
      "chargeAmount": 0
    }
  ],
  "buyer": {
    "type": "B2C",
    "nationality": "MALAYSIAN"
  },
  "transactionDate": "2025-12-26"
}

// 回應
{
  "success": true,
  "results": [
    {
      "lineNumber": 1,
      "suggestedTax": {
        "taxTypeCode": "01",
        "taxTypeName": "Sales Tax",
        "taxRate": 10.00,
        "taxAmount": 500.00,
        "isExempt": false
      },
      "matchedRule": {
        "ruleId": "RULE_ELECTRONICS_SALES_TAX",
        "ruleName": "Electronics Sales Tax 10%",
        "source": "RMCD"
      },
      "calculation": {
        "taxableAmount": 5000.00,
        "taxAmount": 500.00,
        "totalIncludingTax": 5500.00
      },
      "canOverride": true
    }
  ]
}
```

### 6.2 創建覆寫 API

```typescript
// 請求
POST /api/v1/tax/override

{
  "organizationId": "org-123",
  "overrideType": "PRODUCT",
  "target": {
    "productName": "iPhone 15 Pro Max with Installation"
  },
  "override": {
    "taxTypeCode": "02",
    "taxRate": 8.00
  },
  "reason": "This product includes installation service, should apply Service Tax",
  "effectiveFrom": "2025-12-26"
}

// 回應
{
  "success": true,
  "overrideId": "override-456",
  "message": "Tax override created successfully",
  "audit": {
    "timestamp": "2025-12-26T15:30:00Z",
    "user": "user@company.com",
    "action": "TAX_OVERRIDE_CREATED"
  }
}
```

---

## 7. 與 E-Invoice.md 的整合

### 7.1 發票提交前的稅率驗證

```typescript
interface InvoiceSubmissionValidation {
  // 驗證每行的稅率
  validateLineTax(line: InvoiceLine): ValidationResult;
  
  // 驗證稅額計算
  validateTaxCalculation(line: InvoiceLine): ValidationResult;
  
  // 驗證豁免代碼
  validateExemption(line: InvoiceLine): ValidationResult;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

### 7.2 輸出至 UBL 格式

```json
{
  "TaxTotal": [
    {
      "TaxAmount": [{ "_": 500.00, "currencyID": "MYR" }],
      "TaxSubtotal": [
        {
          "TaxableAmount": [{ "_": 5000.00, "currencyID": "MYR" }],
          "TaxAmount": [{ "_": 500.00, "currencyID": "MYR" }],
          "TaxCategory": [
            {
              "ID": [{ "_": "01" }],
              "Percent": [{ "_": 10.00 }],
              "TaxScheme": [
                {
                  "ID": [{ "_": "OTH", "schemeID": "UN/ECE 5153", "schemeAgencyID": "6" }]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 8. 快速參考

### 8.1 稅率決策樹

```
稅率決策樹:
═══════════════════════════════════════════════════════════════════

是否有用戶覆寫？
    │
    ├── 是 → 使用覆寫稅率
    │
    └── 否 → 是否符合豁免條件？
                │
                ├── 是 → Tax Type: E, Rate: 0%
                │
                └── 否 → 檢查分類代碼
                            │
                            ├── 003 (電子產品) → Sales Tax 10%
                            ├── 005 (建築材料) → Sales Tax 5%
                            ├── 006 (墊付款項) → Not Applicable 0%
                            ├── 026 (出版物) → Exempt 0%
                            │
                            └── 其他 → 檢查領域
                                        │
                                        ├── FNB → Service Tax 6%
                                        ├── TOURISM → Service Tax 6%
                                        ├── PROF_SVC → Service Tax 8%
                                        │
                                        └── 預設 → Sales Tax 10%
```

---

*本模組為稅率自動化的核心邏輯，確保稅率計算準確且符合法規，同時保留用戶調整彈性。*
