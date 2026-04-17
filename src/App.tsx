import React, { useState, useEffect, useRef } from 'react';
import { fetchWeather } from './services/weatherService';
import { translateLocation, getLocationDetails } from './services/geminiService';
import { 
  Calendar, 
  Cloud, 
  Utensils, 
  MapPin, 
  Bus, 
  ShoppingBag, 
  Plus, 
  Wallet, 
  ChevronRight,
  Info,
  Sun,
  CloudRain,
  Navigation,
  CheckSquare,
  Square,
  GripVertical,
  Trash2,
  ExternalLink,
  Search,
  Settings,
  X,
  Edit2,
  MoreVertical,
  Camera,
  Coffee,
  Bed,
  Check,
  ArrowLeftRight,
  Receipt,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types
type Category = 'FOOD' | 'TRANSPORT' | 'ACTIVITY' | 'SHOPPING' | 'HOTEL' | 'FLIGHT';

interface Highlight {
  type: 'must-eat' | 'must-buy' | 'booking' | 'story' | 'tip';
  text: string;
}

interface ItineraryItem {
  id: string;
  category: Category;
  time: string;
  title: string;
  desc: string;
  location?: string;
  highlights?: Highlight[];
  recommendedMenu?: string[];
  shoppingList?: { text: string; completed: boolean }[];
}

interface DayData {
  id: string;
  date: string;
  dayName: string;
  title: string;
  weather: {
    temp: string;
    condition: string;
    icon: string;
    high: string;
    low: string;
    isLive?: boolean;
    location: string;
  };
  items: ItineraryItem[];
}

interface ChecklistSection {
  id: string;
  title: string;
  items: { id: string; text: string; completed: boolean }[];
}

interface Expense {
  id: string;
  item: string;
  amount: number;
  category: string;
  currency: 'KRW' | 'TWD';
  payer: '同豪' | 'circle' | '崑源';
  date: string;
  time: string;
}

// Initial Data
const INITIAL_DAYS_DATA: DayData[] = [
  {
    id: 'day1',
    date: '5/28',
    dayName: 'THU',
    title: '抵達首爾',
    weather: { temp: '24°', condition: '晴', icon: '01d', high: 'H:26°', low: 'L:18°', location: '首爾' },
    items: [
      {
        id: 'item-1-1',
        category: 'FLIGHT',
        time: '18:20',
        title: '抵達仁川機場',
        desc: '入境、領行李。搭乘機場快線 / 購買交通儲值卡。',
        location: '仁川機場',
        highlights: [{ type: 'tip', text: '搭乘機場快線 / 購買交通儲值卡' }]
      },
      {
        id: 'item-1-2',
        category: 'HOTEL',
        time: '21:00',
        title: '抵達住宿',
        desc: '2100-2200 抵達住宿辦理入住手續',
        location: '首爾市區',
      }
    ]
  },
  {
    id: 'day2',
    date: '5/29',
    dayName: 'FRI',
    title: '明洞 & 弘大',
    weather: { temp: '25°', condition: '晴', icon: '01d', high: 'H:27°', low: 'L:19°', location: '首爾' },
    items: [
      {
        id: 'item-2-1',
        category: 'ACTIVITY',
        time: '10:00',
        title: '明洞站換錢',
        desc: '早上前往明洞換錢',
        location: '明洞',
      },
      {
        id: 'item-2-2',
        category: 'FOOD',
        time: '12:00',
        title: '午餐：望遠市場',
        desc: '吃在地小吃',
        location: '望遠市場',
      },
      {
        id: 'item-2-3',
        category: 'ACTIVITY',
        time: '13:30',
        title: '參觀 HYBE',
        desc: '吃完午餐前往參觀',
        location: '龍山',
      },
      {
        id: 'item-2-4',
        category: 'SHOPPING',
        time: '16:00',
        title: '買買逛逛行程',
        desc: '自由逛街',
        location: '弘大/延南洞',
      },
      {
        id: 'item-2-5',
        category: 'FOOD',
        time: '18:00',
        title: '晚餐：弘益大學站',
        desc: '弘大喉嚨水芹菜烤肉/給豚的男人/宇宙家燒肉 woojujip',
        location: '弘大',
        highlights: [{ type: 'must-eat', text: '宇宙家燒肉 woojujip' }]
      },
      {
        id: 'item-2-6',
        category: 'SHOPPING',
        time: '20:00',
        title: '追星逛小卡專輯',
        desc: 'POCA SPOT/POCABO/Belluga Music/WithMuu',
        location: '弘大',
      }
    ]
  },
  {
    id: 'day3',
    date: '5/30',
    dayName: 'SAT',
    title: '聖水洞 & 夜市',
    weather: { temp: '26°', condition: '多雲', icon: '03d', high: 'H:28°', low: 'L:20°', location: '首爾' },
    items: [
      {
        id: 'item-3-1',
        category: 'ACTIVITY',
        time: '09:00',
        title: '參觀 SM 總部',
        desc: '吃完早餐後參觀',
        location: '聖水洞',
      },
      {
        id: 'item-3-2',
        category: 'ACTIVITY',
        time: '11:00',
        title: '參觀 CUBE',
        desc: '走路前往聖水參觀',
        location: '聖水洞',
      },
      {
        id: 'item-3-3',
        category: 'FOOD',
        time: '12:00',
        title: '午餐：廣藏市場',
        desc: '廣藏:母女麻藥飯捲/綠豆煎餅/廣藏糯米糖餅。買棉被。',
        location: '廣藏市場',
      },
      {
        id: 'item-3-4',
        category: 'SHOPPING',
        time: '15:30',
        title: '聖水洞逛街吃甜點',
        desc: '甜點: StandardBread Seongsu 匠心烘焙坊/Dalim Bread/Jayeondo Sogeumppang 小娟推薦麵包釜山也有/韓貞仙 杜拜巧克力+草莓!>>在這邊纛島',
        location: '聖水洞',
      },
      {
        id: 'item-3-5',
        category: 'FOOD',
        time: '18:00',
        title: '晚餐：聖水洞吃晚餐',
        desc: '晚餐: 계자람傳統韓食/傳聞中的聖水脊骨土豆湯/KWONSIK 豬蹄 (聖水本店)/실비옥牛肉海帶湯',
        location: '聖水洞',
      },
      {
        id: 'item-3-6',
        category: 'ACTIVITY',
        time: '19:30',
        title: '繼續逛逛逛',
        desc: '吃完再繼續逛逛逛',
        location: '聖水洞',
      },
      {
        id: 'item-3-7',
        category: 'FOOD',
        time: '21:30',
        title: '宵夜：鐘路三街站(6號  3號、4號出口)',
        desc: '當地夜市小吃',
        location: '中路三街',
      }
    ]
  },
  {
    id: 'day4',
    date: '5/31',
    dayName: 'SUN',
    title: '景福宮 & 前往釜山',
    weather: { temp: '27°', condition: '晴', icon: '01d', high: 'H:29°', low: 'L:21°', location: '首爾' },
    items: [
      {
        id: 'item-4-1',
        category: 'FOOD',
        time: '07:30',
        title: 'Artis Bakery',
        desc: '提前用 Catch Table 預定',
        location: '安國站',
        highlights: [{ type: 'booking', text: '提前預定' }]
      },
      {
        id: 'item-4-2',
        category: 'ACTIVITY',
        time: '09:00',
        title: '景福宮拍照逛逛',
        desc: '倫敦貝果 09:00 預定',
        location: '景福宮',
        highlights: [{ type: 'booking', text: '倫敦貝果預定' }]
      },
      {
        id: 'item-4-3',
        category: 'FOOD',
        time: '11:30',
        title: '午餐：一隻雞',
        desc: '午餐:百部長家一隻雞 (在地人推薦)',
        location: '安國站',
        highlights: [{ type: 'must-eat', text: '百部長家一隻雞' }]
      },
      {
        id: 'item-4-4',
        category: 'FOOD',
        time: '13:00',
        title: '安國站咖啡廳',
        desc: '咖啡廳: 韓屋咖啡廳/onion。買倫敦貝果，找咖啡廳坐一下',
        location: '安國站',
      },
      {
        id: 'item-4-5',
        category: 'TRANSPORT',
        time: '18:00',
        title: '前往釜山',
        desc: '準備搭車前往釜山',
        location: '首爾站',
      },
      {
        id: 'item-4-6',
        category: 'HOTEL',
        time: '20:30',
        title: '抵達釜山',
        desc: '預計 20:00-21:00 抵達',
        location: '釜山站',
      },
      {
        id: 'item-4-7',
        category: 'FOOD',
        time: '22:00',
        title: '宵夜：PURADAK CHICKEN',
        desc: '吃 aespa 聯名披薩',
        location: '釜山',
        highlights: [{ type: 'must-eat', text: 'PURADAK CHICKEN' }]
      }
    ]
  },
  {
    id: 'day5',
    date: '6/01',
    dayName: 'MON',
    title: '海雲台海景',
    weather: { temp: '23°', condition: '晴', icon: '01d', high: 'H:25°', low: 'L:17°', location: '釜山' },
    items: [
      {
        id: 'item-5-1',
        category: 'ACTIVITY',
        time: '08:00',
        title: '早餐',
        desc: '膠囊列車不包含 pass 提早預約!!!! 尾浦站到青砂浦站，膠囊列車限定站 交撓列車青沙埔站下車要到車站領到松亭站的海岸列車車票',
        location: '海雲台',
      },
      {
        id: 'item-5-2',
        category: 'ACTIVITY',
        time: '09:00',
        title: '膠囊列車',
        desc: '地點站為海雲台站',
        location: '海雲台站/尾浦站',
        highlights: [{ type: 'booking', text: '提早預約!!!! 尾浦站到青砂浦站' }]
      },
      {
        id: 'item-5-3',
        category: 'FOOD',
        time: '11:30',
        title: '午餐：秀敏家炭烤蛤蜊',
        desc: '午餐: 秀敏家炭烤蛤蜊鰻魚',
        location: '青砂浦',
        highlights: [{ type: 'must-eat', text: '秀敏家炭烤蛤蜊鰻魚' }]
      },
      {
        id: 'item-5-4',
        category: 'TRANSPORT',
        time: '13:00',
        title: '海雲台海岸列車',
        desc: '吃完飯搭乘海岸列車前往松亭站，釜山 pass 啟動',
        location: '海雲台',
      },
      {
        id: 'item-5-5',
        category: 'ACTIVITY',
        time: '14:00',
        title: 'Skyline Luge',
        desc: '斜坡滑車體驗',
        location: '機張',
      },
      {
        id: 'item-5-6',
        category: 'ACTIVITY',
        time: '15:00',
        title: '吃吃喝喝逛逛',
        desc: '看要不要去 100 樓高看海，上面有星巴克限定馬克杯',
        location: '海雲台',
      },
      {
        id: 'item-5-7',
        category: 'ACTIVITY',
        time: '18:30',
        title: '鑽石遊艇',
        desc: '1. 府慶大學站 2. 搭uber (往遊艇距離較遠留意交通時間距離。50 分鐘遊艇體驗)',
        location: '海雲台',
        highlights: [{ type: 'booking', text: '鑽石遊艇(50 分鐘)' }]
      },
      {
        id: 'item-5-8',
        category: 'FOOD',
        time: '20:00',
        title: '吃點小東西',
        desc: '遊艇可以依當天狀況如不想要可以直接吃晚餐在汗蒸幕',
        location: '海雲台',
      },
      {
        id: 'item-5-9',
        category: 'ACTIVITY',
        time: '21:00',
        title: 'Spa Land 汗蒸幕',
        desc: '放鬆身心',
        location: '新世界百貨',
      },
      {
        id: 'item-5-10',
        category: 'FOOD',
        time: '23:00',
        title: '宵夜',
        desc: '釜山宵夜',
        location: '海雲台',
      }
    ]
  },
  {
    id: 'day6',
    date: '6/02',
    dayName: 'TUE',
    title: '釜山文化巡禮',
    weather: { temp: '23°', condition: '多雲', icon: '03d', high: 'H:25°', low: 'L:17°', location: '釜山' },
    items: [
      {
        id: 'item-6-1',
        category: 'FOOD',
        time: '09:00',
        title: '早餐',
        desc: '享用早餐',
        location: '釜山',
      },
      {
        id: 'item-6-2',
        category: 'TRANSPORT',
        time: '10:00',
        title: '松島纜車',
        desc: '1. 札嘎其站 2. 叫車 (到札嘎其站搭乘 uber 前往松島灣站搭乘纜車)',
        location: '松島',
      },
      {
        id: 'item-6-3',
        category: 'FOOD',
        time: '12:00',
        title: '午餐：札嘎其海鮮市場',
        desc: '午餐: 札嘎其海鮮市場挑餐廳開吃',
        location: '札嘎其',
      },
      {
        id: 'item-6-4',
        category: 'ACTIVITY',
        time: '14:00',
        title: '前往罐頭市場',
        desc: '罐頭市場: 艾草糕。逛逛吃吃',
        location: '南浦洞',
      },
      {
        id: 'item-6-5',
        category: 'FOOD',
        time: '15:30',
        title: '漂亮咖啡廳',
        desc: '下午茶時間',
        location: '釜山',
      },
      {
        id: 'item-6-6',
        category: 'FOOD',
        time: '17:30',
        title: '晚餐 & 最後採買',
        desc: '吃晚餐最後再去西面站 OliveYoung 最後採買',
        location: '西面',
        highlights: [{ type: 'must-buy', text: 'Olive Young 最後採買' }]
      }
    ]
  },
  {
    id: 'day7',
    date: '6/03',
    dayName: 'WED',
    title: '賦歸',
    weather: { temp: '22°', condition: '晴', icon: '01d', high: 'H:24°', low: 'L:16°', location: '釜山' },
    items: [
      {
        id: 'item-7-1',
        category: 'TRANSPORT',
        time: '09:00',
        title: '出發前往機場',
        desc: '出發前往釜山金海機場',
        location: '金海機場',
      }
    ]
  }
];

const INITIAL_CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    id: 'sec1',
    title: '行前檢查',
    items: [
      { id: 'c1', text: '護照', completed: true },
      { id: 'c2', text: 'eSim', completed: true },
      { id: 'c3', text: 'smart pass 申請', completed: true },
      { id: 'c4', text: '機場快線預約', completed: true },
    ]
  },
  {
    id: 'sec2',
    title: '行李清單',
    items: [
      { id: 'c5', text: '換錢', completed: false },
      { id: 'c6', text: '台幣 $10,000', completed: false },
      { id: 'c7', text: '韓幣 $50,000', completed: false },
      { id: 'c8', text: '簽帳卡', completed: true },
    ]
  },
  {
    id: 'sec3',
    title: '3C產品',
    items: [
      { id: 'c9', text: '手機充電線', completed: false },
      { id: 'c10', text: '行動電源', completed: false },
    ]
  },
  {
    id: 'sec4',
    title: '推薦應用程式',
    items: [
      { id: 'c11', text: 'Naver Map', completed: true },
      { id: 'c12', text: 'Papagp/KuliKuli翻譯', completed: true },
      { id: 'c13', text: 'Uber / Kakao T', completed: false },
      { id: 'c14', text: '熊貓外送', completed: false },
    ]
  }
];

// Components
function CategoryIcon({ category, size = 16 }: { category: Category; size?: number }) {
  switch (category) {
    case 'FOOD': return <Utensils size={size} />;
    case 'TRANSPORT': return <Bus size={size} />;
    case 'ACTIVITY': return <Camera size={size} />;
    case 'SHOPPING': return <ShoppingBag size={size} />;
    case 'HOTEL': return <Bed size={size} />;
    case 'FLIGHT': return <Navigation size={size} />;
    default: return <Info size={size} />;
  }
}

function CategoryColor(category: Category) {
  switch (category) {
    case 'FOOD': return 'bg-tag-food';
    case 'TRANSPORT': return 'bg-tag-trans';
    case 'ACTIVITY': return 'bg-tag-activity';
    case 'SHOPPING': return 'bg-tag-shopping';
    case 'HOTEL': return 'bg-tag-hotel';
    case 'FLIGHT': return 'bg-tag-trans';
    default: return 'bg-gray-400';
  }
}

const openExternalLink = async (keyword: string) => {
  try {
    const translated = await translateLocation(keyword);
    const url = `https://map.naver.com/p/search/${encodeURIComponent(translated)}`;
    window.open(url, '_blank');
  } catch (error) {
    console.error('Search error:', error);
    // Fallback search if translation fails
    const url = `https://map.naver.com/p/search/${encodeURIComponent(keyword)}`;
    window.open(url, '_blank');
  }
};

const LinkCard = ({ keyword, index }: { keyword: string; index: number; key?: any }) => {
  const [translated, setTranslated] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTranslation = async () => {
      setLoading(true);
      try {
        const result = await translateLocation(keyword);
        if (result !== keyword) {
          setTranslated(result);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTranslation();
  }, [keyword]);

  return (
    <div 
      onClick={() => openExternalLink(keyword)}
      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-trip-accent/10 shadow-sm hover:shadow-md hover:border-trip-accent/30 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-trip-accent/10 rounded-xl text-trip-accent group-hover:bg-trip-accent group-hover:text-white transition-colors">
          <Navigation size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-black">{keyword}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-[10px] font-black text-trip-accent uppercase tracking-widest">
        開啟導航 <ChevronRight size={12} />
      </div>
    </div>
  );
};

const LinkedDescription = ({ text }: { text: string }) => {
  if (!text) return null;
  
  const keywordList = Object.keys(BLUE_KEYWORDS).sort((a, b) => b.length - a.length);
  // Create a regex that matches any of these keywords
  const regex = new RegExp(`(${keywordList.join('|')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <p className="text-sm text-black leading-relaxed bg-trip-highlight/30 p-4 rounded-2xl border border-trip-highlight/50">
      {parts.map((part, i) => {
        const isKeyword = keywordList.some(k => k.toLowerCase() === part.toLowerCase());
        if (isKeyword) {
          return (
            <span 
              key={i} 
              className="text-black font-black cursor-pointer hover:text-trip-accent transition-colors underline decoration-dotted decoration-trip-accent/30 underline-offset-4"
              onClick={() => openExternalLink(part)}
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </p>
  );
};

interface SortableItemProps {
  item: ItineraryItem;
  onClick: () => void;
  key?: React.Key;
}

function SortableItem({ item, onClick }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="relative flex gap-4 mb-8 group"
    >
      <div className="w-12 text-right pt-1">
        <span className="text-xs font-bold text-trip-text">{item.time}</span>
      </div>
      
      <div className="relative flex-1">
        <div 
          onClick={onClick}
          className="bg-white rounded-[32px] p-6 shadow-xl shadow-trip-accent/5 border border-trip-accent/5 cursor-pointer hover:shadow-trip-accent/10 transition-all hover:-translate-y-1 active:scale-95"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className={`p-2 rounded-xl text-white shadow-md ${CategoryColor(item.category)}`}>
              <CategoryIcon category={item.category} size={16} />
            </span>
            <span className="text-[10px] font-black text-black uppercase tracking-[0.2em]">{item.category}</span>
          </div>
          <h3 className="text-lg font-black text-black leading-tight tracking-tight">{item.title}</h3>
          <p className="text-xs text-black mt-3 line-clamp-2 leading-relaxed font-medium">{item.desc}</p>
          {item.location && (
            <div className="flex items-center gap-2 mt-4 text-[10px] text-black font-black tracking-wider">
              <MapPin size={14} />
              <span>{item.location.toUpperCase()}</span>
            </div>
          )}
        </div>
        
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="absolute -right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
        >
          <GripVertical size={16} className="text-gray-300" />
        </div>
      </div>
    </div>
  );
}

// List of keywords and their specific URLs from the PDF content
const BLUE_KEYWORDS: Record<string, string> = {
  '弘大喉嚨水芹菜烤肉': 'https://naver.me/GUwSxgH4',
  '給豚的男人': 'https://naver.me/GvcToDq4',
  '宇宙家燒肉': 'https://naver.me/GBFHrByb',
  'woojujip': 'https://naver.me/GBFHrByb',
  'POCA SPOT': 'https://map.naver.com/p/entry/place/1479156654?placePath=%2Fhome',
  'POCABO': 'https://naver.me/xjgym7lG',
  'Belluga Music': 'https://naver.me/F9N4pfe5',
  'WithMuu': 'https://naver.me/xrSQQWC6',
  '韓貞仙': 'https://www.google.com/maps/place/HAN+JUNG+SUN/@37.5428607,127.0357149,15z/data=!3m1!4b1!4m6!3m5!1s0x357ca500659ea3e3:0x63f2feeed9344627!8m2!3d37.5428451!4d127.054169!16s%2Fg%2F11vzdqvccs?authuser=0&entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D',
  '계자람': 'https://naver.me/GNWLnnyh',
  '傳聞中的聖水脊骨土豆湯': 'https://naver.me/GgWkGs9y',
  '聖水脊骨土豆湯': 'https://naver.me/GgWkGs9y',
  'KWONSIK 豬蹄': 'https://naver.me/5LHGrEi6',
  '실비옥': 'https://www.threads.com/@tw.kr_daily/post/DVBfwpVE-py',
  'SM': 'https://naver.me/GubOmgcR',
  'CUBE': 'https://naver.me/5cqh53SD',
  '聖水洞': 'https://naver.me/xJqv0k4k',
  'Artis Bakery': 'https://map.naver.com/p/search/Artist%20Bakery/place/1741938125?c=13.92,0,0,0,dh&placePath=/menu?bk_query=Artist%20Bakery&entry=bmp&fromPanelNum=2&timestamp=202604021733&locale=ko&svcName=map_pcv5&searchText=Artist%20Bakery&from=map',
  'Artis bakery': 'https://map.naver.com/p/search/Artist%20Bakery/place/1741938125?c=13.92,0,0,0,dh&placePath=/menu?bk_query=Artist%20Bakery&entry=bmp&fromPanelNum=2&timestamp=202604021733&locale=ko&svcName=map_pcv5&searchText=Artist%20Bakery&from=map',
  '景福宮': 'https://naver.me/Fw7iyAYH',
  '倫敦貝果': 'https://naver.me/xNLZDTek',
  '百部長家一隻雞': 'https://www.instagram.com/reel/DTXyB-ZkaDc/?igsh=cW82bTYyOTA3MWYy',
  '백부장집 닭한마리': 'https://www.instagram.com/reel/DTXyB-ZkaDc/?igsh=cW82bTYyOTA3MWYy',
  '韓屋咖啡廳': 'https://naver.me/GalJ3xcC',
  'Onion': 'https://naver.me/xeAflRKM',
  'onion': 'https://naver.me/xeAflRKM',
  '海雲台站': 'https://naver.me/59ijShU2',
  '秀敏家炭烤蛤蜊': 'https://naver.me/xhzCN8sM',
  '秀敏家炭烤蛤蜊鰻魚': 'https://naver.me/xhzCN8sM',
  'Spa Land': 'https://naver.me/GtUR6zmt',
  'Spa Land 汗蒸幕': 'https://naver.me/GtUR6zmt',
  '罐頭市場': 'https://naver.me/GCvq48kt',
  '艾草糕': 'https://naver.me/xiqBx0Ff',
  '母女麻藥飯捲': 'https://map.naver.com/p/entry/place/19971826?placePath=%2Fhome',
  '糯米糖餅': 'https://map.naver.com/p/entry/place/1015910791?placePath=/home?from=map&fromPanelNum=1&additionalHeight=76&timestamp=202604041002&locale=ko&svcName=map_pcv5&c=15.00,0,0,0,dh',
  '綠豆煎餅': 'https://map.naver.com/p/entry/place/11619260?placePath=%2Fhome&c=15.00,0,0,0,dh',
  'StandardBread Seongsu 匠心烘焙坊': 'https://map.naver.com/p/entry/place/1720159258?placePath=%2Fphoto',
  'Dalim Bread': 'https://map.naver.com/p/entry/place/1235013315?placePath=/home?from=map&fromPanelNum=1&additionalHeight=76&timestamp=202604041043&locale=ko&svcName=map_pcv5',
  'Jayeondo Sogeumppang': 'https://www.google.com/maps/place/Jayeondo+Sogeumppang+(Salt+Bread)+%26+Jayeondoga/@37.5772701,126.965106,13.75z/data=!4m6!3m5!1s0x357ca32599590883:0xd848f1a621f99acc!8m2!3d37.5737007!4d126.9896957!16s%2Fg%2F11v670l2q5?authuser=0&entry=ttu&g_ep=EgoyMDI2MDMzMC4wIKXMDSoASAFQAw%3D%3D',
  '抵達住宿': 'https://map.naver.com/p/search/%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EC%9A%A9%EC%82%B0%EA%B5%AC%20%EB%A7%8C%EB%A6%AC%EC%9E%AC%EB%A1%9C%20202/address/3zhgkn,2ALyWw,%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EC%9A%A9%EC%82%B0%EA%B5%AC%20%EB%A7%8C%EB%A6%AC%EC%9E%AC%EB%A1%9C%20202?c=15.00,0,0,0,dh&isCorrectAnswer=true',
  '明洞站': 'https://map.naver.com/p/entry/subway-station/425?c=16.61,0,0,0,dh',
  '望遠市場': 'https://naver.me/5eUcpKva',
  'HYBE': 'https://naver.me/5Kb3d6r6',
  '弘益大學站': 'https://naver.me/xEABuNEP',
  '廣藏市場': 'https://naver.me/xxY2Amwe',
  '鐘路三街站': 'https://naver.me/5S90vwsN',
  '府慶大學站': 'https://naver.me/5v44lIvr',
  '札嘎其站': 'https://naver.me/xNmlczJB',
  '搭uber': 'https://naver.me/xcg70bqM',
  '叫車': 'https://naver.me/5bCal8VN',
  '松島纜車': 'https://naver.me/xNmlczJB'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => localStorage.getItem('trip_active_tab') || 'day1');
  const [lastDayTab, setLastDayTab] = useState<string>(() => localStorage.getItem('trip_last_day_tab') || 'day1');
  const [daysData, setDaysData] = useState<DayData[]>(() => {
    const saved = localStorage.getItem('trip_days_data');
    return saved ? JSON.parse(saved) : INITIAL_DAYS_DATA;
  });
  const [checklistSections, setChecklistSections] = useState<ChecklistSection[]>(() => {
    const saved = localStorage.getItem('trip_checklist_sections');
    return saved ? JSON.parse(saved) : INITIAL_CHECKLIST_SECTIONS;
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('trip_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [groupExpenses, setGroupExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('trip_group_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [newItem, setNewItem] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPayer, setNewPayer] = useState<'同豪' | 'circle' | '崑源'>('同豪');
  const [groupNewItem, setGroupNewItem] = useState('');
  const [groupNewAmount, setGroupNewAmount] = useState('');
  const [groupNewPayer, setGroupNewPayer] = useState<'同豪' | 'circle' | '崑源'>('同豪');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState(new Date().toTimeString().slice(0, 5));
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChecklistAddOpen, setIsChecklistAddOpen] = useState<string | null>(null);
  const [newChecklistItemText, setNewChecklistItemText] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [showError, setShowError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ItineraryItem>>({});
  const [addForm, setAddForm] = useState<Partial<ItineraryItem>>({
    category: 'ACTIVITY',
    time: '12:00',
    title: '',
    desc: '',
    location: '',
  });

  useEffect(() => {
    const updateWeather = async () => {
      const updatedDays = await Promise.all(daysData.map(async (day, index) => {
        const city = index < 4 ? 'Seoul' : 'Busan';
        const liveWeather = await fetchWeather(city, day.date);
        if (liveWeather) {
          return { ...day, weather: liveWeather };
        }
        return day;
      }));
      setDaysData(updatedDays);
    };
    updateWeather();
  }, []);

  // When selectedItem changes, reset edit state
  useEffect(() => {
    if (selectedItem) {
      setEditForm(selectedItem);
      setIsEditing(false);
    }
  }, [selectedItem]);

  const handleSaveEdit = () => {
    if (!selectedItem || !editForm) return;
    
    setDaysData(prev => prev.map(day => ({
      ...day,
      items: day.items.map(item => 
        item.id === selectedItem.id ? { ...item, ...editForm } as ItineraryItem : item
      )
    })));
    
    setSelectedItem({ ...selectedItem, ...editForm } as ItineraryItem);
    setIsEditing(false);
  };

  const deleteItineraryItem = (id: string) => {
    setDaysData(prev => prev.map(day => ({
      ...day,
      items: day.items.filter(item => item.id !== id)
    })));
    setSelectedItem(null);
  };

  const handleAddItem = () => {
    if (!addForm.title?.trim()) {
      setShowError('請輸入行程名稱');
      setTimeout(() => setShowError(null), 3000);
      return;
    }
    if (!addForm.time) {
      setShowError('請選擇時間');
      setTimeout(() => setShowError(null), 3000);
      return;
    }
    
    const newItem: ItineraryItem = {
      id: Date.now().toString(),
      category: (addForm.category as Category) || 'ACTIVITY',
      time: addForm.time || '12:00',
      title: addForm.title.trim(),
      desc: addForm.desc || '',
      location: addForm.location || '',
      highlights: [],
      recommendedMenu: [],
      shoppingList: [],
    };

    setDaysData(prev => prev.map(day => {
      if (day.id === activeTab) {
        return {
          ...day,
          items: [...day.items, newItem].sort((a, b) => a.time.localeCompare(b.time))
        };
      }
      return day;
    }));

    setIsAddModalOpen(false);
    setShowError(null);
    setShowSuccess('已成功新增行程！');
    setTimeout(() => setShowSuccess(null), 3000);
    
    setAddForm({
      category: 'ACTIVITY',
      time: '12:00',
      title: '',
      desc: '',
      location: '',
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const KRW_TO_TWD = 0.0238; // 1 KRW ≈ 0.0238 TWD (Current approx rate)
  const [totalBudget, setTotalBudget] = useState(() => {
    const saved = localStorage.getItem('trip_total_budget');
    return saved ? parseInt(saved, 10) : 1500000;
  });
  const [spentCurrencyMode, setSpentCurrencyMode] = useState<'KRW' | 'TWD'>('KRW');
  const [budgetCurrencyMode, setBudgetCurrencyMode] = useState<'KRW' | 'TWD'>('KRW');
  const [inputCurrencyMode, setInputCurrencyMode] = useState<'KRW' | 'TWD'>('KRW');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(totalBudget.toString());

  useEffect(() => {
    if (activeTab.startsWith('day')) {
      setLastDayTab(activeTab);
      localStorage.setItem('trip_last_day_tab', activeTab);
    }
    localStorage.setItem('trip_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('trip_days_data', JSON.stringify(daysData));
  }, [daysData]);

  useEffect(() => {
    localStorage.setItem('trip_checklist_sections', JSON.stringify(checklistSections));
  }, [checklistSections]);

  useEffect(() => {
    localStorage.setItem('trip_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('trip_group_expenses', JSON.stringify(groupExpenses));
  }, [groupExpenses]);

  useEffect(() => {
    localStorage.setItem('trip_total_budget', totalBudget.toString());
  }, [totalBudget]);

  const spent = expenses.reduce((acc, curr) => {
    if (curr.currency === 'TWD') {
      return acc + Math.round(curr.amount / KRW_TO_TWD);
    }
    return acc + curr.amount;
  }, 0);
  const remaining = totalBudget - spent;

  const formatTWD = (krw: number) => {
    return Math.round(krw * KRW_TO_TWD).toLocaleString();
  };

  const handleSaveBudget = () => {
    const val = parseFloat(tempBudget);
    if (!isNaN(val)) {
      // Convert TWD input back to KRW for storage
      setTotalBudget(Math.round(val / KRW_TO_TWD));
    }
    setIsEditingBudget(false);
  };

  const addExpense = () => {
    const amount = parseFloat(newAmount);
    if (!newItem.trim()) {
      setShowError('請輸入項目名稱');
      setTimeout(() => setShowError(null), 3000);
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setShowError('請輸入有效金額');
      setTimeout(() => setShowError(null), 3000);
      return;
    }
    
    const expense: Expense = {
      id: Date.now().toString(),
      item: newItem.trim(),
      amount: amount,
      category: 'General',
      currency: inputCurrencyMode,
      payer: newPayer,
      date: newDate,
      time: newTime
    };
    
    setExpenses(prev => [expense, ...prev]);
    setNewItem('');
    setNewAmount('');
    
    setShowError(null);
    setShowSuccess('已成功新增帳目！');
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const addGroupExpense = () => {
    const amount = parseFloat(groupNewAmount);
    if (!groupNewItem.trim()) {
      setShowError('請輸入項目名稱');
      setTimeout(() => setShowError(null), 3000);
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setShowError('請輸入有效金額');
      setTimeout(() => setShowError(null), 3000);
      return;
    }
    
    const expense: Expense = {
      id: Date.now().toString(),
      item: groupNewItem.trim(),
      amount: amount,
      category: 'Group',
      currency: inputCurrencyMode,
      payer: groupNewPayer,
      date: newDate,
      time: newTime
    };
    
    setGroupExpenses(prev => [expense, ...prev]);
    setGroupNewItem('');
    setGroupNewAmount('');
    
    setShowError(null);
    setShowSuccess('已成功新增共同帳目！');
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const deleteGroupExpense = (id: string) => {
    setGroupExpenses(groupExpenses.filter(e => e.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDaysData((prevDays) => {
        const newDays = [...prevDays];
        const dayIndex = newDays.findIndex(d => d.id === activeTab);
        if (dayIndex !== -1) {
          const items = [...newDays[dayIndex].items];
          const oldIndex = items.findIndex(item => item.id === active.id);
          const newIndex = items.findIndex(item => item.id === over.id);
          newDays[dayIndex].items = arrayMove(items, oldIndex, newIndex);
        }
        return newDays;
      });
    }
  };

  const toggleChecklistItem = (sectionId: string, itemId: string) => {
    setChecklistSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map(item => 
            item.id === itemId ? { ...item, completed: !item.completed } : item
          )
        };
      }
      return section;
    }));
  };

  const deleteChecklistItem = (sectionId: string, itemId: string) => {
    setChecklistSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          items: sec.items.filter(item => item.id !== itemId)
        };
      }
      return sec;
    }));
  };

  const addChecklistSection = (title: string) => {
    if (!title.trim()) return;
    setChecklistSections(prev => [
      ...prev,
      { id: Date.now().toString(), title, items: [] }
    ]);
  };

  const deleteChecklistSection = (sectionId: string) => {
    setChecklistSections(prev => prev.filter(sec => sec.id !== sectionId));
  };

  const addChecklistItem = (sectionId: string) => {
    if (!newChecklistItemText.trim()) return;
    
    setChecklistSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          items: [
            ...sec.items,
            { id: Date.now().toString(), text: newChecklistItemText, completed: false }
          ]
        };
      }
      return sec;
    }));
    setNewChecklistItemText('');
    setIsChecklistAddOpen(null);
  };

  const [modalTranslation, setModalTranslation] = useState<string>('');
  const [locationDetail, setLocationDetail] = useState<string>('');

  useEffect(() => {
    if (selectedItem?.location && !isEditing) {
      translateLocation(selectedItem.location).then(res => {
        if (res !== selectedItem.location) setModalTranslation(res);
      });
      getLocationDetails(selectedItem.location).then(res => {
        setLocationDetail(res);
      });
    } else {
      setModalTranslation('');
      setLocationDetail('');
    }
  }, [selectedItem, isEditing]);

  return (
    <div className="min-h-screen bg-trip-bg">
      {/* Premium Header */}
      <header 
        className="bg-trip-header text-trip-warm p-4 pb-2 rounded-b-[24px] shadow-lg shadow-trip-header/10"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
      >
        <h1 className="text-xl font-black tracking-[0.2em] mb-4 text-center">SEOUL TRIP</h1>
        
        {/* Date Navigation - Only show if in a day tab */}
        {activeTab.startsWith('day') && (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
            {daysData.map((day) => (
              <button
                key={day.id}
                onClick={() => setActiveTab(day.id)}
                className={`flex flex-col items-center min-w-[60px] py-2.5 rounded-2xl transition-all duration-300 ${
                  activeTab === day.id ? 'bg-trip-accent text-white shadow-lg shadow-trip-accent/30 scale-105' : 'bg-white/10 opacity-60'
                }`}
              >
                <span className="text-[8px] font-black mb-1 opacity-80">DAY {day.id.replace('day', '')}</span>
                <span className="text-lg font-black leading-none">{day.date}</span>
                <span className="text-[8px] font-black mt-1 opacity-80">{day.dayName}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Navigation Bar - Moved below header */}
      <div className="bg-trip-bg/95 backdrop-blur-xl border-b border-trip-accent/10 px-2 py-2 sticky top-0 z-50 shadow-sm">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          <button 
            onClick={() => setActiveTab('checklist')} 
            className={`relative flex flex-col items-center gap-1 py-3 rounded-2xl transition-all duration-300 ${activeTab === 'checklist' ? 'text-trip-accent' : 'text-trip-sub opacity-50 hover:opacity-100'}`}
          >
            {activeTab === 'checklist' && (
              <motion.div layoutId="activeTab" className="absolute inset-0 bg-trip-accent/10 rounded-2xl" />
            )}
            <CheckSquare size={22} strokeWidth={activeTab === 'checklist' ? 2.5 : 2} className="relative z-10" />
            <span className="text-[8px] font-black tracking-widest uppercase relative z-10">Check</span>
          </button>
          <button 
            onClick={() => setActiveTab(lastDayTab)} 
            className={`relative flex flex-col items-center gap-1 py-3 rounded-2xl transition-all duration-300 ${activeTab.startsWith('day') ? 'text-trip-accent' : 'text-trip-sub opacity-50 hover:opacity-100'}`}
          >
            {activeTab.startsWith('day') && (
              <motion.div layoutId="activeTab" className="absolute inset-0 bg-trip-accent/10 rounded-2xl" />
            )}
            <Calendar size={22} strokeWidth={activeTab.startsWith('day') ? 2.5 : 2} className="relative z-10" />
            <span className="text-[8px] font-black tracking-widest uppercase relative z-10">Plan</span>
          </button>
          <button 
            onClick={() => setActiveTab('budget')} 
            className={`relative flex flex-col items-center gap-1 py-3 rounded-2xl transition-all duration-300 ${activeTab === 'budget' ? 'text-trip-accent' : 'text-trip-sub opacity-50 hover:opacity-100'}`}
          >
            {activeTab === 'budget' && (
              <motion.div layoutId="activeTab" className="absolute inset-0 bg-trip-accent/10 rounded-2xl" />
            )}
            <Wallet size={22} strokeWidth={activeTab === 'budget' ? 2.5 : 2} className="relative z-10" />
            <span className="text-[8px] font-black tracking-widest uppercase relative z-10">Budget</span>
          </button>
          <button 
            onClick={() => setActiveTab('accounting')} 
            className={`relative flex flex-col items-center gap-1 py-3 rounded-2xl transition-all duration-300 ${activeTab === 'accounting' ? 'text-trip-accent' : 'text-trip-sub opacity-50 hover:opacity-100'}`}
          >
            {activeTab === 'accounting' && (
              <motion.div layoutId="activeTab" className="absolute inset-0 bg-trip-accent/10 rounded-2xl" />
            )}
            <Receipt size={22} strokeWidth={activeTab === 'accounting' ? 2.5 : 2} className="relative z-10" />
            <span className="text-[8px] font-black tracking-widest uppercase relative z-10">Accounting</span>
          </button>
          <button 
            onClick={() => setActiveTab('split')} 
            className={`relative flex flex-col items-center gap-1 py-3 rounded-2xl transition-all duration-300 ${activeTab === 'split' ? 'text-trip-accent' : 'text-trip-sub opacity-50 hover:opacity-100'}`}
          >
            {activeTab === 'split' && (
              <motion.div layoutId="activeTab" className="absolute inset-0 bg-trip-accent/10 rounded-2xl" />
            )}
            <Users size={22} strokeWidth={activeTab === 'split' ? 2.5 : 2} className="relative z-10" />
            <span className="text-[8px] font-black tracking-widest uppercase relative z-10">Split</span>
          </button>
        </div>
      </div>

      <main className="max-w-md mx-auto p-6">
        {/* Global Toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 20 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-0 left-1/2 -translate-x-1/2 z-[200] bg-trip-accent text-white px-6 py-3 rounded-full shadow-2xl font-black text-sm flex items-center gap-2"
            >
              <Check size={18} /> {showSuccess}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'checklist' ? (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {checklistSections.map((section) => (
                <div key={section.id}>
                  <div className="flex justify-between items-center mb-5 px-2">
                    <h2 className="text-sm font-black flex items-center gap-3 text-trip-header">
                      <span className="w-1.5 h-5 bg-trip-accent rounded-full shadow-sm shadow-trip-accent/20" />
                      {section.title}
                    </h2>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsChecklistAddOpen(section.id)}
                        className="text-[10px] font-black text-trip-accent flex items-center gap-1.5 bg-trip-accent/10 px-3 py-1.5 rounded-full hover:bg-trip-accent/20 transition-colors"
                      >
                        <Plus size={12} /> ADD
                      </button>
                      <button 
                        onClick={() => deleteChecklistSection(section.id)}
                        className="text-[10px] font-black text-red-500/60 flex items-center gap-1.5 bg-red-500/5 px-3 py-1.5 rounded-full hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={12} /> DELETE
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-[32px] shadow-sm border border-trip-accent/10 overflow-hidden">
                    {isChecklistAddOpen === section.id && (
                      <div className="p-5 border-b border-trip-bg bg-trip-bg/20 flex gap-3">
                        <input 
                          type="text"
                          autoFocus
                          placeholder="Add new item..."
                          value={newChecklistItemText}
                          onChange={(e) => setNewChecklistItemText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addChecklistItem(section.id)}
                          className="flex-1 bg-white border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-trip-accent"
                        />
                        <button 
                          onClick={() => addChecklistItem(section.id)}
                          className="bg-trip-accent text-white p-2 rounded-xl"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => setIsChecklistAddOpen(null)}
                          className="bg-trip-sub/10 text-trip-sub p-2 rounded-xl"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                    {section.items.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => toggleChecklistItem(section.id, item.id)}
                        className="flex items-center gap-4 p-5 border-b border-trip-bg last:border-none cursor-pointer hover:bg-trip-bg/30 transition-colors"
                      >
                        {item.completed ? (
                          <CheckSquare size={20} className="text-trip-accent" />
                        ) : (
                          <Square size={20} className="text-trip-accent/20" />
                        )}
                        <span className={`text-sm font-medium flex-1 ${item.completed ? 'text-trip-sub line-through' : 'text-trip-text'}`}>
                          {item.text}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChecklistItem(section.id, item.id);
                          }}
                          className="p-2 text-trip-sub/40 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Add New Section */}
              <div className="pt-4">
                {isAddSectionOpen ? (
                  <div className="bg-white rounded-[32px] p-6 shadow-sm border border-trip-accent/10 space-y-4">
                    <h3 className="text-xs font-black text-trip-header uppercase tracking-widest">New Section Title</h3>
                    <div className="flex gap-3">
                      <input 
                        type="text"
                        autoFocus
                        placeholder="e.g. Toiletries..."
                        value={newSectionTitle}
                        onChange={(e) => setNewSectionTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && {
                          // @ts-ignore
                          handle: () => {
                            addChecklistSection(newSectionTitle);
                            setNewSectionTitle('');
                            setIsAddSectionOpen(false);
                          }
                        }.handle()}
                        className="flex-1 bg-trip-bg border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-trip-accent"
                      />
                      <button 
                        onClick={() => {
                          addChecklistSection(newSectionTitle);
                          setNewSectionTitle('');
                          setIsAddSectionOpen(false);
                        }}
                        className="bg-trip-accent text-white px-6 rounded-xl font-black text-xs"
                      >
                        ADD
                      </button>
                      <button 
                        onClick={() => setIsAddSectionOpen(false)}
                        className="bg-trip-sub/10 text-trip-sub p-3 rounded-xl"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAddSectionOpen(true)}
                    className="w-full py-6 border-2 border-dashed border-trip-accent/20 rounded-[32px] text-trip-accent/60 font-black text-xs tracking-widest uppercase hover:bg-trip-accent/5 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add New Section
                  </button>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'accounting' ? (
            <motion.div
              key="accounting"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white p-6 rounded-[32px] border border-trip-accent/10 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black flex items-center text-trip-header uppercase tracking-widest">
                    <Plus size={18} className="mr-2 text-trip-accent" /> New Expense
                  </h3>
                  <button 
                    onClick={() => setInputCurrencyMode(prev => prev === 'KRW' ? 'TWD' : 'KRW')}
                    className="flex items-center gap-2 text-[10px] font-black bg-trip-bg px-3 py-1.5 rounded-full text-trip-sub hover:bg-trip-accent/10 hover:text-trip-accent transition-all active:scale-95 border border-trip-accent/5"
                  >
                    <ArrowLeftRight size={12} />
                    {inputCurrencyMode}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-trip-sub uppercase tracking-widest px-1">Date</label>
                      <input 
                        type="date" 
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full bg-trip-bg/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-trip-accent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-trip-sub uppercase tracking-widest px-1">Time</label>
                      <input 
                        type="time" 
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full bg-trip-bg/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-trip-accent transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-trip-sub uppercase tracking-widest px-1">Item Name</label>
                    <input 
                      type="text" 
                      placeholder="What did you buy?" 
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      className="w-full bg-trip-bg/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-trip-accent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-trip-sub uppercase tracking-widest px-1">Amount ({inputCurrencyMode})</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="w-full bg-trip-bg/50 border-none rounded-xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-trip-accent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-trip-sub uppercase tracking-widest px-1">Paid By</label>
                      <select 
                        value={newPayer}
                        onChange={(e) => setNewPayer(e.target.value as any)}
                        className="w-full bg-trip-bg/50 border-none rounded-xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-trip-accent transition-all appearance-none"
                      >
                        <option value="同豪">同豪</option>
                        <option value="circle">circle</option>
                        <option value="崑源">崑源</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={addExpense}
                    className="w-full bg-trip-accent text-white py-4 rounded-xl text-sm font-black shadow-lg shadow-trip-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-2"
                  >
                    ADD EXPENSE
                  </button>

                  {showError && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-xs font-black text-red-500 bg-red-50 py-2 rounded-lg border border-red-100"
                    >
                      {showError}
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-trip-sub uppercase tracking-[0.2em] px-2">Accounting Records</h3>
                {expenses.length === 0 ? (
                  <div className="text-center py-12 text-trip-sub text-sm italic bg-white rounded-[32px] border border-dashed border-trip-accent/20">No records yet</div>
                ) : (
                  <div className="space-y-3">
                    {expenses.map((exp) => (
                      <div key={exp.id} className="bg-white p-5 rounded-2xl border border-trip-accent/5 flex justify-between items-center group hover:border-trip-accent/20 transition-all shadow-sm">
                        <div className="flex gap-4 items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${
                            exp.payer === '同豪' ? 'bg-blue-100 text-blue-600' : 
                            exp.payer === 'circle' ? 'bg-purple-100 text-purple-600' : 
                            'bg-orange-100 text-orange-600'
                          }`}>
                            {exp.payer[0]}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-trip-header">{exp.item}</div>
                            <div className="text-[10px] font-bold text-trip-sub uppercase tracking-wider">
                              {exp.date} • {exp.time} • {exp.payer}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-black text-trip-header">
                              -{exp.amount.toLocaleString()}
                            </div>
                            <div className="text-[9px] font-bold text-trip-sub uppercase tracking-wider">
                              {exp.currency}
                            </div>
                          </div>
                          <button 
                            onClick={() => deleteExpense(exp.id)}
                            className="text-gray-200 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'split' ? (
            <motion.div
              key="split"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Group Expense Input Form */}
              <div className="bg-white p-6 rounded-[32px] border border-trip-accent/10 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black flex items-center text-trip-header uppercase tracking-widest">
                    <Plus size={18} className="mr-2 text-trip-accent" /> New Group Expense
                  </h3>
                  <button 
                    onClick={() => setInputCurrencyMode(prev => prev === 'KRW' ? 'TWD' : 'KRW')}
                    className="flex items-center gap-2 text-[10px] font-black bg-trip-bg px-3 py-1.5 rounded-full text-trip-sub hover:bg-trip-accent/10 hover:text-trip-accent transition-all active:scale-95 border border-trip-accent/5"
                  >
                    <ArrowLeftRight size={12} />
                    {inputCurrencyMode}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-trip-sub uppercase tracking-widest px-1">Item Name</label>
                    <input 
                      type="text" 
                      placeholder="Group meal, taxi, etc." 
                      value={groupNewItem}
                      onChange={(e) => setGroupNewItem(e.target.value)}
                      className="w-full bg-trip-bg/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-trip-accent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-trip-sub uppercase tracking-widest px-1">Amount ({inputCurrencyMode})</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={groupNewAmount}
                        onChange={(e) => setGroupNewAmount(e.target.value)}
                        className="w-full bg-trip-bg/50 border-none rounded-xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-trip-accent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-trip-sub uppercase tracking-widest px-1">Paid By</label>
                      <select 
                        value={groupNewPayer}
                        onChange={(e) => setGroupNewPayer(e.target.value as any)}
                        className="w-full bg-trip-bg/50 border-none rounded-xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-trip-accent transition-all appearance-none"
                      >
                        <option value="同豪">同豪</option>
                        <option value="circle">circle</option>
                        <option value="崑源">崑源</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={addGroupExpense}
                    className="w-full bg-trip-accent text-white py-4 rounded-xl text-sm font-black shadow-lg shadow-trip-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-2"
                  >
                    ADD GROUP EXPENSE
                  </button>
                </div>
              </div>

              {(() => {
                const payers = ['同豪', 'circle', '崑源'];
                const personTotals = payers.reduce((acc, payer) => {
                  acc[payer] = groupExpenses
                    .filter(exp => exp.payer === payer)
                    .reduce((sum, exp) => {
                      if (exp.currency === 'TWD') {
                        return sum + Math.round(exp.amount / KRW_TO_TWD);
                      }
                      return sum + exp.amount;
                    }, 0);
                  return acc;
                }, {} as Record<string, number>);

                const totalSpent = Object.values(personTotals).reduce((a, b) => a + b, 0);
                const share = Math.round(totalSpent / payers.length);

                const balances = payers.map(name => ({
                  name,
                  spent: personTotals[name],
                  net: personTotals[name] - share
                }));

                // Calculate settlements
                const settlements: { from: string; to: string; amount: number }[] = [];
                const debtors = balances.filter(b => b.net < 0).sort((a, b) => a.net - b.net);
                const creditors = balances.filter(b => b.net > 0).sort((a, b) => b.net - a.net);

                let dIdx = 0;
                let cIdx = 0;
                const dNet = debtors.map(d => -d.net);
                const cNet = creditors.map(c => c.net);

                while (dIdx < dNet.length && cIdx < cNet.length) {
                  const amount = Math.min(dNet[dIdx], cNet[cIdx]);
                  if (amount > 0) {
                    settlements.push({
                      from: debtors[dIdx].name,
                      to: creditors[cIdx].name,
                      amount
                    });
                  }
                  dNet[dIdx] -= amount;
                  cNet[cIdx] -= amount;
                  if (dNet[dIdx] === 0) dIdx++;
                  if (cNet[cIdx] === 0) cIdx++;
                }

                return (
                  <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-trip-header text-trip-warm p-8 rounded-[32px] shadow-xl shadow-trip-header/20">
                      <div className="text-[10px] opacity-60 font-black uppercase tracking-widest mb-2">Total Group Expenses</div>
                      <div className="text-4xl font-black mb-1">KRW {totalSpent.toLocaleString()}</div>
                      <div className="text-[10px] opacity-40 font-bold mb-6">≈ TWD ${formatTWD(totalSpent)}</div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                        <div>
                          <div className="text-[8px] opacity-50 font-black uppercase tracking-widest mb-1">Per Person</div>
                          <div className="text-sm font-black">KRW {share.toLocaleString()}</div>
                        </div>
                        <div className="col-span-2 text-right">
                          <div className="text-[8px] opacity-50 font-black uppercase tracking-widest mb-1">Settlement Status</div>
                          <div className="text-sm font-black text-trip-accent">
                            {settlements.length === 0 ? 'All Settled' : `${settlements.length} Pending`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Individual Totals */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-trip-sub uppercase tracking-[0.2em] px-2">Individual Contribution</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {balances.map((b) => (
                          <div key={b.name} className="bg-white p-5 rounded-2xl border border-trip-accent/5 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${
                                b.name === '同豪' ? 'bg-blue-100 text-blue-600' : 
                                b.name === 'circle' ? 'bg-purple-100 text-purple-600' : 
                                'bg-orange-100 text-orange-600'
                              }`}>
                                {b.name[0]}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-trip-header">{b.name}</div>
                                <div className="text-[10px] font-bold text-trip-sub uppercase tracking-wider">
                                  Spent: KRW {b.spent.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-black ${b.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {b.net >= 0 ? '+' : ''}{b.net.toLocaleString()}
                              </div>
                              <div className="text-[9px] font-bold text-trip-sub uppercase tracking-wider">
                                {b.net >= 0 ? 'To Receive' : 'To Pay'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Settlements */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-trip-sub uppercase tracking-[0.2em] px-2">Suggested Settlements</h3>
                      {settlements.length === 0 ? (
                        <div className="text-center py-12 text-trip-sub text-sm italic bg-white rounded-[32px] border border-dashed border-trip-accent/20">
                          Everything is perfectly balanced!
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {settlements.map((s, i) => (
                            <div key={i} className="bg-white p-6 rounded-[32px] border border-trip-accent/10 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-trip-accent" />
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="text-center">
                                    <div className="text-[10px] font-black text-trip-sub uppercase mb-1">From</div>
                                    <div className="text-sm font-black text-trip-header">{s.from}</div>
                                  </div>
                                  <ChevronRight size={16} className="text-trip-accent mt-4" />
                                  <div className="text-center">
                                    <div className="text-[10px] font-black text-trip-sub uppercase mb-1">To</div>
                                    <div className="text-sm font-black text-trip-header">{s.to}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] font-black text-trip-accent uppercase mb-1">Amount</div>
                                  <div className="text-xl font-black text-trip-header">KRW {s.amount.toLocaleString()}</div>
                                  <div className="text-[10px] font-bold text-trip-sub">≈ TWD ${formatTWD(s.amount)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Group Expense Records */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-trip-sub uppercase tracking-[0.2em] px-2">Group Expense Records</h3>
                      {groupExpenses.length === 0 ? (
                        <div className="text-center py-12 text-trip-sub text-sm italic bg-white rounded-[32px] border border-dashed border-trip-accent/20">No group records yet</div>
                      ) : (
                        <div className="space-y-3">
                          {groupExpenses.map((exp) => (
                            <div key={exp.id} className="bg-white p-5 rounded-2xl border border-trip-accent/5 flex justify-between items-center group hover:border-trip-accent/20 transition-all shadow-sm">
                              <div className="flex gap-4 items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${
                                  exp.payer === '同豪' ? 'bg-blue-100 text-blue-600' : 
                                  exp.payer === 'circle' ? 'bg-purple-100 text-purple-600' : 
                                  'bg-orange-100 text-orange-600'
                                }`}>
                                  {exp.payer[0]}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-trip-header">{exp.item}</div>
                                  <div className="text-[10px] font-bold text-trip-sub uppercase tracking-wider">
                                    {exp.date} • {exp.time} • {exp.payer}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-sm font-black text-trip-header">
                                    -{exp.amount.toLocaleString()}
                                  </div>
                                  <div className="text-[9px] font-bold text-trip-sub uppercase tracking-wider">
                                    {exp.currency}
                                  </div>
                                </div>
                                <button 
                                  onClick={() => deleteGroupExpense(exp.id)}
                                  className="text-gray-200 hover:text-red-400 transition-colors p-1"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          ) : activeTab === 'budget' ? (
            <motion.div
              key="budget"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-trip-header text-trip-warm p-8 rounded-3xl shadow-xl shadow-trip-header/20">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-xs opacity-80 font-bold tracking-widest uppercase">
                    Total Spent ({spentCurrencyMode})
                  </div>
                  <button 
                    onClick={() => setSpentCurrencyMode(prev => prev === 'KRW' ? 'TWD' : 'KRW')}
                    className="flex items-center gap-2 text-[10px] font-black bg-trip-accent/20 px-3 py-1.5 rounded-full text-trip-accent hover:bg-trip-accent/30 transition-all active:scale-95"
                  >
                    <ArrowLeftRight size={12} />
                    {spentCurrencyMode === 'KRW' ? 'TWD' : 'KRW'}
                  </button>
                </div>

                <div className="mb-6">
                  <div className="text-4xl font-black">
                    {spentCurrencyMode === 'KRW' ? spent.toLocaleString() : formatTWD(spent)}
                  </div>
                  <div className="text-[10px] opacity-40 font-bold mt-1">
                    {spentCurrencyMode === 'KRW' ? `≈ TWD $${formatTWD(spent)}` : `≈ KRW ${spent.toLocaleString()}`}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-trip-accent transition-all duration-700 ease-out" 
                      style={{ width: `${Math.min((spent / totalBudget) * 100, 100)}%` }}
                    />
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/10">
                      <div className="text-[10px] opacity-60 font-black uppercase tracking-widest">Budget Details</div>
                      <button 
                        onClick={() => setBudgetCurrencyMode(prev => prev === 'KRW' ? 'TWD' : 'KRW')}
                        className="flex items-center gap-1.5 text-[9px] font-black bg-trip-accent/20 px-2 py-1 rounded-full text-trip-accent hover:bg-trip-accent/30 transition-all active:scale-95"
                      >
                        <ArrowLeftRight size={10} />
                        {budgetCurrencyMode}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-white/10">
                      <div className="p-4 group relative">
                        <div className="text-[10px] opacity-60 font-black uppercase tracking-widest mb-1">Budget</div>
                        {isEditingBudget ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input 
                              type="number"
                              placeholder="Amount (TWD)"
                              value={tempBudget}
                              onChange={(e) => setTempBudget(e.target.value)}
                              className="bg-white/10 border-none rounded-lg px-2 py-1 text-sm font-black text-white w-full focus:ring-1 focus:ring-trip-accent"
                              autoFocus
                            />
                            <button 
                              onClick={handleSaveBudget}
                              className="bg-trip-accent p-1.5 rounded-lg text-white"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-black">
                              {budgetCurrencyMode === 'KRW' ? totalBudget.toLocaleString() : formatTWD(totalBudget)}
                            </div>
                            <button 
                              onClick={() => {
                                // Initialize with current budget converted to TWD
                                setTempBudget(Math.round(totalBudget * KRW_TO_TWD).toString());
                                setIsEditingBudget(true);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-full transition-all"
                            >
                              <Edit2 size={12} className="text-trip-accent" />
                            </button>
                          </div>
                        )}
                        <div className="text-[10px] opacity-40 font-bold">
                          {budgetCurrencyMode === 'KRW' ? `≈ TWD $${formatTWD(totalBudget)}` : `≈ KRW ${totalBudget.toLocaleString()}`}
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="text-[10px] text-trip-accent font-black uppercase tracking-widest mb-1">Remaining</div>
                        <div className="text-lg font-black text-trip-accent">
                          {budgetCurrencyMode === 'KRW' ? remaining.toLocaleString() : formatTWD(remaining)}
                        </div>
                        <div className="text-[10px] text-trip-accent/60 font-bold">
                          {budgetCurrencyMode === 'KRW' ? `≈ TWD $${formatTWD(remaining)}` : `≈ KRW ${remaining.toLocaleString()}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          ) : (
            daysData.filter(d => d.id === activeTab).map((day) => (
              <motion.div
                key={day.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="relative"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest">DAY {day.id.replace('day', '')}</span>
                    <span className="text-xs text-trip-sub">{day.date} ({day.dayName})</span>
                  </div>
                </div>

                {/* iOS Style Weather Card - Aligned with itinerary cards */}
                <div className="flex gap-4 mb-8">
                  <div className="w-12" /> {/* Spacer to align with time column */}
                  <div className="flex-1 relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-400 to-blue-600 p-6 text-white shadow-xl shadow-blue-500/20">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                      <Cloud size={120} strokeWidth={1} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold tracking-tight">{day.weather.location}</h3>
                          <div className="text-6xl font-light tracking-tighter mt-1">{day.weather.temp}</div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {day.weather.isLive && (
                              <span className="flex h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                            )}
                            <span className="text-sm font-medium">{day.weather.condition}</span>
                          </div>
                          <div className="text-sm font-medium mt-1 opacity-90">
                            {day.weather.high} {day.weather.low}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="timeline-line" />

                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={day.items.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="relative">
                      {day.items.map((item) => (
                        <SortableItem 
                          key={item.id} 
                          item={item} 
                          onClick={() => setSelectedItem(item)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button - Only show in Plan tab */}
      <AnimatePresence>
        {activeTab.startsWith('day') && (
          <motion.button 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsAddModalOpen(true)}
            className="fixed right-6 bottom-8 w-14 h-14 bg-trip-header text-trip-warm rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border-4 border-white"
          >
            <Plus size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-trip-bg w-full max-w-md rounded-t-[48px] sm:rounded-[48px] overflow-hidden max-h-[90vh] flex flex-col shadow-2xl"
            >
              <div className="p-8 flex justify-between items-center bg-white border-b border-trip-accent/10">
                <div className="flex gap-4">
                  {isEditing ? (
                    <button 
                      onClick={handleSaveEdit}
                      className="text-xs font-black text-trip-accent flex items-center gap-2 bg-trip-accent/10 px-4 py-2 rounded-full hover:bg-trip-accent/20 transition-colors"
                    >
                      <Check size={14} /> SAVE
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-black text-trip-accent flex items-center gap-2 hover:opacity-70 transition-opacity"
                      >
                        <Edit2 size={14} /> EDIT
                      </button>
                      <button 
                        onClick={() => deleteItineraryItem(selectedItem.id)}
                        className="text-xs font-black text-red-500 flex items-center gap-2 hover:opacity-70 transition-opacity"
                      >
                        <Trash2 size={14} /> DELETE
                      </button>
                    </>
                  )}
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-3 bg-trip-bg rounded-full hover:bg-trip-accent/10 transition-colors">
                  <X size={20} className="text-black" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-trip-accent/10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-sm ${CategoryColor(selectedItem.category)}`}>
                      {selectedItem.category}
                    </span>
                    {isEditing ? (
                      <input 
                        type="time" 
                        value={editForm.time || ''} 
                        onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                        className="text-xs font-black text-trip-accent bg-trip-bg border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-trip-accent"
                      />
                    ) : (
                      <span className="text-xs font-black text-black tracking-widest">{selectedItem.time}</span>
                    )}
                  </div>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editForm.title || ''} 
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="text-3xl font-black text-black mb-4 w-full bg-trip-bg border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-trip-accent"
                    />
                  ) : (
                    <div className="space-y-4 mb-4">
                      <h2 className="text-3xl font-black text-black leading-tight">
                        {selectedItem.title}
                      </h2>
                      {(() => {
                        const keywordList = Object.keys(BLUE_KEYWORDS).sort((a, b) => b.length - a.length);
                        const regex = new RegExp(`(${keywordList.join('|')})`, 'gi');
                        
                        // Start with the location field if it exists
                        const cardItems: string[] = [];
                        if (selectedItem.location) {
                          cardItems.push(selectedItem.location);
                        }
                        
                        // Add keywords found in title and description
                        const combinedText = selectedItem.title + ' ' + (selectedItem.desc || '');
                        const foundKeywords = Array.from(new Set(combinedText.match(regex) || []));
                        
                        foundKeywords.forEach(k => {
                          const keyword = keywordList.find(key => key.toLowerCase() === k.toLowerCase()) || k;
                          // Avoid duplicates (case-insensitive)
                          if (!cardItems.some(item => item.toLowerCase() === keyword.toLowerCase())) {
                            cardItems.push(keyword);
                          }
                        });

                        return cardItems.length > 0 && (
                          <div className="grid grid-cols-1 gap-3">
                            {cardItems.map((keyword, i) => (
                              <LinkCard key={i} index={i} keyword={keyword} />
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-black font-bold">
                    <MapPin size={14} />
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editForm.location || ''} 
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="w-full bg-trip-bg border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-trip-accent"
                      />
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-black">
                          {locationDetail || selectedItem.location}
                        </span>
                        {locationDetail && selectedItem.location && (
                          <span className="text-[10px] text-trip-sub font-bold">{selectedItem.location}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {selectedItem.recommendedMenu && (
                  <div className="space-y-5">
                    <h3 className="text-[10px] font-black text-black uppercase tracking-[0.2em] px-2">Recommended Menu</h3>
                    <div className="space-y-3">
                      {selectedItem.recommendedMenu.map((menu, i) => (
                        <div key={i} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-trip-accent/5 hover:border-trip-accent/20 transition-all">
                          <span className="text-sm font-bold text-black">{menu}</span>
                          <ChevronRight size={18} className="text-trip-accent/30" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.shoppingList && (
                  <div className="space-y-5">
                    <h3 className="text-[10px] font-black text-black uppercase tracking-[0.2em] px-2">Shopping List</h3>
                    <div className="space-y-3">
                      {selectedItem.shoppingList.map((shop, i) => (
                        <div key={i} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-trip-accent/5">
                          {shop.completed ? (
                            <CheckSquare size={20} className="text-trip-accent" />
                          ) : (
                            <Square size={20} className="text-trip-accent/20" />
                          )}
                          <span className={`text-sm font-medium ${shop.completed ? 'text-black/40 line-through' : 'text-black'}`}>
                            {shop.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.desc && (
                  <div className="space-y-4">
                    {isEditing ? (
                      <textarea 
                        value={editForm.desc || ''} 
                        onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })}
                        className="w-full h-32 bg-white border border-trip-accent/10 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-trip-accent"
                      />
                    ) : (
                      <LinkedDescription text={selectedItem.desc} />
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Item Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-trip-header/40 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-trip-bg w-full max-w-md rounded-t-[48px] sm:rounded-[48px] p-8 space-y-8 shadow-2xl border border-white max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-trip-header tracking-widest">NEW ITEM</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-white rounded-full shadow-sm hover:bg-trip-accent/10 transition-colors">
                  <X size={20} className="text-trip-header" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-trip-sub uppercase tracking-widest px-1">Time</label>
                    <input 
                      type="time" 
                      value={addForm.time}
                      onChange={(e) => setAddForm({ ...addForm, time: e.target.value })}
                      className="w-full p-4 bg-white rounded-2xl text-sm border-none focus:ring-2 focus:ring-trip-accent shadow-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-trip-sub uppercase tracking-widest px-1">Category</label>
                    <select 
                      value={addForm.category}
                      onChange={(e) => setAddForm({ ...addForm, category: e.target.value as Category })}
                      className="w-full p-4 bg-white rounded-2xl text-sm border-none focus:ring-2 focus:ring-trip-accent shadow-sm appearance-none"
                    >
                      <option value="ACTIVITY">ACTIVITY</option>
                      <option value="FOOD">FOOD</option>
                      <option value="TRANSPORT">TRANSPORT</option>
                      <option value="SHOPPING">SHOPPING</option>
                      <option value="HOTEL">HOTEL</option>
                      <option value="FLIGHT">FLIGHT</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-trip-sub uppercase tracking-widest px-1">Title</label>
                  <input 
                    type="text" 
                    placeholder="Location Name" 
                    value={addForm.title}
                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                    className="w-full p-4 bg-white rounded-2xl text-sm border-none focus:ring-2 focus:ring-trip-accent shadow-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-trip-sub uppercase tracking-widest px-1">Description</label>
                  <textarea 
                    placeholder="Details about this stop..." 
                    value={addForm.desc}
                    onChange={(e) => setAddForm({ ...addForm, desc: e.target.value })}
                    className="w-full p-4 bg-white rounded-2xl text-sm border-none focus:ring-2 focus:ring-trip-accent shadow-sm h-28" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-trip-sub uppercase tracking-widest px-1">Location (Address)</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="e.g. Myeongdong" 
                      value={addForm.location}
                      onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                      className="w-full p-4 pr-14 bg-white rounded-2xl text-sm border-none focus:ring-2 focus:ring-trip-accent shadow-sm" 
                    />
                    <button 
                      onClick={() => {
                        if (addForm.location) openExternalLink(addForm.location);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-trip-accent/10 rounded-xl text-trip-accent hover:bg-trip-accent hover:text-white transition-all shadow-sm active:scale-90"
                    >
                      <Navigation size={18} />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleAddItem}
                  className="w-full py-5 bg-trip-accent text-white rounded-2xl font-black shadow-lg shadow-trip-accent/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  SAVE ITEM
                </button>

                {showError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-xs font-black text-red-500 bg-red-50 py-2 rounded-lg border border-red-100"
                  >
                    {showError}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
