---
trigger: always_on
---

### 1. 設計哲學：克制與精準 (Restraint & Precision)

- **視覺風格：** 採用 **Modern Clean / Enterprise SaaS** 風格（參考 Linear, Stripe, Intercom 的後台）。
- **核心邏輯：** 內容密度高（Information Dense），但呼吸感強。
- **黃金法則：** 用戶不應該等待動畫結束才能進行下一步操作。

---

### 2. 佈局與色彩 (Layout & Color System)

ERP 系統使用者通常需要長時間盯著螢幕，因此護眼和層次感至關重要。

### A. 色彩策略 (Color Palette)

- **背景色：** 避免純白 (`#FFFFFF`)，使用極淡的冷灰 (`#F9FAFB` 或 `#F3F4F6`) 作為大背景，將純白留給卡片 (Card) 和內容區，創造自然的層次。
- **主色調：** 選擇飽和度適中、沈穩的顏色（如深海藍、松石綠），避免過於刺眼的亮色。
- **功能色：**
    - 成功/錯誤：使用柔和的粉彩底色搭配深色文字（例如：淺紅底深紅字），而非大面積的鮮豔色塊。
- **邊框與陰影：**
    - **極簡邊框：** 使用 `1px solid #E5E7EB`。
    - **超級投影 (Super-shadows)：** 僅在 Modal 或 Dropdown 使用擴散性強、透明度低的陰影，平時保持扁平。

### B. 資訊密度控制 (Density Control)

- **Compact Mode：** 允許使用者切換「寬鬆/緊湊」模式。在表格中，緊湊模式 padding 設為 `8px`，寬鬆模式設為 `16px`。
- **字體：** 使用高可讀性的無襯線字體（Inter, Roboto, Noto Sans TC）。數字字體建議使用等寬字型 (Monospace) 顯示金額和庫存，方便對齊比較。

---

### 3. 動畫與過度規範 (Animation & Transitions)

這是效率與美感的平衡點。所有的動畫必須滿足 **< 300ms** 的原則。

### A. 頁面切換 (Page Transitions) - **極速淡入**

不要使用整頁的「左滑入」或「旋轉」，這會讓人頭暈且感覺緩慢。

- **規則：** 內容區塊 `Opacity: 0 -> 1` 搭配 `Y-axis: 10px -> 0`。
- **時長：** 150ms - 200ms。
- **曲線：** `ease-out`。
- **React 實作：** 使用 `Framer Motion` 的 `<AnimatePresence mode="wait">`。

### B. 列表與表格操作 (List & Layout) - **感知流暢**

當刪除、新增或排序表格列時，不要讓資料瞬間跳動。

- **規則：** 使用 Layout Animation。當一個項目被刪除，下方的項目平滑向上遞補。
- **React 實作：** `Framer Motion` 的 `layout` prop。
- **範例：**

```jsx
<motion.tr layoutId={item.id} transition={{ duration: 0.2 }}>
   {/* content */}
</motion.tr>
```

### C. 側邊欄與抽屜 (Sidebar & Drawer) - **非阻塞式**

- **規則：** 點擊展開時，內容應立即出現（預加載或骨架屏），動畫是作為裝飾隨後跟上。
- **曲線：** `[0.16, 1, 0.3, 1]` (類似 Apple 的 spring 效果，但要快)。

### D. 微交互 (Micro-interactions)

這是讓系統感覺「精緻」的關鍵，且不影響效率。

- **按鈕點擊：** 點擊瞬間縮小 2% (`scale: 0.98`)，釋放回彈。這給予使用者明確的物理反饋。
- **Hover 狀態：** 背景色改變應有 `transition: all 0.2s`，不要瞬間變色。

---

### 4. 數據加載與反饋 (Loading & Feedback)

ERP 涉及大量數據請求，如何處理「等待」決定了用戶的效率感知。

### A. 樂觀 UI (Optimistic UI) **[關鍵策略]**

- **規則：** 當用戶點擊「保存」或「刪除」時，**先在 UI 上顯示成功狀態**，後台再默默發送 API。
- **效果：** 用戶感覺系統是「零延遲」的。
- **動畫配合：** 點擊保存 -> 按鈕變綠勾勾 (300ms) -> 恢復原狀。

### B. 骨架屏 (Skeleton Screens) > Loading Spinner

- **規則：** 載入表格數據時，不要顯示一個轉圈圈，而是顯示灰色的條狀佔位符。這會讓用戶感覺內容「即將出現」，減少焦慮。
- **動畫：** 骨架屏使用微弱的 `shimmer` (掃光) 動畫。

---

### 5. 具體的 React UI 庫建議

為了達到上述效果，不建議從零手寫所有 CSS。

1. **UI 框架 (基底):**
    - **Tailwind CSS (強烈推薦):** 適合高度客製化，構建 Design System 最快。
    - **Shadcn/ui:** 基於 Tailwind 和 Radix UI，設計風格極度符合現代 SaaS 審美，且代碼完全可控。
    - **Mantine:** 功能非常強大的 React UI 庫，專為 Dashboard/ERP 設計，內建很多 Hooks。
2. **動畫庫:**
    - **Framer Motion:** React 界最強大的動畫庫。它的 `layout` prop 是處理複雜表格變動的神器。
    - **React Spring:** 物理基礎的動畫庫，適合做極致絲滑的拖得效果（如 Kanban 看板）。

---

### 6. ERP 特殊元件設計規範

### A. 表格 (Data Grid)

- **Sticky Header:** 表頭必須固定，垂直滾動時標題不消失。
- **Action Bar:** 當勾選多個項目時，底部或頂部浮現「批次操作欄」（帶有輕微的上浮動畫 `y: 20 -> 0`）。
- **行內編輯 (Inline Edit):** 點擊單元格直接變輸入框，焦點移開即保存。

### B. 全局搜索 (Command Palette / Spotlight)

- **Cmd+K:** 模仿 MacOS 的 Spotlight。按下快捷鍵，瞬間彈出搜索框（背景模糊 `backdrop-filter: blur(4px)`）。
- 這是 ERP 效率的靈魂，動畫必須要在 **100ms** 內完成彈出。

### 總結您的開發 Check List：

- [ ]  **引入 Tailwind CSS** 確保樣式輕量化。
- [ ]  **引入 Framer Motion** 處理組件掛載/卸載的動畫。
- [ ]  **設定 Design Tokens：** 定義好 Primary Color, Surface Color, Border Radius (建議 6px 或 8px，不要太大)。
- [ ]  **實作樂觀 UI (Optimistic UI)：** 讓 API 請求在背景執行。
- [ ]  **測試：** 在低階電腦上測試，如果有卡頓，優先移除 `box-shadow` 和 `blur` 效果的動畫。