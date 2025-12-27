# 03-CLASSIFICATION.md

# LHDN e-Invoice 分類代碼模組

> **Module Purpose**: 定義 LHDN 官方 45 個分類代碼，及其與商業領域、稅率的對應關係

---

## 模組聯動關係

```
01-INDUSTRY-CONFIG.md ──────┐
                            │
                            ▼
              ┌─────────────────────────┐
              │  本模組                 │
              │  (03-CLASSIFICATION)    │
              └─────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
   02-TAX-RATES       05-TAX-ENGINE     E-Invoice.md
   (稅率對應)         (自動選擇)        (提交)
```

---

## 1. 分類代碼概述

### 1.1 用途

Classification Code (分類代碼) 是 e-Invoice 的**必填欄位**，用於：

- 分類交易中的商品或服務性質
- 協助 IRBM (稅務局) 進行稅務分析和監控
- 確保發票數據標準化

### 1.2 格式規範

| 屬性 | 規範 |
|------|------|
| 長度 | 3 個字元 |
| 格式 | 數字 (001-045) |
| 總數 | 45 個代碼 |
| 更新 | SDK 定期更新 |

---

## 2. 完整分類代碼列表

### 2.1 按代碼排序

| Code | Description (EN) | 中文說明 | 常見行業 |
|------|------------------|----------|----------|
| **001** | Breastfeeding equipment | 母乳喂養設備 | 零售、醫療 |
| **002** | Child care centres and kindergartens fees | 托兒所和幼兒園費用 | 教育 |
| **003** | Computer, smartphone or tablet | 電腦、智慧手機或平板 | 零售、IT |
| **004** | Consolidated e-Invoice | 合併電子發票 | 所有 (B2C) |
| **005** | Construction materials | 建築材料 | 建築、批發 |
| **006** | Disbursement | 墊付款項 | 專業服務 |
| **007** | Donation | 捐贈 | 非營利 |
| **008** | e-Commerce - e-Invoice to buyer/purchaser | 電商 - 向買家開具發票 | 電商 |
| **009** | e-Commerce - Self-billed e-Invoice | 電商 - 自開發票 | 電商 |
| **010** | Education fees | 學費 | 教育 |
| **011** | Goods on consignment (Consignor) | 寄售商品 (寄售人) | 批發 |
| **012** | Goods on consignment (Consignee) | 寄售商品 (受託人) | 零售 |
| **013** | Gym membership | 健身房會員費 | 服務 |
| **014** | Insurance - Education & Medical benefits | 教育醫療保險 | 保險 |
| **015** | Life insurance or Takaful | 人壽保險/回教保險 | 保險 |
| **016** | Interest & financing charges | 利息及融資費用 | 金融 |
| **017** | Internet subscription | 網路訂閱費 | 電信 |
| **018** | Land and buildings | 土地和建築物 | 房地產 |
| **019** | Medical - Learning disabilities | 學習障礙醫療 | 醫療 |
| **020** | Medical examination or vaccination | 體檢或疫苗接種 | 醫療 |
| **021** | Medical expenses for serious diseases | 嚴重疾病醫療費用 | 醫療 |
| **022** | Others | 其他項目 | 所有 |
| **023** | Petroleum operations | 石油作業 | 石油 |
| **024** | Private retirement scheme | 私人退休計劃 | 金融 |
| **025** | Motor vehicle | 車輛 | 汽車 |
| **026** | Subscription - Publications | 出版物訂閱 | 出版 |
| **027** | Reimbursement | 報銷 | 所有 |
| **028** | Rental of motor vehicle | 車輛租賃 | 租賃 |
| **029** | EV charging facilities | 電動車充電設施 | 汽車、服務 |
| **030** | Repair and maintenance | 維修保養 | 服務 |
| **031** | Research and development | 研發 | 製造、IT |
| **032** | Foreign income | 海外收入 | 所有 |
| **033** | Self-billed - Betting and gaming | 自開發票 - 博彩 | 博彩 |
| **034** | Self-billed - Imported goods | 自開發票 - 進口商品 | 進口商 |
| **035** | Self-billed - Imported services | 自開發票 - 進口服務 | 所有 |
| **036** | Self-billed - Others | 自開發票 - 其他 | 所有 |
| **037** | Self-billed - Monetary to ADD | 自開發票 - 代理佣金 (金錢) | 銷售 |
| **038** | Sports activities & facilities | 體育活動及設施 | 體育 |
| **039** | Supporting equipment for disabled | 殘障輔助設備 | 醫療 |
| **040** | Voluntary contribution to provident fund | 自願公積金供款 | 金融 |
| **041** | Dental examination or treatment | 牙科檢查或治療 | 醫療 |
| **042** | Fertility treatment | 生育治療 | 醫療 |
| **043** | Treatment and care expenses | 護理及照護費用 | 醫療 |
| **044** | Voucher, gift card, loyalty points | 禮券、禮品卡、積分 | 零售 |
| **045** | Self-billed - Non-monetary to ADD | 自開發票 - 代理佣金 (非金錢) | 銷售 |

---

## 3. 按行業分類

### 3.1 零售業 (RETAIL)

```yaml
retail_classification_codes:
  primary:
    - code: "003"
      description: "Computer, smartphone or tablet"
      tax_type: "01"
      tax_rate: 10
      
    - code: "022"
      description: "Others"
      tax_type: "01"
      tax_rate: 10
      note: "通用代碼"
      
    - code: "025"
      description: "Motor vehicle"
      tax_type: "01"
      tax_rate: 10
      
    - code: "026"
      description: "Subscription - Publications"
      tax_type: "E"
      tax_rate: 0
      note: "書籍雜誌豁免"
      
    - code: "044"
      description: "Voucher, gift card, loyalty points"
      tax_type: "06"
      tax_rate: 0
      note: "禮券本身不課稅"
  
  secondary:
    - code: "004"
      description: "Consolidated e-Invoice"
      note: "B2C 合併發票"
      
    - code: "011"
      description: "Goods on consignment (Consignor)"
      
    - code: "012"
      description: "Goods on consignment (Consignee)"
```

### 3.2 電子商務 (ECOMM)

```yaml
ecommerce_classification_codes:
  primary:
    - code: "008"
      description: "e-Commerce - e-Invoice to buyer/purchaser"
      tax_type: "01"
      note: "平台向買家開具"
      
    - code: "009"
      description: "e-Commerce - Self-billed e-Invoice"
      tax_type: "01"
      note: "平台向賣家/物流開具自開發票"
      
  secondary:
    - code: "003"
      description: "Computer, smartphone or tablet"
      
    - code: "004"
      description: "Consolidated e-Invoice"
      
    - code: "022"
      description: "Others"
```

### 3.3 專業服務 (PROF_SVC)

```yaml
professional_services_classification_codes:
  primary:
    - code: "006"
      description: "Disbursement"
      tax_type: "06"
      note: "墊付款項通常不課稅"
      
    - code: "022"
      description: "Others"
      tax_type: "02"
      tax_rate: 8
      
    - code: "027"
      description: "Reimbursement"
      tax_type: "06"
      note: "報銷款項通常不課稅"
      
    - code: "031"
      description: "Research and development"
      tax_type: "02"
      tax_rate: 8
      
  secondary:
    - code: "016"
      description: "Interest & financing charges"
      
    - code: "030"
      description: "Repair and maintenance"
```

### 3.4 建築業 (CONST)

```yaml
construction_classification_codes:
  primary:
    - code: "005"
      description: "Construction materials"
      tax_type: "01"
      tax_rate: 5
      note: "依據 LPIPM Act 1994"
      
    - code: "018"
      description: "Land and buildings"
      tax_type: "varies"
      note: "視交易類型而定"
      
    - code: "022"
      description: "Others"
      tax_type: "02"
      tax_rate: 6
      note: "建築服務 2025年7月起"
      
    - code: "030"
      description: "Repair and maintenance"
      tax_type: "02"
      tax_rate: 8
```

### 3.5 醫療保健 (HEALTH)

```yaml
healthcare_classification_codes:
  primary:
    - code: "019"
      description: "Medical - Learning disabilities"
      tax_type: "E"
      note: "個人所得稅扣除"
      
    - code: "020"
      description: "Medical examination or vaccination"
      tax_type: "02"
      tax_rate: 6
      note: "外國人適用"
      
    - code: "021"
      description: "Medical expenses for serious diseases"
      tax_type: "E"
      note: "嚴重疾病豁免"
      
    - code: "041"
      description: "Dental examination or treatment"
      tax_type: "02"
      tax_rate: 6
      note: "外國人適用"
      
    - code: "042"
      description: "Fertility treatment"
      tax_type: "02"
      tax_rate: 6
      note: "外國人適用"
      
    - code: "043"
      description: "Treatment and care expenses"
      tax_type: "02"
      tax_rate: 6
      note: "外國人適用"
      
    - code: "039"
      description: "Supporting equipment for disabled"
      tax_type: "E"
      note: "殘障輔助設備豁免"
```

### 3.6 教育 (EDU)

```yaml
education_classification_codes:
  primary:
    - code: "002"
      description: "Child care centres and kindergartens fees"
      tax_type: "E"
      note: "馬來西亞公民豁免"
      
    - code: "010"
      description: "Education fees"
      tax_type: "02"
      tax_rate: 6
      note: "國際學生適用"
      
    - code: "014"
      description: "Insurance - Education & Medical benefits"
      tax_type: "02"
      tax_rate: 8
```

### 3.7 旅遊酒店 (TOURISM)

```yaml
tourism_classification_codes:
  primary:
    - code: "022"
      description: "Others"
      tax_type: "02"
      tax_rate: 6
      note: "住宿服務"
      
    - code: "004"
      description: "Consolidated e-Invoice"
      note: "B2C 合併發票"
      
  special:
    - tourism_tax:
        tax_type: "03"
        rate: "RM10/room/night"
        note: "另需收取旅遊稅"
```

### 3.8 金融服務 (FINANCE)

```yaml
finance_classification_codes:
  primary:
    - code: "015"
      description: "Life insurance or Takaful"
      tax_type: "02"
      tax_rate: 8
      
    - code: "016"
      description: "Interest & financing charges"
      tax_type: "02"
      tax_rate: 8
      note: "2025年7月起部分納入"
      
    - code: "024"
      description: "Private retirement scheme"
      tax_type: "E"
      note: "個人所得稅扣除"
      
    - code: "040"
      description: "Voluntary contribution to provident fund"
      tax_type: "E"
      note: "個人所得稅扣除"
```

### 3.9 自開發票專用

```yaml
self_billed_classification_codes:
  codes:
    - code: "009"
      description: "e-Commerce - Self-billed e-Invoice"
      use_case: "電商平台向賣家開具"
      
    - code: "033"
      description: "Self-billed - Betting and gaming"
      use_case: "博彩公司向中獎者開具"
      
    - code: "034"
      description: "Self-billed - Imported goods"
      use_case: "進口商向外國供應商開具"
      
    - code: "035"
      description: "Self-billed - Imported services"
      use_case: "購買外國服務時開具"
      
    - code: "036"
      description: "Self-billed - Others"
      use_case: "其他自開發票場景"
      
    - code: "037"
      description: "Self-billed - Monetary to ADD"
      use_case: "向代理/經銷商支付金錢佣金"
      
    - code: "045"
      description: "Self-billed - Non-monetary to ADD"
      use_case: "向代理/經銷商支付非金錢獎勵"
```

---

## 4. 稅率對應關係

### 4.1 分類代碼與稅率對應表

| Code | Tax Type | Default Rate | Notes |
|------|----------|--------------|-------|
| 001 | E | 0% | 母嬰用品豁免 |
| 002 | E | 0% | 教育豁免 (國民) |
| 003 | 01 | 10% | 電子產品 |
| 004 | - | - | 合併發票 (視內容) |
| 005 | 01 | 5% | 建築材料減免 |
| 006 | 06 | 0% | 墊付不課稅 |
| 007 | E | 0% | 捐贈豁免 |
| 008 | 01 | 10% | 電商銷售 |
| 009 | 01/02 | varies | 電商自開 |
| 010 | 02 | 6% | 教育服務 (外國人) |
| 011 | 01 | 10% | 寄售商品 |
| 012 | 01 | 10% | 寄售商品 |
| 013 | 02 | 8% | 健身服務 |
| 014 | 02 | 8% | 保險 |
| 015 | 02 | 8% | 人壽保險 |
| 016 | 02 | 8% | 金融服務 |
| 017 | 02 | 6% | 電信服務 |
| 018 | varies | varies | 房地產 |
| 019 | E | 0% | 學習障礙醫療 |
| 020 | 02 | 6% | 醫療服務 |
| 021 | E | 0% | 嚴重疾病醫療 |
| 022 | varies | varies | 通用代碼 |
| 023 | 01 | 10% | 石油作業 |
| 024 | E | 0% | 退休計劃 |
| 025 | 01 | 10% | 車輛 |
| 026 | E | 0% | 出版物豁免 |
| 027 | 06 | 0% | 報銷不課稅 |
| 028 | 02 | 8% | 車輛租賃 |
| 029 | varies | varies | 電動車設施 |
| 030 | 02 | 8% | 維修服務 |
| 031 | 02 | 8% | 研發服務 |
| 032 | varies | varies | 海外收入 |
| 033 | varies | varies | 博彩自開 |
| 034 | 01 | 10% | 進口商品 |
| 035 | 02 | 8% | 進口服務 |
| 036 | varies | varies | 其他自開 |
| 037 | varies | varies | 代理佣金 |
| 038 | E | 0% | 體育活動 |
| 039 | E | 0% | 殘障輔助 |
| 040 | E | 0% | 公積金 |
| 041 | 02 | 6% | 牙科服務 |
| 042 | 02 | 6% | 生育治療 |
| 043 | 02 | 6% | 護理服務 |
| 044 | 06 | 0% | 禮券 |
| 045 | varies | varies | 非金錢佣金 |

---

## 5. 資料結構

### 5.1 資料庫 Schema

```sql
-- 分類代碼主表
CREATE TABLE classification_codes (
    code                    VARCHAR(10) PRIMARY KEY,
    description_en          VARCHAR(300) NOT NULL,
    description_zh          VARCHAR(300),
    description_ms          VARCHAR(300),
    
    -- 預設稅率
    default_tax_type        VARCHAR(10),
    default_tax_rate        DECIMAL(5,2),
    
    -- 分類
    category                VARCHAR(50),  -- 'GOODS', 'SERVICES', 'SELF_BILLED', 'SPECIAL'
    
    -- 行業關聯
    primary_industries      JSONB,  -- ['RETAIL', 'ECOMM']
    
    -- 備註
    notes                   TEXT,
    
    -- 狀態
    is_active               BOOLEAN DEFAULT true,
    effective_from          DATE DEFAULT CURRENT_DATE,
    effective_to            DATE,
    
    -- 審計
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 分類代碼稅率規則
CREATE TABLE classification_tax_rules (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classification_code     VARCHAR(10) REFERENCES classification_codes(code),
    
    -- 條件
    industry_code           VARCHAR(20),
    buyer_type              VARCHAR(20),  -- 'B2B', 'B2C', 'B2G'
    buyer_nationality       VARCHAR(20),  -- 'MALAYSIAN', 'PR', 'FOREIGNER'
    
    -- 適用稅率
    tax_type                VARCHAR(10) NOT NULL,
    tax_rate                DECIMAL(5,2),
    
    -- 豁免
    is_exempt               BOOLEAN DEFAULT false,
    exemption_code          VARCHAR(20),
    exemption_reason        VARCHAR(500),
    
    -- 優先順序
    priority                INTEGER DEFAULT 0,
    
    -- 有效期
    effective_from          DATE NOT NULL,
    effective_to            DATE
);

-- 初始數據 (部分範例)
INSERT INTO classification_codes (code, description_en, description_zh, default_tax_type, default_tax_rate, category, primary_industries) VALUES
('001', 'Breastfeeding equipment', '母乳喂養設備', 'E', 0, 'GOODS', '["RETAIL", "HEALTH"]'),
('002', 'Child care centres and kindergartens fees', '托兒所和幼兒園費用', 'E', 0, 'SERVICES', '["EDU"]'),
('003', 'Computer, smartphone or tablet', '電腦、智慧手機或平板', '01', 10, 'GOODS', '["RETAIL", "IT"]'),
('004', 'Consolidated e-Invoice', '合併電子發票', NULL, NULL, 'SPECIAL', '["ALL"]'),
('005', 'Construction materials', '建築材料', '01', 5, 'GOODS', '["CONST", "WHOLESALE"]'),
('006', 'Disbursement', '墊付款項', '06', 0, 'SPECIAL', '["PROF_SVC"]'),
('007', 'Donation', '捐贈', 'E', 0, 'SPECIAL', '["ALL"]'),
('008', 'e-Commerce - e-Invoice to buyer/purchaser', '電商-向買家開具發票', '01', 10, 'GOODS', '["ECOMM"]'),
('009', 'e-Commerce - Self-billed e-Invoice', '電商-自開發票', '01', 10, 'SELF_BILLED', '["ECOMM"]'),
('022', 'Others', '其他項目', NULL, NULL, 'GOODS', '["ALL"]');
```

### 5.2 TypeScript 介面

```typescript
interface ClassificationCode {
  code: string;
  descriptionEn: string;
  descriptionZh: string;
  descriptionMs: string;
  
  defaultTaxType: string | null;
  defaultTaxRate: number | null;
  
  category: 'GOODS' | 'SERVICES' | 'SELF_BILLED' | 'SPECIAL';
  primaryIndustries: string[];
  
  notes: string | null;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

interface ClassificationTaxRule {
  classificationCode: string;
  industryCode: string | null;
  buyerType: 'B2B' | 'B2C' | 'B2G' | null;
  buyerNationality: 'MALAYSIAN' | 'PR' | 'FOREIGNER' | null;
  
  taxType: string;
  taxRate: number | null;
  
  isExempt: boolean;
  exemptionCode: string | null;
  exemptionReason: string | null;
  
  priority: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

// 分類代碼選擇請求
interface ClassificationSelectionRequest {
  industryCode: string;
  productDescription: string;
  isSelfBilled: boolean;
  transactionType: 'SALE' | 'PURCHASE' | 'IMPORT' | 'EXPORT';
}

// 分類代碼選擇結果
interface ClassificationSelectionResult {
  suggestedCodes: Array<{
    code: string;
    description: string;
    matchScore: number;
    taxType: string;
    taxRate: number;
    reason: string;
  }>;
  defaultCode: string;
}
```

---

## 6. 使用指南

### 6.1 如何選擇分類代碼

```
分類代碼選擇流程:
═══════════════════════════════════════════════════════════════════

                         開始
                           │
                           ▼
              ┌────────────────────────┐
              │ 是否為自開發票？        │
              └────────────────────────┘
                    │            │
                   是            否
                    │            │
                    ▼            ▼
        ┌─────────────────┐  ┌─────────────────┐
        │ 選擇自開發票代碼 │  │ 判斷商品/服務   │
        │ (033-037, 045)  │  │ 類型            │
        └─────────────────┘  └─────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
            ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
            │ 有專屬代碼？ │  │ 是否電商？   │  │ 使用通用代碼│
            │ (001-043)   │  │             │  │ 022         │
            └─────────────┘  └─────────────┘  └─────────────┘
                    │                │
                   是               是
                    │                │
                    ▼                ▼
            ┌─────────────┐  ┌─────────────┐
            │ 使用專屬代碼 │  │ 使用 008    │
            └─────────────┘  └─────────────┘
```

### 6.2 常見場景對應

| 場景 | 推薦代碼 | 說明 |
|------|----------|------|
| 銷售電腦/手機 | 003 | 電子產品 |
| 餐廳餐飲 | 022 | 通用代碼 + 服務稅 6% |
| 法律顧問費 | 022 | 通用代碼 + 服務稅 8% |
| 水泥/鋼筋銷售 | 005 | 建築材料 |
| 網購平台銷售 | 008 | 電商專用 |
| 支付物流費 (電商) | 009 | 電商自開發票 |
| 進口商品 | 034 | 自開發票-進口商品 |
| 向外國供應商購買服務 | 035 | 自開發票-進口服務 |
| 支付代理佣金 | 037 | 自開發票-代理金錢佣金 |
| 酒店住宿 | 022 | 通用 + 服務稅 6% + 旅遊稅 |
| 私人診所服務 | 020/021 | 醫療服務 |
| 國際學校學費 | 010 | 教育費用 |
| B2C 月結發票 | 004 | 合併電子發票 |

---

## 7. 與其他模組的聯動

### 7.1 ← 從 01-INDUSTRY-CONFIG.md 接收

```json
{
  "industryCode": "RETAIL",
  "primaryClassificationCodes": ["003", "022", "025", "026"]
}
```

### 7.2 → 輸出至 05-TAX-ENGINE.md

```json
{
  "classificationCode": "003",
  "taxRules": [
    {
      "condition": "default",
      "taxType": "01",
      "taxRate": 10
    }
  ]
}
```

### 7.3 → 輸出至 E-Invoice.md

```json
{
  "invoiceLine": {
    "classificationCode": "003",
    "description": "iPhone 15 Pro Max",
    "taxType": "01",
    "taxRate": 10
  }
}
```

---

## 8. 官方資源

| 資源 | 連結 |
|------|------|
| LHDN SDK Classification Codes | https://sdk.myinvois.hasil.gov.my/codes/classification-codes/ |
| e-Invoice Guideline | https://www.hasil.gov.my/media/fzagbaj2/irbm-e-invoice-guideline.pdf |

---

*本模組定義 LHDN 官方 45 個分類代碼及其使用規則。代碼可能隨 SDK 更新而變更，請定期查閱官方文檔。*
