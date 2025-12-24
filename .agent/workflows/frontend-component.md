---
description: 
---

## 輸入參數

詢問用戶：
1. 組件名稱
2. 組件類型（UI 基礎組件 / 業務組件 / 頁面組件）
3. 是否需要狀態管理
4. 是否需要 API 調用

---

## 工作流步驟

### Phase 1: 設計

1. **定義組件接口**
   ```typescript
   interface ProductCardProps {
     product: Product;
     onAddToCart?: (productId: string) => void;
     onViewDetails?: (productId: string) => void;
     variant?: 'compact' | 'detailed';
     className?: string;
   }
   ```

2. **確定狀態需求**
   - 本地狀態 (useState)
   - 全局狀態 (Zustand)
   - 服務端狀態 (TanStack Query)

### Phase 2: 實現

3. **創建組件文件**
   ```
   src/components/{category}/
   ├── ProductCard.tsx        # 主組件
   ├── ProductCard.test.tsx   # 測試
   └── index.ts               # 導出
   ```

4. **組件模板**
   ```typescript
   import { memo } from 'react';
   import { cn } from '@/lib/utils';
   import { Card, CardHeader, CardContent } from '@/components/ui/card';
   import { Button } from '@/components/ui/button';
   
   interface ProductCardProps {
     product: Product;
     onAddToCart?: (productId: string) => void;
     variant?: 'compact' | 'detailed';
     className?: string;
   }
   
   export const ProductCard = memo(function ProductCard({
     product,
     onAddToCart,
     variant = 'compact',
     className,
   }: ProductCardProps) {
     const handleAddToCart = () => {
       onAddToCart?.(product.id);
     };
     
     return (
       <Card className={cn('hover:shadow-lg transition-shadow', className)}>
         <CardHeader>
           <h3 className="font-semibold truncate">{product.name}</h3>
           <p className="text-sm text-muted-foreground">{product.sku}</p>
         </CardHeader>
         
         <CardContent>
           <p className="text-2xl font-bold">
             RM {product.price.toFixed(2)}
           </p>
           
           {variant === 'detailed' && (
             <p className="text-sm text-muted-foreground mt-2">
               {product.description}
             </p>
           )}
           
           <Button 
             onClick={handleAddToCart}
             className="w-full mt-4"
           >
             Add to Cart
           </Button>
         </CardContent>
       </Card>
     );
   });
   ```

### Phase 3: 樣式

5. **Tailwind 最佳實踐**
   ```typescript
   // 使用 cn() 合併類名
   import { cn } from '@/lib/utils';
   
   <div className={cn(
     'p-4 rounded-lg',
     isActive && 'bg-primary text-primary-foreground',
     isDisabled && 'opacity-50 cursor-not-allowed',
     className
   )}>
   
   // 響應式設計
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
   
   // 暗色模式支持
   <div className="bg-white dark:bg-slate-800">
   ```

### Phase 4: 測試

6. **編寫測試**
   ```typescript
   import { render, screen, fireEvent } from '@testing-library/react';
   import { ProductCard } from './ProductCard';
   
   const mockProduct: Product = {
     id: '1',
     name: 'Test Product',
     sku: 'TEST-001',
     price: 99.99,
     description: 'Test description',
   };
   
   describe('ProductCard', () => {
     it('renders product information', () => {
       render(<ProductCard product={mockProduct} />);
       
       expect(screen.getByText('Test Product')).toBeInTheDocument();
       expect(screen.getByText('TEST-001')).toBeInTheDocument();
       expect(screen.getByText('RM 99.99')).toBeInTheDocument();
     });
     
     it('calls onAddToCart when button clicked', () => {
       const onAddToCart = vi.fn();
       render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);
       
       fireEvent.click(screen.getByText('Add to Cart'));
       
       expect(onAddToCart).toHaveBeenCalledWith('1');
     });
     
     it('shows description in detailed variant', () => {
       render(<ProductCard product={mockProduct} variant="detailed" />);
       
       expect(screen.getByText('Test description')).toBeInTheDocument();
     });
   });
   ```

### Phase 5: 可訪問性

7. **確保可訪問性**
   ```typescript
   // 正確的 ARIA 屬性
   <button
     aria-label="Add Test Product to cart"
     aria-disabled={isLoading}
     onClick={handleAddToCart}
   >
     {isLoading ? 'Adding...' : 'Add to Cart'}
   </button>
   
   // 鍵盤導航
   <div
     role="button"
     tabIndex={0}
     onKeyDown={(e) => {
       if (e.key === 'Enter' || e.key === ' ') {
         handleClick();
       }
     }}
   >
   
   // 焦點指示
   <button className="focus:ring-2 focus:ring-primary focus:outline-none">
   ```

---

## 組件類型模板

### UI 基礎組件
```typescript
// 無業務邏輯，純展示
export const Badge = ({ children, variant }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }))}>
    {children}
  </span>
);
```

### 業務組件
```typescript
// 包含業務邏輯
export const OrderSummary = ({ orderId }: Props) => {
  const { data: order } = useQuery(['order', orderId], () => fetchOrder(orderId));
  
  if (!order) return <Skeleton />;
  
  return (
    <Card>
      {/* 訂單內容 */}
    </Card>
  );
};
```

### 頁面組件
```typescript
// 完整頁面
export const ProductsPage = () => {
  const { data, isLoading } = useProducts();
  const [filters, setFilters] = useState<Filters>({});
  
  return (
    <Layout>
      <PageHeader title="Products" />
      <FilterBar filters={filters} onChange={setFilters} />
      <ProductGrid products={data} isLoading={isLoading} />
      <Pagination />
    </Layout>
  );
};
```

---

## 檢查清單

- [ ] Props 接口已定義
- [ ] 使用 memo() 優化
- [ ] 樣式使用 Tailwind
- [ ] 響應式設計
- [ ] 暗色模式支持
- [ ] 可訪問性（ARIA, 鍵盤）
- [ ] 測試覆蓋
- [ ] 錯誤邊界處理