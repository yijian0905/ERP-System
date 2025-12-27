# 04-MSIC-CODES.md

# 馬來西亞標準工業分類代碼 (MSIC) 模組

> **Module Purpose**: 定義 MSIC 代碼結構，提供各行業 MSIC 代碼參考

---

## 模組聯動關係

```
01-INDUSTRY-CONFIG.md ──────┐
                            │ (接收領域配置)
                            ▼
              ┌─────────────────────────┐
              │  本模組                 │
              │  (04-MSIC-CODES)        │
              └─────────────────────────┘
                            │
                            ▼
                     E-Invoice.md
                     (供應商 MSIC 欄位)
```

---

## 1. MSIC 概述

### 1.1 什麼是 MSIC？

**MSIC (Malaysia Standard Industrial Classification)** 是馬來西亞標準工業分類代碼，用於分類企業的商業活動。

| 屬性 | 說明 |
|------|------|
| 位數 | 5 位數字 |
| 管理機構 | 馬來西亞統計局 (DOSM) |
| 國際標準 | 基於 UN ISIC |
| e-Invoice 用途 | 必填欄位 - 供應商業務活動 |

### 1.2 MSIC 結構

```
MSIC 代碼層級結構:
═══════════════════════════════════════════════════════════════════

     2位數         3位數         4位數         5位數
   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
   │ Section │──▶│ Division │──▶│ Group  │──▶│ Class  │
   │  大類   │   │  中類    │   │  小類   │   │  細類   │
   └────────┘   └────────┘   └────────┘   └────────┘
   
   例如: 47 → 471 → 4711 → 47111
         │     │      │       │
         │     │      │       └── 百貨商店
         │     │      └────────── 非專業商店零售
         │     └────────────────── 非專業商店零售
         └──────────────────────── 零售業
```

### 1.3 特殊代碼

| MSIC | 說明 | 使用場景 |
|------|------|----------|
| `00000` | NOT APPLICABLE | 僅用於自開發票且供應商 MSIC 不可得時 |

---

## 2. 主要行業 MSIC 代碼

### 2.1 零售業 (Section G: 47xxx)

```yaml
retail_msic:
  section: "G"
  division: "47"
  description: "Retail trade, except of motor vehicles and motorcycles"
  
  codes:
    - code: "47111"
      description: "Retail sale in non-specialized stores with food, beverages or tobacco predominating (Department stores)"
      zh: "百貨商店"
      
    - code: "47191"
      description: "Retail sale of a variety of goods (mini market, convenience stores)"
      zh: "便利商店、迷你超市"
      
    - code: "47211"
      description: "Retail sale of food in specialized stores"
      zh: "食品專賣店"
      
    - code: "47221"
      description: "Retail sale of beverages in specialized stores"
      zh: "飲料專賣店"
      
    - code: "47300"
      description: "Retail sale of automotive fuel in specialized stores"
      zh: "加油站"
      
    - code: "47410"
      description: "Retail sale of computers, peripheral units, software and telecommunications equipment"
      zh: "電腦及電信設備零售"
      
    - code: "47420"
      description: "Retail sale of audio and video equipment"
      zh: "音響視聽設備零售"
      
    - code: "47510"
      description: "Retail sale of textiles"
      zh: "紡織品零售"
      
    - code: "47520"
      description: "Retail sale of hardware, paints and glass"
      zh: "五金塗料玻璃零售"
      
    - code: "47610"
      description: "Retail sale of books, newspapers and stationery"
      zh: "書店、文具店"
      
    - code: "47711"
      description: "Retail sale of clothing and clothing accessories (Fashion boutiques)"
      zh: "服裝零售"
      
    - code: "47810"
      description: "Retail sale via stalls and markets"
      zh: "攤位零售"
      
    - code: "47911"
      description: "Retail sale via internet (e-commerce)"
      zh: "網路零售 (電商)"
```

### 2.2 餐飲業 (Section I: 56xxx)

```yaml
fnb_msic:
  section: "I"
  division: "56"
  description: "Food and beverage service activities"
  
  codes:
    - code: "56101"
      description: "Restaurants with full service"
      zh: "餐廳"
      
    - code: "56102"
      description: "Restaurants without full service (coffee shops)"
      zh: "咖啡店"
      
    - code: "56103"
      description: "Fast food restaurants"
      zh: "快餐店"
      
    - code: "56104"
      description: "Food stalls (hawker stalls)"
      zh: "小販攤位"
      
    - code: "56210"
      description: "Event catering"
      zh: "活動餐飲服務"
      
    - code: "56290"
      description: "Other food service activities (food trucks, canteens)"
      zh: "其他餐飲服務"
      
    - code: "56301"
      description: "Bars, pubs and lounges"
      zh: "酒吧"
      
    - code: "56302"
      description: "Night clubs, discotheques and karaoke"
      zh: "夜總會、卡拉OK"
```

### 2.3 專業服務 (Section M: 69xxx-74xxx)

```yaml
professional_services_msic:
  section: "M"
  divisions: ["69", "70", "71", "72", "73", "74"]
  description: "Professional, scientific and technical activities"
  
  codes:
    # 法律及會計
    - code: "69100"
      description: "Legal activities"
      zh: "法律服務"
      
    - code: "69200"
      description: "Accounting, bookkeeping and auditing activities"
      zh: "會計、審計服務"
      
    # 管理顧問
    - code: "70100"
      description: "Activities of head offices"
      zh: "總公司活動"
      
    - code: "70201"
      description: "Management consultancy activities"
      zh: "管理顧問"
      
    - code: "70202"
      description: "Business consultancy activities"
      zh: "商業顧問"
      
    # 建築工程
    - code: "71100"
      description: "Architectural activities"
      zh: "建築設計"
      
    - code: "71201"
      description: "Engineering activities"
      zh: "工程服務"
      
    - code: "71202"
      description: "Engineering-related scientific and technical consulting"
      zh: "工程顧問"
      
    # 研發
    - code: "72100"
      description: "Research and experimental development on natural sciences"
      zh: "自然科學研發"
      
    - code: "72200"
      description: "Research and experimental development on social sciences"
      zh: "社會科學研發"
      
    # 廣告設計
    - code: "73100"
      description: "Advertising"
      zh: "廣告服務"
      
    - code: "74100"
      description: "Specialized design activities"
      zh: "專業設計"
      
    - code: "74200"
      description: "Photographic activities"
      zh: "攝影服務"
```

### 2.4 製造業 (Section C: 10xxx-33xxx)

```yaml
manufacturing_msic:
  section: "C"
  divisions: ["10", "11", "13", "14", "20", "21", "22", "24", "25", "26", "27", "28", "29", "30"]
  description: "Manufacturing"
  
  codes:
    # 食品製造
    - code: "10101"
      description: "Processing and preserving of meat"
      zh: "肉類加工"
      
    - code: "10710"
      description: "Manufacture of bakery products"
      zh: "烘焙產品製造"
      
    # 飲料製造
    - code: "11010"
      description: "Distilling, rectifying and blending of spirits"
      zh: "酒類製造"
      
    - code: "11040"
      description: "Manufacture of soft drinks"
      zh: "軟飲料製造"
      
    # 電子產品
    - code: "26100"
      description: "Manufacture of electronic components"
      zh: "電子元件製造"
      
    - code: "26200"
      description: "Manufacture of computers and peripheral equipment"
      zh: "電腦設備製造"
      
    - code: "26300"
      description: "Manufacture of communication equipment"
      zh: "通訊設備製造"
      
    # 電氣設備
    - code: "27100"
      description: "Manufacture of electric motors, generators and transformers"
      zh: "電機製造"
      
    # 機械設備
    - code: "28100"
      description: "Manufacture of general-purpose machinery"
      zh: "通用機械製造"
      
    # 汽車
    - code: "29100"
      description: "Manufacture of motor vehicles"
      zh: "汽車製造"
      
    - code: "29300"
      description: "Manufacture of parts and accessories for motor vehicles"
      zh: "汽車零件製造"
```

### 2.5 建築業 (Section F: 41xxx-43xxx)

```yaml
construction_msic:
  section: "F"
  divisions: ["41", "42", "43"]
  description: "Construction"
  
  codes:
    # 建築工程
    - code: "41001"
      description: "Construction of residential buildings"
      zh: "住宅建築"
      
    - code: "41002"
      description: "Construction of non-residential buildings"
      zh: "非住宅建築"
      
    # 土木工程
    - code: "42101"
      description: "Construction of roads and highways"
      zh: "道路建設"
      
    - code: "42201"
      description: "Construction of utility projects"
      zh: "公用設施建設"
      
    - code: "42900"
      description: "Construction of other civil engineering projects"
      zh: "其他土木工程"
      
    # 專業建築
    - code: "43110"
      description: "Demolition"
      zh: "拆除工程"
      
    - code: "43120"
      description: "Site preparation"
      zh: "場地準備"
      
    - code: "43210"
      description: "Electrical installation"
      zh: "電氣安裝"
      
    - code: "43220"
      description: "Plumbing, heat and air-conditioning installation"
      zh: "水管空調安裝"
      
    - code: "43300"
      description: "Building completion and finishing"
      zh: "建築裝修"
      
    - code: "43900"
      description: "Other specialized construction activities"
      zh: "其他專業建築"
```

### 2.6 旅遊酒店業 (Section I: 55xxx, Section N: 79xxx)

```yaml
tourism_msic:
  sections: ["I", "N"]
  divisions: ["55", "79"]
  description: "Accommodation and travel services"
  
  codes:
    # 住宿
    - code: "55101"
      description: "Hotels"
      zh: "酒店"
      
    - code: "55102"
      description: "Resort hotels"
      zh: "度假村"
      
    - code: "55103"
      description: "Motels"
      zh: "汽車旅館"
      
    - code: "55104"
      description: "Bed and breakfast"
      zh: "民宿"
      
    - code: "55900"
      description: "Other accommodation"
      zh: "其他住宿"
      
    # 旅遊服務
    - code: "79110"
      description: "Travel agency activities"
      zh: "旅行社"
      
    - code: "79120"
      description: "Tour operator activities"
      zh: "旅遊運營商"
      
    - code: "79900"
      description: "Other reservation service activities"
      zh: "其他預訂服務"
```

### 2.7 資訊科技 (Section J: 62xxx-63xxx)

```yaml
it_msic:
  section: "J"
  divisions: ["62", "63"]
  description: "Information technology and service activities"
  
  codes:
    # 電腦程式
    - code: "62010"
      description: "Computer programming activities"
      zh: "電腦程式設計"
      
    - code: "62021"
      description: "Information technology consultancy"
      zh: "IT 顧問"
      
    - code: "62022"
      description: "Computer facilities management activities"
      zh: "電腦設施管理"
      
    - code: "62090"
      description: "Other information technology activities"
      zh: "其他 IT 活動"
      
    # 資訊服務
    - code: "63110"
      description: "Data processing, hosting and related activities"
      zh: "數據處理、託管服務"
      
    - code: "63120"
      description: "Web portals"
      zh: "網站入口"
      
    - code: "63910"
      description: "News agency activities"
      zh: "新聞社"
      
    - code: "63990"
      description: "Other information service activities"
      zh: "其他資訊服務"
```

### 2.8 醫療保健 (Section Q: 86xxx)

```yaml
healthcare_msic:
  section: "Q"
  division: "86"
  description: "Human health activities"
  
  codes:
    - code: "86101"
      description: "Hospital activities (government)"
      zh: "政府醫院"
      
    - code: "86102"
      description: "Hospital activities (private)"
      zh: "私人醫院"
      
    - code: "86201"
      description: "General medical practice activities"
      zh: "普通診所"
      
    - code: "86202"
      description: "Specialist medical practice activities"
      zh: "專科診所"
      
    - code: "86203"
      description: "Dental practice activities"
      zh: "牙科診所"
      
    - code: "86900"
      description: "Other human health activities"
      zh: "其他醫療服務"
```

### 2.9 教育 (Section P: 85xxx)

```yaml
education_msic:
  section: "P"
  division: "85"
  description: "Education"
  
  codes:
    - code: "85100"
      description: "Pre-primary education (kindergartens)"
      zh: "學前教育 (幼兒園)"
      
    - code: "85211"
      description: "Primary education (government)"
      zh: "小學 (政府)"
      
    - code: "85212"
      description: "Primary education (private)"
      zh: "小學 (私立)"
      
    - code: "85221"
      description: "Secondary education (government)"
      zh: "中學 (政府)"
      
    - code: "85222"
      description: "Secondary education (private)"
      zh: "中學 (私立)"
      
    - code: "85301"
      description: "Higher education (government)"
      zh: "高等教育 (政府)"
      
    - code: "85302"
      description: "Higher education (private)"
      zh: "高等教育 (私立)"
      
    - code: "85491"
      description: "Language schools"
      zh: "語言學校"
      
    - code: "85492"
      description: "Computer training"
      zh: "電腦培訓"
      
    - code: "85493"
      description: "Tuition centres"
      zh: "補習中心"
```

---

## 3. 資料結構

### 3.1 TypeScript 介面

```typescript
interface MSICCode {
  code: string;           // 5位數代碼
  section: string;        // 大類字母
  division: string;       // 2位數中類
  group: string;          // 3位數小類
  class: string;          // 4位數
  descriptionEn: string;
  descriptionZh: string;
  descriptionMs: string;
  industryCode: string;   // 對應的領域代碼
}

interface MSICSuggestion {
  code: string;
  description: string;
  matchScore: number;
  industryMatch: boolean;
}
```

---

## 4. 官方資源

| 資源 | 連結 |
|------|------|
| DOSM MSIC Portal | https://www.dosm.gov.my |
| MyInvois MSIC Codes | https://sdk.myinvois.hasil.gov.my/codes/msic-codes/ |
| SSM ezBiz Portal | https://www.ssm-ezbiz.com.my |

---

*本模組提供 MSIC 代碼參考，完整列表請查閱 LHDN SDK 或 DOSM 官方網站。*
