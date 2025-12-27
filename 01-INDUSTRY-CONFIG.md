# 01-INDUSTRY-CONFIG.md

# 商業領域配置模組

> **Module Purpose**: 定義用戶公司所屬商業領域，並根據領域自動配置適用的功能、稅率和分類代碼

---

## 模組聯動關係

```
本模組 (01-INDUSTRY-CONFIG)
        │
        ├──▶ 02-TAX-RATES.md      (輸出: 適用稅率清單)
        ├──▶ 03-CLASSIFICATION.md (輸出: 相關分類代碼)
        ├──▶ 04-MSIC-CODES.md     (輸出: 建議 MSIC 代碼)
        └──▶ 05-TAX-ENGINE.md     (輸出: 稅率計算規則)
```

---

## 1. 商業領域定義

### 1.1 主要領域分類

系統定義 15 個主要商業領域，涵蓋馬來西亞主要經濟活動：

| 領域代碼 | 領域名稱 (EN) | 領域名稱 (中文) | MSIC 範圍 |
|----------|---------------|-----------------|-----------|
| `RETAIL` | Retail Trade | 零售業 | 47xxx |
| `FNB` | Food & Beverage | 餐飲業 | 56xxx |
| `PROF_SVC` | Professional Services | 專業服務 | 69xxx-74xxx |
| `MANU` | Manufacturing | 製造業 | 10xxx-33xxx |
| `CONST` | Construction | 建築業 | 41xxx-43xxx |
| `WHOLESALE` | Wholesale Trade | 批發業 | 45xxx-46xxx |
| `ECOMM` | E-Commerce | 電子商務 | 47xxx (online) |
| `TOURISM` | Tourism & Hospitality | 旅遊酒店 | 55xxx, 79xxx |
| `HEALTH` | Healthcare | 醫療保健 | 86xxx |
| `EDU` | Education | 教育 | 85xxx |
| `FINANCE` | Financial Services | 金融服務 | 64xxx-66xxx |
| `TRANSPORT` | Transportation & Logistics | 運輸物流 | 49xxx-53xxx |
| `IT` | Information Technology | 資訊科技 | 62xxx-63xxx |
| `REALESTATE` | Real Estate | 房地產 | 68xxx |
| `OTHERS` | Others | 其他 | 其他 |

### 1.2 領域選擇邏輯

```
用戶初始化流程:
═══════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────────┐
│ Q1: 請選擇您公司的主要商業活動                                    │
│                                                                  │
│   ○ 銷售商品給消費者 (零售)                                      │
│   ○ 銷售商品給企業 (批發)                                        │
│   ○ 提供餐飲服務                                                 │
│   ○ 提供專業服務 (法律、會計、顧問等)                            │
│   ○ 製造產品                                                     │
│   ○ 建築/工程                                                    │
│   ○ 線上銷售 (電子商務)                                          │
│   ○ 酒店/旅遊服務                                                │
│   ○ 醫療/保健服務                                                │
│   ○ 教育服務                                                     │
│   ○ 金融服務                                                     │
│   ○ 運輸/物流                                                    │
│   ○ 資訊科技服務                                                 │
│   ○ 房地產                                                       │
│   ○ 其他                                                         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Q2: 請確認您的 SST 註冊狀態                                       │
│                                                                  │
│   ○ 已註冊 Sales Tax (銷售稅)                                    │
│   ○ 已註冊 Service Tax (服務稅)                                  │
│   ○ 已註冊 Sales Tax + Service Tax                               │
│   ○ 尚未註冊 (年營業額 < RM 500,000)                             │
│   ○ 豁免 (符合豁免條件)                                          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Q3: (若適用) 請確認特殊稅務註冊                                   │
│                                                                  │
│   □ Tourism Tax (旅遊稅) - 酒店業適用                            │
│   □ High-Value Goods Tax (高價商品稅)                            │
│   □ Sales Tax on Low Value Goods (低價商品銷售稅)                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. 領域配置詳情

### 2.1 零售業 (RETAIL)

```yaml
industry_code: RETAIL
industry_name: Retail Trade
industry_name_zh: 零售業

# MSIC 代碼範圍
msic_range:
  - "47111"  # 百貨商店
  - "47191"  # 綜合零售
  - "47211"  # 食品雜貨
  - "47300"  # 燃料零售
  - "47410"  # 電腦設備
  - "47420"  # 電信設備
  - "47510"  # 紡織品
  - "47610"  # 書店
  - "47711"  # 服裝
  - "47810"  # 攤位零售

# 適用稅率
applicable_taxes:
  sales_tax:
    enabled: true
    default_rate: 10  # 一般商品 10%
    reduced_rate: 5   # 特定商品 5%
  service_tax:
    enabled: false    # 零售一般不需服務稅
  tourism_tax:
    enabled: false

# 相關分類代碼 (優先顯示)
primary_classification_codes:
  - "003"  # 電腦、智慧手機或平板
  - "022"  # 其他項目
  - "025"  # 車輛
  - "026"  # 書籍、期刊訂閱

# 常見免稅商品
exempt_items:
  - "生鮮食品 (蔬菜、水果、肉類)"
  - "基本食品 (米、麵包、雞蛋)"
  - "書籍、報紙、雜誌"
  - "藥品"

# 功能顯示
ui_features:
  show_sales_tax: true
  show_service_tax: false
  show_tourism_tax: false
  show_consolidated_invoice: true
  show_b2c_portal: true
```

### 2.2 餐飲業 (FNB)

```yaml
industry_code: FNB
industry_name: Food & Beverage
industry_name_zh: 餐飲業

# MSIC 代碼範圍
msic_range:
  - "56101"  # 餐廳
  - "56102"  # 咖啡店
  - "56103"  # 快餐店
  - "56210"  # 活動餐飲
  - "56290"  # 其他餐飲服務
  - "56301"  # 酒吧
  - "56302"  # 夜總會

# 適用稅率
applicable_taxes:
  sales_tax:
    enabled: false    # 餐飲屬服務
  service_tax:
    enabled: true
    default_rate: 6   # 餐飲服務 6% (特殊稅率)
    # 注意: 2024年3月後，餐飲服務維持 6%，非 8%
  tourism_tax:
    enabled: false

# 相關分類代碼
primary_classification_codes:
  - "022"  # 其他項目
  - "004"  # 合併電子發票 (適用 B2C)

# 特殊規則
special_rules:
  - "餐飲服務稅率維持 6% (非 8%)"
  - "外帶食品可能適用 0% (免稅食品)"
  - "酒精飲料另有附加稅"

# 功能顯示
ui_features:
  show_sales_tax: false
  show_service_tax: true
  show_tourism_tax: false
  show_consolidated_invoice: true
  show_b2c_portal: true
```

### 2.3 專業服務 (PROF_SVC)

```yaml
industry_code: PROF_SVC
industry_name: Professional Services
industry_name_zh: 專業服務

# MSIC 代碼範圍
msic_range:
  - "69100"  # 法律服務
  - "69200"  # 會計、審計、稅務
  - "70100"  # 總公司活動
  - "70201"  # 管理顧問
  - "71100"  # 建築工程
  - "71200"  # 技術測試
  - "72100"  # 自然科學研發
  - "73100"  # 廣告
  - "74100"  # 專業設計
  - "74200"  # 攝影活動

# 適用稅率
applicable_taxes:
  sales_tax:
    enabled: false
  service_tax:
    enabled: true
    default_rate: 8   # 專業服務 8%
  tourism_tax:
    enabled: false

# 相關分類代碼
primary_classification_codes:
  - "022"  # 其他項目
  - "006"  # 墊付款項
  - "027"  # 報銷
  - "031"  # 研發

# 功能顯示
ui_features:
  show_sales_tax: false
  show_service_tax: true
  show_tourism_tax: false
  show_consolidated_invoice: false
  show_b2c_portal: false
  show_disbursement: true  # 專業服務常有墊付
```

### 2.4 製造業 (MANU)

```yaml
industry_code: MANU
industry_name: Manufacturing
industry_name_zh: 製造業

# MSIC 代碼範圍
msic_range:
  - "10xxx"  # 食品製造
  - "11xxx"  # 飲料製造
  - "13xxx"  # 紡織品
  - "20xxx"  # 化學品
  - "21xxx"  # 藥品
  - "22xxx"  # 橡膠塑膠
  - "24xxx"  # 金屬
  - "25xxx"  # 金屬製品
  - "26xxx"  # 電子產品
  - "27xxx"  # 電氣設備
  - "28xxx"  # 機械設備
  - "29xxx"  # 汽車
  - "30xxx"  # 運輸設備

# 適用稅率
applicable_taxes:
  sales_tax:
    enabled: true
    default_rate: 10
    reduced_rate: 5   # 特定製造商品
  service_tax:
    enabled: false
  tourism_tax:
    enabled: false

# 相關分類代碼
primary_classification_codes:
  - "005"  # 建築材料
  - "022"  # 其他項目
  - "023"  # 石油作業
  - "025"  # 車輛
  - "031"  # 研發

# 特殊規則
special_rules:
  - "原材料可申請免稅"
  - "出口商品免稅"
  - "加工製造豁免計劃"

# 功能顯示
ui_features:
  show_sales_tax: true
  show_service_tax: false
  show_tourism_tax: false
  show_self_billed: true   # 進口原材料
  show_export_invoice: true
```

### 2.5 建築業 (CONST)

```yaml
industry_code: CONST
industry_name: Construction
industry_name_zh: 建築業

# MSIC 代碼範圍
msic_range:
  - "41001"  # 住宅建築
  - "41002"  # 非住宅建築
  - "42101"  # 道路橋樑
  - "42201"  # 公用設施
  - "42900"  # 其他土木工程
  - "43110"  # 拆除工程
  - "43120"  # 場地準備
  - "43210"  # 電氣安裝
  - "43220"  # 水管安裝
  - "43290"  # 其他建築安裝
  - "43300"  # 建築完工
  - "43900"  # 其他專業建築

# 適用稅率 (2025年7月起新增)
applicable_taxes:
  sales_tax:
    enabled: true
    default_rate: 5   # 建築材料 5%
  service_tax:
    enabled: true     # 2025年7月起
    default_rate: 6   # 建築服務 6%
  tourism_tax:
    enabled: false

# 相關分類代碼
primary_classification_codes:
  - "005"  # 建築材料
  - "018"  # 土地和建築物
  - "022"  # 其他項目
  - "030"  # 維修保養

# 特殊規則
special_rules:
  - "建築材料 (Fourth Schedule LPIPM Act 1994) 適用 5%"
  - "建築服務自 2025年7月起納入服務稅 (6%)"
  - "政府項目可能豁免"

# 功能顯示
ui_features:
  show_sales_tax: true
  show_service_tax: true
  show_tourism_tax: false
  show_progress_billing: true  # 進度請款
```

### 2.6 批發業 (WHOLESALE)

```yaml
industry_code: WHOLESALE
industry_name: Wholesale Trade
industry_name_zh: 批發業

# MSIC 代碼範圍
msic_range:
  - "45xxx"  # 汽車批發
  - "46xxx"  # 其他批發

# 適用稅率
applicable_taxes:
  sales_tax:
    enabled: true
    default_rate: 10
    reduced_rate: 5
  service_tax:
    enabled: false
  tourism_tax:
    enabled: false

# 相關分類代碼
primary_classification_codes:
  - "022"  # 其他項目
  - "003"  # 電腦設備
  - "025"  # 車輛

# 功能顯示
ui_features:
  show_sales_tax: true
  show_service_tax: false
  show_bulk_invoice: true
```

### 2.7 電子商務 (ECOMM)

```yaml
industry_code: ECOMM
industry_name: E-Commerce
industry_name_zh: 電子商務

# MSIC 代碼範圍
msic_range:
  - "47911"  # 網路零售
  - "47912"  # 郵購零售

# 適用稅率
applicable_taxes:
  sales_tax:
    enabled: true
    default_rate: 10
    low_value_goods_tax: 10  # 低價商品銷售稅
  service_tax:
    enabled: true     # 平台服務費
    default_rate: 8
  tourism_tax:
    enabled: false

# 相關分類代碼 (電商專用)
primary_classification_codes:
  - "008"  # 電子商務 - 向買家開具的電子發票
  - "009"  # 電子商務 - 向賣家、物流等開具的自開發票
  - "003"  # 電腦、智慧手機
  - "022"  # 其他項目

# 特殊規則
special_rules:
  - "平台需為賣家開具自開發票"
  - "低價進口商品 (LVG) 適用 10% 銷售稅"
  - "數位服務適用服務稅"

# 功能顯示
ui_features:
  show_sales_tax: true
  show_service_tax: true
  show_self_billed: true      # 電商平台自開發票
  show_consolidated_invoice: true
  show_b2c_portal: true
```

### 2.8 旅遊酒店 (TOURISM)

```yaml
industry_code: TOURISM
industry_name: Tourism & Hospitality
industry_name_zh: 旅遊酒店

# MSIC 代碼範圍
msic_range:
  - "55101"  # 酒店
  - "55102"  # 度假村
  - "55103"  # 汽車旅館
  - "55104"  # 民宿
  - "55900"  # 其他住宿
  - "79110"  # 旅行社
  - "79120"  # 旅遊運營商
  - "79900"  # 其他預訂服務

# 適用稅率
applicable_taxes:
  sales_tax:
    enabled: false
  service_tax:
    enabled: true
    default_rate: 6   # 住宿服務 6%
  tourism_tax:
    enabled: true
    rate: "RM10/room/night"  # 每房每晚 RM10

# 相關分類代碼
primary_classification_codes:
  - "022"  # 其他項目
  - "004"  # 合併電子發票

# 特殊規則
special_rules:
  - "住宿設施需收取 Tourism Tax (RM10/房/晚)"
  - "外國遊客適用"
  - "服務稅維持 6%"

# 功能顯示
ui_features:
  show_sales_tax: false
  show_service_tax: true
  show_tourism_tax: true      # 特有
  show_consolidated_invoice: true
  show_b2c_portal: true
```

### 2.9 醫療保健 (HEALTH)

```yaml
industry_code: HEALTH
industry_name: Healthcare
industry_name_zh: 醫療保健

# MSIC 代碼範圍
msic_range:
  - "86101"  # 醫院
  - "86102"  # 專科診所
  - "86201"  # 普通診所
  - "86202"  # 牙科診所
  - "86900"  # 其他醫療服務

# 適用稅率 (2025年7月起變更)
applicable_taxes:
  sales_tax:
    enabled: false
  service_tax:
    enabled: true     # 2025年7月起私人醫療服務納入
    default_rate: 6   # 私人醫療 6% (外國人)
    exemption: "馬來西亞公民豁免"
  tourism_tax:
    enabled: false

# 相關分類代碼
primary_classification_codes:
  - "019"  # 學習障礙醫療評估
  - "020"  # 醫療檢查或疫苗接種
  - "021"  # 嚴重疾病醫療費用
  - "041"  # 牙科檢查或治療
  - "042"  # 生育治療
  - "043"  # 護理治療、日間照護

# 特殊規則
special_rules:
  - "馬來西亞公民的私人醫療服務豁免服務稅"
  - "外國人私人醫療服務適用 6%"
  - "政府醫療設施豁免"
  - "藥品免銷售稅"

# 功能顯示
ui_features:
  show_sales_tax: false
  show_service_tax: true
  show_patient_exemption: true  # 公民豁免檢查
```

### 2.10 教育 (EDU)

```yaml
industry_code: EDU
industry_name: Education
industry_name_zh: 教育

# MSIC 代碼範圍
msic_range:
  - "85100"  # 學前教育
  - "85211"  # 小學教育 (政府)
  - "85212"  # 小學教育 (私立)
  - "85221"  # 中學教育 (政府)
  - "85222"  # 中學教育 (私立)
  - "85301"  # 高等教育 (政府)
  - "85302"  # 高等教育 (私立)
  - "85410"  # 體育教育
  - "85420"  # 文化教育
  - "85491"  # 語言培訓
  - "85492"  # 電腦培訓
  - "85493"  # 補習中心
  - "85499"  # 其他教育

# 適用稅率 (2025年7月起變更)
applicable_taxes:
  sales_tax:
    enabled: false
  service_tax:
    enabled: true     # 2025年7月起
    default_rate: 6   # 國際學生 6%
    exemption: "馬來西亞公民及永久居民豁免"
  tourism_tax:
    enabled: false

# 相關分類代碼
primary_classification_codes:
  - "002"  # 托兒所和幼兒園費用
  - "010"  # 學費
  - "014"  # 教育和醫療福利保險

# 特殊規則
special_rules:
  - "馬來西亞公民及永久居民的私人教育服務豁免"
  - "國際學生適用 6% 服務稅"
  - "政府學校豁免"

# 功能顯示
ui_features:
  show_sales_tax: false
  show_service_tax: true
  show_student_exemption: true  # 公民/PR 豁免檢查
```

---

## 3. 領域配置資料結構

### 3.1 資料庫 Schema

```sql
-- 商業領域主表
CREATE TABLE industry_config (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry_code           VARCHAR(20) NOT NULL UNIQUE,
    industry_name_en        VARCHAR(100) NOT NULL,
    industry_name_zh        VARCHAR(100),
    industry_name_ms        VARCHAR(100),
    
    -- 稅務設定
    sales_tax_enabled       BOOLEAN DEFAULT false,
    sales_tax_default_rate  DECIMAL(5,2),
    sales_tax_reduced_rate  DECIMAL(5,2),
    service_tax_enabled     BOOLEAN DEFAULT false,
    service_tax_default_rate DECIMAL(5,2),
    tourism_tax_enabled     BOOLEAN DEFAULT false,
    tourism_tax_rate        VARCHAR(50),
    
    -- MSIC 範圍 (JSON array)
    msic_codes              JSONB,
    
    -- 分類代碼 (JSON array)
    primary_classification_codes JSONB,
    
    -- UI 功能設定
    ui_features             JSONB,
    
    -- 特殊規則
    special_rules           JSONB,
    
    -- 審計
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用戶領域配置
CREATE TABLE user_industry_config (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    
    -- 選擇的領域
    industry_code           VARCHAR(20) NOT NULL REFERENCES industry_config(industry_code),
    
    -- SST 註冊狀態
    sst_registered          BOOLEAN DEFAULT false,
    sst_registration_type   VARCHAR(50), -- 'SALES', 'SERVICE', 'BOTH', 'EXEMPT'
    sst_registration_number VARCHAR(20),
    
    -- Tourism Tax 註冊
    tourism_tax_registered  BOOLEAN DEFAULT false,
    tourism_tax_number      VARCHAR(20),
    
    -- 用戶自訂覆寫
    custom_tax_overrides    JSONB,  -- 用戶自訂稅率
    custom_classifications  JSONB,  -- 用戶新增的分類代碼
    
    -- 審計
    configured_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    configured_by           VARCHAR(100),
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_user_industry_org ON user_industry_config(organization_id);
CREATE INDEX idx_user_industry_code ON user_industry_config(industry_code);
```

### 3.2 配置 API 結構

```typescript
// 領域配置介面
interface IndustryConfig {
  industryCode: string;
  industryNameEn: string;
  industryNameZh: string;
  
  // 稅務設定
  applicableTaxes: {
    salesTax: {
      enabled: boolean;
      defaultRate: number;
      reducedRate?: number;
    };
    serviceTax: {
      enabled: boolean;
      defaultRate: number;
      reducedRate?: number;
    };
    tourismTax: {
      enabled: boolean;
      rate?: string;
    };
  };
  
  // 代碼
  msicCodes: string[];
  primaryClassificationCodes: string[];
  
  // UI 功能
  uiFeatures: {
    showSalesTax: boolean;
    showServiceTax: boolean;
    showTourismTax: boolean;
    showConsolidatedInvoice: boolean;
    showB2cPortal: boolean;
    showSelfBilled: boolean;
    showDisbursement: boolean;
    // ... 其他功能
  };
  
  // 特殊規則
  specialRules: string[];
}

// 用戶配置介面
interface UserIndustryConfig {
  organizationId: string;
  industryConfig: IndustryConfig;
  
  // SST 狀態
  sstRegistered: boolean;
  sstRegistrationType: 'SALES' | 'SERVICE' | 'BOTH' | 'EXEMPT';
  sstRegistrationNumber?: string;
  
  // Tourism Tax
  tourismTaxRegistered: boolean;
  tourismTaxNumber?: string;
  
  // 用戶覆寫
  customTaxOverrides?: {
    [classificationCode: string]: {
      taxType: string;
      taxRate: number;
      reason: string;  // 覆寫原因
    };
  };
  
  customClassifications?: string[];
}
```

---

## 4. 領域變更處理

### 4.1 變更流程

```
用戶變更商業領域:
═══════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────────┐
│ 用戶請求變更領域                                                  │
│ 當前: 零售業 (RETAIL) → 目標: 電子商務 (ECOMM)                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 系統檢查:                                                        │
│                                                                  │
│   □ 是否有未完成的發票？                                         │
│   □ 新領域的稅務配置是否相容？                                   │
│   □ 是否需要更新 MSIC 代碼？                                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 顯示變更影響:                                                    │
│                                                                  │
│   ⚠️ 將新增: Service Tax (8%)                                   │
│   ⚠️ 將新增: 電商專用分類代碼 (008, 009)                        │
│   ⚠️ 將新增: 自開發票功能                                       │
│   ✓ 保留: Sales Tax 設定                                        │
│   ✓ 保留: 用戶自訂覆寫                                          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 用戶確認變更                                                     │
│                                                                  │
│   [取消]  [確認變更]                                             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 記錄變更審計日誌                                                  │
│                                                                  │
│   時間: 2025-12-26 14:30:00                                     │
│   操作: 領域變更                                                 │
│   從: RETAIL → 到: ECOMM                                        │
│   操作者: user@company.com                                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. 與其他模組的聯動

### 5.1 → 02-TAX-RATES.md

本模組輸出以下資料給稅率模組：

```json
{
  "industryCode": "RETAIL",
  "applicableTaxes": {
    "salesTax": {
      "enabled": true,
      "defaultRate": 10,
      "reducedRate": 5
    },
    "serviceTax": {
      "enabled": false
    },
    "tourismTax": {
      "enabled": false
    }
  }
}
```

### 5.2 → 03-CLASSIFICATION.md

本模組輸出以下資料給分類代碼模組：

```json
{
  "industryCode": "RETAIL",
  "primaryClassificationCodes": ["003", "022", "025", "026"],
  "displayPriority": "primary_first"
}
```

### 5.3 → 04-MSIC-CODES.md

本模組輸出以下資料給 MSIC 模組：

```json
{
  "industryCode": "RETAIL",
  "suggestedMsicCodes": ["47111", "47191", "47211", "47410", "47711"],
  "msicRange": "47xxx"
}
```

### 5.4 → 05-TAX-ENGINE.md

本模組輸出以下資料給稅率引擎：

```json
{
  "industryCode": "RETAIL",
  "taxRules": {
    "defaultTaxType": "01",  // Sales Tax
    "defaultTaxRate": 10,
    "exemptCategories": ["essential_food", "books", "medicine"],
    "reducedRateCategories": ["construction_materials"]
  }
}
```

---

*本模組為系統初始化的核心配置，所有其他模組均依賴本模組的領域配置來決定適用規則。*
