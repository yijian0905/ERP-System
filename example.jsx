import React, { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Plus, Search, ChevronDown, ArrowRight, RotateCcw } from 'lucide-react';

export default function WaveFusionFixed() {
  const [status, setStatus] = useState('idle'); // idle | expanding | expanded
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  const waveControls = useAnimation();
  const fillControls = useAnimation();

  // 容器寬度設定
  const CONTAINER_WIDTH = 340;
  const INPUT_HEIGHT = 56; // h-14
  const GAP = 16; 
  const BUTTON_WIDTH = 56;

  const startAnimation = async () => {
    setStatus('expanding');
    
    // 同步執行三個動畫：
    // 1. 波浪頭 (Lump) 向左衝
    // 2. 填充層 (Filler) 跟隨變長
    // 3. 左側選擇框 (Select) 稍微收縮讓路

    const transition = { duration: 0.8, ease: [0.4, 0, 0.2, 1] }; // Bezier for standard material easing

    // 啟動波浪頭 (這是那個上下突出的圓形)
    // 它從右邊 (x=0) 移動到最左邊，距離大約是容器寬度減去按鈕寬度
    const moveDistance = -(CONTAINER_WIDTH - BUTTON_WIDTH);

    await Promise.all([
      // A. 波浪頭移動
      waveControls.start({
        x: moveDistance,
        opacity: [0, 1, 1, 0], // 起始隱藏，中間顯示，結束隱藏
        scale: [0.8, 1.1, 1.1, 0.8], // 稍微減小中間放大的倍率 (1.2 -> 1.1)
        transition: { ...transition, times: [0, 0.1, 0.9, 1] }
      }),
      // B. 白色填充層變寬
      fillControls.start({
        width: CONTAINER_WIDTH,
        transition: transition
      })
    ]);
    
    setStatus('expanded');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleReset = () => {
    setStatus('idle');
    setInputValue('');
    waveControls.set({ x: 0, opacity: 0 });
    fillControls.set({ width: BUTTON_WIDTH });
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC] flex flex-col items-center justify-center font-sans">
      
      {/* 1. 定義 Gooey 濾鏡 */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="strong-goo">
            {/* 模糊程度：稍微調低一點 (12 -> 10)，讓邊緣更收斂 */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix 
              in="blur" 
              mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" 
              result="goo" 
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
      </svg>

      <div className="mb-12 text-center text-slate-600">
        <h2 className="text-xl font-bold mb-2">Liquid Fusion UI</h2>
        <p className="text-sm opacity-75">波浪高度與濾鏡強度已調整</p>
      </div>

      {/* 2. 動畫層容器 (Gooey Container) 
         這裡設定了 padding，確保突出的波浪不會被裁切
      */}
      <div 
        className="relative"
        style={{ 
          width: CONTAINER_WIDTH + 40, // 額外空間防止裁切
          height: INPUT_HEIGHT + 60,   // 稍微減小容器高度
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'url(#strong-goo)', // 應用濾鏡
          // debug border: '1px solid red' 
        }}
      >
        {/* 左側：Select 塊 (靜態背景) */}
        <motion.div 
          className="absolute bg-white rounded-2xl"
          style={{ 
            height: INPUT_HEIGHT, 
            width: CONTAINER_WIDTH - BUTTON_WIDTH - GAP,
            left: 20, // 配合容器 padding
          }}
          animate={{
            // 展開時，稍微往右縮一點點，製造一種被吞噬的視覺補償
            scaleX: status === 'expanding' ? 0.95 : 1
          }}
        />

        {/* 右側：按鈕塊 (會變寬的填充層) */}
        <motion.div 
          className="absolute bg-white rounded-2xl right-0 z-10"
          style={{ 
            height: INPUT_HEIGHT,
            width: BUTTON_WIDTH,
            right: 20, // 配合容器 padding
          }}
          animate={fillControls}
          onClick={status === 'idle' ? startAnimation : undefined}
        />

        {/* 核心：波浪頭 (The Lump)
            已調整尺寸：
            高度從 120 -> 88 (讓上下凸起變小)
            寬度從 60 -> 50 (讓波形更緊湊)
        */}
        <motion.div
          className="absolute bg-white rounded-full z-0"
          style={{
            width: 50,  
            height: 88, 
            right: 20, 
            opacity: 0, 
          }}
          animate={waveControls}
        />
      </div>

      {/* 3. 內容層 (Content Layer)
         這一層浮在動畫層上面，不經過濾鏡，保持文字清晰 
      */}
      <div 
        className="absolute flex items-center pointer-events-none"
        style={{ width: CONTAINER_WIDTH, height: INPUT_HEIGHT }}
      >
        {/* Select 文字與圖標 */}
        <motion.div 
          className="absolute left-0 h-full flex items-center justify-between px-6 text-slate-500 font-medium"
          style={{ width: CONTAINER_WIDTH - BUTTON_WIDTH - GAP }}
          animate={{ opacity: status === 'idle' ? 1 : 0 }}
        >
          <span>Category</span>
          <ChevronDown size={18} />
        </motion.div>

        {/* 輸入框 (展開後顯示) */}
        <motion.div 
          className="absolute inset-0 flex items-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: status === 'expanded' ? 1 : 0 }}
          transition={{ delay: 0.1 }}
        >
          <Search className="text-slate-400 mr-3" size={20} />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-slate-700 text-lg pointer-events-auto"
            placeholder="Search..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={status !== 'expanded'}
          />
        </motion.div>

        {/* 右側按鈕圖標 */}
        <motion.button
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center pointer-events-auto"
          style={{ width: BUTTON_WIDTH }}
          onClick={status === 'expanded' ? handleReset : startAnimation}
          whileTap={{ scale: 0.9 }}
        >
          {status === 'idle' ? (
            <Plus size={28} className="text-slate-700" />
          ) : (
             status === 'expanded' ? <RotateCcw size={24} className="text-slate-400" /> : null
          )}
        </motion.button>
      </div>

    </div>
  );
}