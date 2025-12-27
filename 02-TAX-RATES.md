# 02-TAX-RATES.md

# 馬來西亞 SST 稅率規範模組

> **Module Purpose**: 定義馬來西亞 Sales and Service Tax (SST) 完整稅率結構、適用規則和豁免條件

---

## 模組聯動關係

```
                    01-INDUSTRY-CONFIG.md
                           │
                           │ (接收領域配置)
                           ▼
               ┌───────────────────────┐
               │  本模組               │
               │  (02-TAX-RATES)       │
               └───────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   03-CLASSIFICATION  05-TAX-ENGINE   E-Invoice.md
   (稅率對應)         (計算規則)      (最終提交)
```

---

## 1. SST 制度概述

### 1.1 SST 組成

馬來西亞 SST (Sales and Service Tax) 自 2018年9月1日 重新實施，取代 GST，由兩個獨立稅種組成：

| 稅種 | 英文 | 徵收對象 | 主管機關 |
|------|------|----------|----------|
| **銷售稅** | Sales Tax | 製造或進口的應稅商品 | RMCD (關稅局) |
| **服務稅** | Service Tax | 特定服務 | RMCD (關稅局) |

### 1.2 重要時間節點

| 日期 | 事件 |
|------|------|
| 2018-09-01 | SST 重新實施 |
| 2024-03-01 | 服務稅從 6% 調整至 8% (部分服務維持 6%) |
| 2024-01-01 | 低價商品銷售稅 (LVG) 實施 |
| 2025-07-01 | SST 範圍擴大 (建築、金融、醫療、教育等) |

---

## 2. 銷售稅 (Sales Tax)

### 2.1 稅率結構

| 稅率 | 適用商品類別 | e-Invoice Tax Type Code |
|------|--------------|------------------------|
| **10%** | 一般應稅商品 (標準稅率) | `01` |
| **5%** | 特定減免商品 | `01` |
| **0%** | 出口商品、豁免商品 | `06` 或 `E` |

### 2.2 10% 銷售稅商品 (標準稅率)

適用於大多數非必需品和奢侈品：

```yaml
sales_tax_10_percent:
  categories:
    - name: "電子產品"
      examples:
        - "電視機"
        - "音響設備"
        - "家用電器"
      hsCode_range: "8518-8528"
    
    - name: "車輛及零件"
      examples:
        - "汽車"
        - "摩托車"
        - "車輛零件"
      hsCode_range: "8701-8716"
    
    - name: "化妝品及香水"
      examples:
        - "護膚品"
        - "彩妝"
        - "香水"
      hsCode_range: "3303-3307"
    
    - name: "酒精飲料"
      examples:
        - "啤酒"
        - "葡萄酒"
        - "烈酒"
      hsCode_range: "2203-2208"
    
    - name: "煙草製品"
      examples:
        - "香煙"
        - "雪茄"
      hsCode_range: "2401-2403"
    
    - name: "珠寶首飾"
      examples:
        - "金飾"
        - "鑽石"
        - "手錶 (奢侈品)"
      hsCode_range: "7113-7118"
    
    - name: "奢侈食品 (2025年7月起)"
      examples:
        - "帝王蟹"
        - "三文魚"
        - "鱈魚"
        - "松露"
        - "進口蘑菇"
      note: "2025年7月前為 0%，之後調整為 5% 或 10%"
```

### 2.3 5% 銷售稅商品 (減免稅率)

```yaml
sales_tax_5_percent:
  categories:
    - name: "石油產品"
      examples:
        - "汽油"
        - "柴油"
        - "潤滑油"
      hsCode_range: "2710"
    
    - name: "建築材料"
      examples:
        - "水泥"
        - "鋼筋"
        - "磚塊"
        - "木材"
      note: "依據 LPIPM Act 1994 Fourth Schedule"
      classification_code: "005"
    
    - name: "食品加工設備"
      examples:
        - "食品加工機械"
    
    - name: "鐘錶 (非奢侈品)"
      examples:
        - "普通手錶"
    
    - name: "特定工業機械 (2025年7月起)"
      examples:
        - "工業機械設備"
      note: "原為 0%，2025年7月起調整為 5%"
    
    - name: "精油 (2025年7月起)"
      examples:
        - "香精油"
      note: "原為 0%，2025年7月起調整為 5%"
    
    - name: "絲綢布料 (2025年7月起)"
      examples:
        - "絲綢製品"
      note: "原為 0%，2025年7月起調整為 5%"
```

### 2.4 豁免銷售稅商品 (0%)

```yaml
sales_tax_exempt:
  categories:
    - name: "基本食品"
      items:
        - "米"
        - "麵粉"
        - "麵包"
        - "食用油"
        - "雞蛋"
        - "牛奶 (鮮奶、奶粉)"
        - "嬰兒食品"
        - "糖"
        - "鹽"
      note: "2025年7月後維持豁免"
    
    - name: "生鮮食品"
      items:
        - "活禽"
        - "活魚"
        - "新鮮蔬菜"
        - "新鮮水果 (本地)"
        - "新鮮肉類 (雞肉、牛肉、羊肉)"
        - "新鮮海鮮 (本地魚類)"
      exempt_fish:
        - "Selar (黃尾鰺)"
        - "Tongkol (鰹魚)"
        - "Cencaru (竹莢魚)"
        - "Sardines (沙丁魚)"
        - "Kembung (鯖魚)"
      note: "進口高價海鮮 (帝王蟹、三文魚等) 2025年7月起需課稅"
    
    - name: "進口水果豁免 (2025年7月起)"
      items:
        - "橙子 (Oranges)"
        - "蘋果 (Apples)"
        - "柑橘 (Mandarin oranges)"
        - "椰棗 (Kurma/Dates)"
      note: "財政部特別豁免"
    
    - name: "書籍及出版物"
      items:
        - "書籍"
        - "雜誌"
        - "報紙"
        - "期刊"
      classification_code: "026"
    
    - name: "藥品及醫療用品"
      items:
        - "處方藥"
        - "非處方藥"
        - "醫療設備"
        - "輪椅"
        - "助聽器"
      classification_code: "039"
    
    - name: "教育用品"
      items:
        - "教科書"
        - "練習簿"
        - "學校制服"
    
    - name: "農業用品"
      items:
        - "種子"
        - "肥料"
        - "農藥"
        - "農業機械"
    
    - name: "自行車及配件"
      items:
        - "自行車"
        - "自行車零件"
      note: "不包括競賽自行車 (2025年7月起競賽自行車 10%)"
    
    - name: "出口商品"
      items:
        - "所有出口商品"
      note: "出口豁免銷售稅"
```

### 2.5 低價商品銷售稅 (LVG Tax)

自 2024年1月1日 起實施：

```yaml
low_value_goods_tax:
  rate: 10
  threshold: "RM 500"  # 單件商品價值
  applies_to:
    - "透過線上平台進口的低價商品"
    - "由外國賣家直接寄送給馬來西亞消費者"
  exemptions:
    - "煙草產品"
    - "酒精飲料"
    - "已適用其他稅的商品"
  
  e_invoice_handling:
    tax_type_code: "05"  # Sales Tax on Low Value Goods
    classification_code: "034"  # 進口商品自開發票
```

---

## 3. 服務稅 (Service Tax)

### 3.1 稅率結構

| 稅率 | 適用服務類別 | 生效日期 | e-Invoice Tax Type Code |
|------|--------------|----------|------------------------|
| **8%** | 一般應稅服務 | 2024-03-01 起 | `02` |
| **6%** | 特定服務 (餐飲、電信等) | 維持不變 | `02` |
| **0%** | 豁免服務 | - | `06` 或 `E` |

### 3.2 8% 服務稅 (標準稅率)

自 2024年3月1日 起適用：

```yaml
service_tax_8_percent:
  registration_threshold: "RM 500,000"  # 年營業額
  
  service_groups:
    - group: "A"
      name: "酒店及住宿"
      note: "服務稅 6% (非 8%)"
      
    - group: "B"
      name: "保險及伊斯蘭保險"
      rate: 8
      examples:
        - "一般保險"
        - "Takaful"
      
    - group: "C"
      name: "博彩及遊戲"
      rate: 8
      examples:
        - "賭場"
        - "投注服務"
      
    - group: "D"
      name: "專業服務"
      rate: 8
      examples:
        - "法律服務"
        - "會計服務"
        - "工程顧問"
        - "建築設計"
        - "IT 服務"
        - "管理顧問"
      
    - group: "E"
      name: "信用卡及收費卡"
      rate: 8
      
    - group: "F"
      name: "維修及保養"
      rate: 8
      examples:
        - "車輛維修"
        - "設備保養"
      classification_code: "030"
      
    - group: "G"
      name: "其他應稅服務"
      rate: 8
      examples:
        - "廣告服務"
        - "清潔服務"
        - "保安服務"
        - "就業仲介"
      
    - group: "H"
      name: "數位服務"
      rate: 8
      examples:
        - "串流媒體"
        - "線上廣告"
        - "雲端服務"
        - "軟體訂閱"
      
    - group: "I"
      name: "經紀及承銷服務"
      rate: 8
      
    - group: "J"
      name: "物流服務"
      note: "服務稅 6% (非 8%)"
```

### 3.3 6% 服務稅 (特別稅率)

維持較低稅率的服務：

```yaml
service_tax_6_percent:
  services:
    - name: "餐飲服務"
      examples:
        - "餐廳"
        - "咖啡店"
        - "快餐店"
        - "外賣服務"
      note: "維持 6%，非 8%"
      
    - name: "電信服務"
      examples:
        - "手機通訊"
        - "網路服務"
        - "固網電話"
      classification_code: "017"
      
    - name: "停車服務"
      examples:
        - "停車場"
        - "代客泊車"
      
    - name: "物流服務"
      examples:
        - "快遞"
        - "貨運"
        - "倉儲"
      
    - name: "住宿服務"
      examples:
        - "酒店"
        - "度假村"
        - "民宿"
      note: "另需收取 Tourism Tax RM10/房/晚"
```

### 3.4 2025年7月起新增服務稅範圍

```yaml
service_tax_expansion_july_2025:
  effective_date: "2025-07-01"
  grace_period: "至 2025-12-31 無罰款"
  
  new_taxable_services:
    - name: "租賃服務"
      rate: 8
      threshold: "RM 1,000,000"  # 年收入門檻
      examples:
        - "設備租賃"
        - "車輛租賃"
        - "財產租賃"
      classification_code: "028"
      
    - name: "建築服務"
      rate: 6
      examples:
        - "建築工程"
        - "裝修工程"
        - "水電安裝"
      note: "此前建築服務免服務稅"
      
    - name: "金融服務"
      rate: 8
      examples:
        - "貸款利息 (部分)"
        - "金融顧問"
      classification_code: "016"
      note: "部分豁免以避免級聯效應"
      
    - name: "私人醫療服務"
      rate: 6
      exemption: "馬來西亞公民豁免"
      applies_to: "外國人/遊客"
      examples:
        - "私人醫院"
        - "私人診所"
        - "專科服務"
      
    - name: "私人教育服務"
      rate: 6
      exemption: "馬來西亞公民及永久居民豁免"
      applies_to: "國際學生"
      examples:
        - "國際學校"
        - "私立大學"
        - "語言培訓中心"
      
    - name: "美容服務"
      rate: 8
      examples:
        - "美容院"
        - "髮型屋"
        - "水療中心"
        - "紋身服務"
```

### 3.5 豁免服務稅

```yaml
service_tax_exempt:
  categories:
    - name: "政府服務"
      items:
        - "政府部門提供的服務"
        - "法定機構服務"
    
    - name: "教育服務 (國民)"
      items:
        - "馬來西亞公民及永久居民的教育"
      note: "國際學生除外"
    
    - name: "醫療服務 (國民)"
      items:
        - "馬來西亞公民的私人醫療"
      note: "外國人除外"
    
    - name: "金融服務 (部分)"
      items:
        - "存款服務"
        - "外匯交易 (特定)"
    
    - name: "出口服務"
      items:
        - "向非居民提供的服務"
        - "在馬來西亞境外提供的服務"
```

---

## 4. 旅遊稅 (Tourism Tax)

### 4.1 概述

```yaml
tourism_tax:
  rate: "RM 10 per room per night"
  effective_date: "2017-09-01"
  
  applies_to:
    - "酒店"
    - "度假村"
    - "服務公寓"
    - "民宿 (已註冊)"
    - "其他住宿設施"
  
  exemptions:
    - "馬來西亞公民"
    - "永久居民"
    - "政府住宿"
  
  registration:
    authority: "Tourism Malaysia"
    portal: "MyTTx"
  
  e_invoice:
    tax_type_code: "03"
    include_in_invoice: true
    separate_line_item: true
```

### 4.2 e-Invoice 處理

```json
{
  "invoiceLine": [
    {
      "description": "Room - Deluxe Double",
      "quantity": 2,
      "unitPrice": 350.00,
      "taxType": "02",
      "taxRate": 6,
      "taxAmount": 42.00
    },
    {
      "description": "Tourism Tax",
      "quantity": 2,
      "unitPrice": 10.00,
      "taxType": "03",
      "taxRate": 0,
      "taxAmount": 0,
      "note": "RM10 per room per night x 2 nights"
    }
  ]
}
```

---

## 5. 高價商品稅 (High-Value Goods Tax)

### 5.1 概述

```yaml
high_value_goods_tax:
  rate: "5% - 10%"
  
  applicable_items:
    - name: "高價珠寶"
      threshold: "> RM 10,000"
      rate: 5
    
    - name: "高價手錶"
      threshold: "> RM 20,000"
      rate: 5
    
    - name: "高價手提包"
      threshold: "> RM 10,000"
      rate: 5
  
  e_invoice:
    tax_type_code: "04"
```

---

## 6. e-Invoice 稅類代碼對應

### 6.1 Tax Type Codes

| Code | Description | 中文說明 |
|------|-------------|----------|
| `01` | Sales Tax | 銷售稅 (5% 或 10%) |
| `02` | Service Tax | 服務稅 (6% 或 8%) |
| `03` | Tourism Tax | 旅遊稅 (RM10/房/晚) |
| `04` | High-Value Goods Tax | 高價商品稅 |
| `05` | Sales Tax on Low Value Goods | 低價商品銷售稅 (10%) |
| `06` | Not Applicable | 不適用 |
| `E` | Tax Exempt | 豁免 |

### 6.2 Tax Exemption Detail Codes

當 Tax Type 為 `E` (豁免) 時，需指定豁免原因：

| Code | Description | 使用場景 |
|------|-------------|----------|
| `EXSST-01` | Sales Tax Exemption Certificate | 持有銷售稅豁免證書 |
| `EXSST-02` | Tax-free area exemption | 免稅區豁免 |
| `EXSST-03` | Approved Trader Scheme | 認可貿易商計劃 |
| `EXSVT-01` | Service Tax Exemption | 服務稅豁免 |
| `EXSVT-02` | Group relief | 集團豁免 |
| `OTHER` | Other exemption | 其他豁免 (需說明) |

---

## 7. 資料結構

### 7.1 稅率配置 Schema

```sql
-- 稅率主表
CREATE TABLE tax_rates (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_type_code           VARCHAR(10) NOT NULL,
    tax_type_name           VARCHAR(100) NOT NULL,
    
    -- 稅率
    standard_rate           DECIMAL(5,2),
    reduced_rate            DECIMAL(5,2),
    special_rate            VARCHAR(50),  -- 如 "RM10/room/night"
    
    -- 適用條件
    effective_from          DATE NOT NULL,
    effective_to            DATE,
    
    -- 註冊門檻
    registration_threshold  DECIMAL(18,2),
    
    -- 審計
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 稅率適用規則
CREATE TABLE tax_rate_rules (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_rate_id             UUID REFERENCES tax_rates(id),
    
    -- 規則條件
    industry_code           VARCHAR(20),
    classification_code     VARCHAR(10),
    product_category        VARCHAR(100),
    
    -- 適用稅率
    applicable_rate         DECIMAL(5,2) NOT NULL,
    
    -- 豁免條件
    exemption_condition     VARCHAR(500),
    exemption_code          VARCHAR(20),
    
    -- 優先順序
    priority                INTEGER DEFAULT 0,
    
    -- 有效期
    effective_from          DATE NOT NULL,
    effective_to            DATE
);

-- 豁免項目表
CREATE TABLE tax_exemptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_type_code           VARCHAR(10) NOT NULL,
    
    -- 豁免項目
    item_category           VARCHAR(100) NOT NULL,
    item_description        VARCHAR(500),
    hs_code_range           VARCHAR(50),
    classification_code     VARCHAR(10),
    
    -- 豁免依據
    legal_reference         VARCHAR(200),
    exemption_reason_code   VARCHAR(20),
    
    -- 有效期
    effective_from          DATE NOT NULL,
    effective_to            DATE
);

-- 初始數據
INSERT INTO tax_rates (tax_type_code, tax_type_name, standard_rate, reduced_rate, effective_from, registration_threshold) VALUES
('01', 'Sales Tax', 10.00, 5.00, '2018-09-01', 500000),
('02', 'Service Tax', 8.00, 6.00, '2024-03-01', 500000),
('03', 'Tourism Tax', NULL, NULL, '2017-09-01', NULL),
('04', 'High-Value Goods Tax', 10.00, 5.00, '2018-09-01', NULL),
('05', 'Sales Tax on Low Value Goods', 10.00, NULL, '2024-01-01', NULL);
```

### 7.2 TypeScript 介面

```typescript
interface TaxRate {
  taxTypeCode: string;
  taxTypeName: string;
  standardRate: number | null;
  reducedRate: number | null;
  specialRate: string | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  registrationThreshold: number | null;
}

interface TaxRateRule {
  taxRateId: string;
  industryCode: string | null;
  classificationCode: string | null;
  productCategory: string | null;
  applicableRate: number;
  exemptionCondition: string | null;
  exemptionCode: string | null;
  priority: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

interface TaxExemption {
  taxTypeCode: string;
  itemCategory: string;
  itemDescription: string | null;
  hsCodeRange: string | null;
  classificationCode: string | null;
  legalReference: string | null;
  exemptionReasonCode: string | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

// 稅率計算請求
interface TaxCalculationRequest {
  industryCode: string;
  classificationCode: string;
  productDescription: string;
  unitPrice: number;
  quantity: number;
  buyerType: 'B2B' | 'B2C' | 'B2G';
  buyerNationality: 'MALAYSIAN' | 'PR' | 'FOREIGNER';
  transactionDate: Date;
}

// 稅率計算結果
interface TaxCalculationResult {
  taxTypeCode: string;
  taxTypeName: string;
  taxRate: number;
  taxAmount: number;
  isExempt: boolean;
  exemptionCode: string | null;
  exemptionReason: string | null;
  
  // 審計資訊
  appliedRule: string;
  ruleSource: string;
}
```

---

## 8. 與其他模組的聯動

### 8.1 ← 從 01-INDUSTRY-CONFIG.md 接收

```json
{
  "industryCode": "FNB",
  "applicableTaxes": {
    "salesTax": { "enabled": false },
    "serviceTax": { "enabled": true, "defaultRate": 6 },
    "tourismTax": { "enabled": false }
  }
}
```

### 8.2 → 輸出至 03-CLASSIFICATION.md

```json
{
  "classificationCode": "022",
  "defaultTaxType": "02",
  "defaultTaxRate": 6,
  "industrySpecificRules": [
    {
      "condition": "industry == 'FNB'",
      "taxRate": 6,
      "note": "餐飲服務維持 6%"
    }
  ]
}
```

### 8.3 → 輸出至 05-TAX-ENGINE.md

```json
{
  "taxRules": [
    {
      "taxTypeCode": "02",
      "conditions": {
        "industryCode": "FNB",
        "serviceType": "F&B"
      },
      "rate": 6,
      "priority": 1
    },
    {
      "taxTypeCode": "02",
      "conditions": {
        "default": true
      },
      "rate": 8,
      "priority": 0
    }
  ]
}
```

---

## 9. 快速參考表

### 9.1 銷售稅速查

| 商品類別 | 稅率 | Tax Type Code |
|----------|------|---------------|
| 一般商品 | 10% | 01 |
| 石油產品 | 5% | 01 |
| 建築材料 | 5% | 01 |
| 基本食品 | 0% | E/06 |
| 出口商品 | 0% | E/06 |

### 9.2 服務稅速查

| 服務類別 | 稅率 | 備註 |
|----------|------|------|
| 餐飲服務 | 6% | 維持 6% |
| 電信服務 | 6% | 維持 6% |
| 物流服務 | 6% | 維持 6% |
| 住宿服務 | 6% | + Tourism Tax |
| 專業服務 | 8% | 2024-03 起 |
| 數位服務 | 8% | 2024-03 起 |
| 建築服務 | 6% | 2025-07 起新增 |
| 私人醫療 (外國人) | 6% | 2025-07 起新增 |
| 私人教育 (國際生) | 6% | 2025-07 起新增 |

---

## 10. 官方資源

| 資源 | 連結 |
|------|------|
| RMCD MySST Portal | https://mysst.customs.gov.my |
| SST 法規 | Sales Tax Act 2018, Service Tax Act 2018 |
| LHDN e-Invoice SDK | https://sdk.myinvois.hasil.gov.my/codes/tax-types/ |
| 2025 預算案 SST 變更 | https://www.mof.gov.my |

---

*本模組定義馬來西亞完整 SST 稅率結構，供稅率自動化引擎使用。所有稅率以 RMCD/LHDN 官方規範為準。*
