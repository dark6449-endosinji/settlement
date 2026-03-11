import React, { useState, useMemo, useEffect } from 'react';
import { 
  PlusCircle, 
  List, 
  Search, 
  Calendar, 
  User, 
  CreditCard, 
  ArrowUpDown,
  TrendingUp,
  PieChart,
  RefreshCw,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Save
} from 'lucide-react';

// Firebase Database Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';

// ---------------------------------------------------------
// Firebase 초기화 세팅 (실제 배포용 환경)
// ---------------------------------------------------------
let app, auth, db, appId;
try {
  const firebaseConfig = {
    apiKey: "AIzaSyAqKoRf7TA37FUEXI5UFpHBoVVfbxvrQNo",
    authDomain: "my-settlement-app-6fdf0.firebaseapp.com",
    projectId: "my-settlement-app-6fdf0",
    storageBucket: "my-settlement-app-6fdf0.firebasestorage.app",
    messagingSenderId: "739203630953",
    appId: "1:739203630953:web:1f0bcacbf8c1e896a45ff8",
    measurementId: "G-THKJ4LEXHL"
  };
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = 'my-settlement-app-6fdf0';
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// 로컬 타임존(한국 시간 등) 기준으로 정확한 오늘 날짜 문자열(YYYY-MM-DD)을 반환하는 헬퍼 함수
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const App = () => {
  // 상태 관리
  const [items, setItems] = useState([]); 
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 첫 화면을 '조회(view)'로 설정. 'budget' 탭 추가.
  const [activeTab, setActiveTab] = useState('view');

  // 페이지네이션 및 수정/삭제 기능 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const ITEMS_PER_PAGE = 10;

  // 예산 상태 관리
  const [budget, setBudget] = useState({
    교사운영비: 700000,
    학생교육비: 3140000,
    팀운영비: 300000,
    행사비: 4500000
  });
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  // 입력 폼 상태 (UTC 시간 차이 문제를 해결하기 위해 getTodayDateString 함수 사용)
  const [formData, setFormData] = useState({
    date: getTodayDateString(),
    content: '',
    brief: '', // 드롭다운(select)에서 선택
    details: '',
    amount: '',
    recipient: '',
    status: '대기',
    settlementDate: ''
  });

  // ---------------------------------------------------------
  // 1. 사용자 인증 처리 (Firebase Auth)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth Error:", err);
        setIsLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------
  // 2. 데이터 실시간 불러오기 (Firebase Firestore)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!user || !db) return;
    
    setIsLoading(true);
    // 정산 내역 데이터 (공용 경로)
    const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'settlements');
    const unsubscribeItems = onSnapshot(itemsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Data Fetch Error:", error);
      setIsLoading(false);
    });

    // 예산 데이터 (공용 경로)
    const budgetRef = doc(db, 'artifacts', appId, 'public', 'data', 'budget', 'current');
    const unsubscribeBudget = onSnapshot(budgetRef, (snapshot) => {
      if (snapshot.exists()) {
        setBudget(snapshot.data());
      }
    }, (error) => {
      console.error("Budget Fetch Error:", error);
    });

    return () => {
      unsubscribeItems();
      unsubscribeBudget();
    };
  }, [user]);

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ---------------------------------------------------------
  // 3. 데이터 추가 및 수정 핸들러 (Firestore 저장)
  // ---------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content || !formData.amount || !formData.recipient || !formData.brief) {
      return;
    }
    
    const itemData = {
      ...formData,
      amount: Number(formData.amount),
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      if (user && db) {
        const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'settlements', editingId.toString());
        await updateDoc(itemRef, itemData);
      } else {
        setItems(prev => prev.map(i => i.id === editingId ? { ...i, ...itemData } : i));
      }
      setEditingId(null);
    } else {
      itemData.createdAt = new Date().toISOString();
      if (user && db) {
        const newId = Date.now().toString();
        const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'settlements', newId);
        await setDoc(itemRef, { ...itemData, id: newId });
      } else {
        setItems(prev => [...prev, { ...itemData, id: Date.now().toString() }]);
      }
      setCurrentPage(1); 
    }

    setFormData({
      date: getTodayDateString(),
      content: '',
      brief: '',
      details: '',
      amount: '',
      recipient: '',
      status: '대기',
      settlementDate: ''
    });
    
    setActiveTab('view');
  };

  // ---------------------------------------------------------
  // 3-1. 기타 기능 핸들러 (수정, 삭제, 상태변경, 예산 저장)
  // ---------------------------------------------------------
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      date: getTodayDateString(),
      content: '', brief: '', details: '', amount: '', recipient: '', status: '대기', settlementDate: ''
    });
  };

  const handleEditClick = (item) => {
    setFormData({
      date: item.date,
      content: item.content,
      brief: item.brief || '',
      details: item.details || '',
      amount: item.amount.toString(),
      recipient: item.recipient,
      status: item.status,
      settlementDate: item.settlementDate || ''
    });
    setEditingId(item.id);
    setActiveTab('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (user && db) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settlements', id.toString()));
      } catch (error) {
        console.error("Delete error", error);
      }
    } else {
      setItems(prev => prev.filter(item => item.id !== id));
    }
    setDeleteConfirmId(null);
  };

  const toggleStatus = async (item) => {
    const isCompleted = item.status === '완료';
    const newStatus = isCompleted ? '대기' : '완료';
    const newSettlementDate = isCompleted ? '' : getTodayDateString();
    
    const updatedItem = { 
      ...item, 
      status: newStatus,
      settlementDate: newSettlementDate
    };

    if (user && db) {
      try {
        const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'settlements', item.id.toString());
        await updateDoc(itemRef, updatedItem);
      } catch (error) {
        console.error("Status update error", error);
      }
    } else {
      setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
    }
  };

  const handleSaveBudget = async () => {
    if (user && db) {
      try {
        const budgetRef = doc(db, 'artifacts', appId, 'public', 'data', 'budget', 'current');
        await setDoc(budgetRef, budget);
      } catch (error) {
        console.error("Budget save error:", error);
      }
    }
    setIsEditingBudget(false);
  };

  // ---------------------------------------------------------
  // 데이터 가공 및 정렬
  // ---------------------------------------------------------
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [items]);

  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE) || 1;
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedItems, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  // 통계용 월별 합계 데이터
  const monthlyTotals = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      const month = item.date.substring(0, 7);
      groups[month] = (groups[month] || 0) + item.amount;
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);

  // 통계용 수령인별 합계 데이터
  const recipientTotals = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      groups[item.recipient] = (groups[item.recipient] || 0) + item.amount;
    });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  }, [items]);

  // ---------------------------------------------------------
  // 예산 계산 로직 (동적 산출)
  // ---------------------------------------------------------
  // 항목별 지출 합계 계산 (적요 기준)
  const spent = useMemo(() => {
    const s = { 교사운영비: 0, 학생교육비: 0, 팀운영비: 0, 행사비: 0 };
    items.forEach(item => {
      // 적요(brief)가 예산 항목과 일치하는 경우 차감 (대기/완료 모두 예산 잔액에 반영)
      if (s[item.brief] !== undefined) {
        s[item.brief] += item.amount;
      }
    });
    return s;
  }, [items]);

  const calcTotal = (keys) => keys.reduce((acc, key) => acc + (budget[key] || 0), 0);
  const calcSpent = (keys) => keys.reduce((acc, key) => acc + (spent[key] || 0), 0);

  const renderBudgetRow = (label, keys, isSubItem = false, isHeader = false) => {
    const rowBudget = calcTotal(keys);
    const rowSpent = calcSpent(keys);
    const rowRemain = rowBudget - rowSpent;
    const isBaseItem = keys.length === 1 && isSubItem;
    const baseKey = keys[0];

    return (
      <tr className={`border-b border-gray-200 ${isHeader ? 'bg-yellow-100/60 font-bold' : 'hover:bg-gray-50'} transition-colors`}>
        <td className={`px-4 md:px-6 py-3 md:py-4 border-r border-gray-200 ${isSubItem ? 'pl-8 md:pl-12 text-gray-600 text-left' : 'font-semibold text-gray-800 text-center'}`}>
          {label}
        </td>
        <td className="px-4 md:px-6 py-3 md:py-4 text-right border-r border-gray-200">
          {isEditingBudget && isBaseItem ? (
            <div className="flex justify-end items-center gap-1">
              <span className="text-gray-400">₩</span>
              <input
                type="number"
                value={budget[baseKey] || 0}
                onChange={(e) => setBudget(prev => ({...prev, [baseKey]: Number(e.target.value)}))}
                className="w-24 md:w-32 p-1.5 border border-indigo-300 rounded text-right focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50"
              />
            </div>
          ) : (
            <span className="font-medium text-gray-800">₩{rowBudget.toLocaleString()}</span>
          )}
        </td>
        <td className="px-4 md:px-6 py-3 md:py-4 text-right text-rose-600 font-medium border-r border-gray-200">
          {rowSpent > 0 ? `- ₩${rowSpent.toLocaleString()}` : `₩0`}
        </td>
        <td className="px-4 md:px-6 py-3 md:py-4 text-right text-indigo-600 font-bold">
          ₩{rowRemain.toLocaleString()}
        </td>
      </tr>
    );
  };

  const group1Keys = ['교사운영비', '학생교육비', '팀운영비'];
  const group2Keys = ['행사비'];
  const allKeys = [...group1Keys, ...group2Keys];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-700 flex items-center gap-2">
              <CreditCard className="w-6 h-6 md:w-8 md:h-8" />
              Smart Settlement
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">간편하게 정산 내역을 입력하고 관리하세요.</p>
          </div>
          
          {/* Tabs Navigation (3 탭으로 확장) */}
          <div className="flex flex-wrap md:flex-nowrap bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-full md:w-auto self-start">
            <button
              onClick={() => setActiveTab('view')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 rounded-lg transition-all text-sm md:text-base ${
                activeTab === 'view' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Search size={16} />
              <span className="font-medium">조회</span>
            </button>
            <button
              onClick={() => setActiveTab('input')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 rounded-lg transition-all text-sm md:text-base ${
                activeTab === 'input' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <PlusCircle size={16} />
              <span className="font-medium">입력</span>
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 rounded-lg transition-all text-sm md:text-base ${
                activeTab === 'budget' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Wallet size={16} />
              <span className="font-medium">예산</span>
            </button>
          </div>
        </header>

        <main>
          {/* 로딩 표시 */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-indigo-600 font-medium">데이터를 불러오는 중...</span>
            </div>
          )}

          {/* TAB 1: INPUT SCREEN */}
          {!isLoading && activeTab === 'input' && (
            <div className="bg-white rounded-2xl shadow-sm md:shadow-lg p-5 md:p-8 border border-gray-100 animate-in fade-in duration-300">
              <h2 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2 border-b pb-4 text-gray-700">
                {editingId ? <Pencil className="text-indigo-500 w-5 h-5" /> : <PlusCircle className="text-indigo-500 w-5 h-5" />}
                {editingId ? '정산 내역 수정' : '정산 내역 입력'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-600">일자 *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-600">내용 *</label>
                  <input
                    type="text"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="예: 사무용품 구매"
                    className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-600">적요 (예산 항목) *</label>
                  <select
                    name="brief"
                    value={formData.brief}
                    onChange={handleChange}
                    className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors font-medium text-gray-800"
                    required
                  >
                    <option value="">항목을 선택하세요 (필수)</option>
                    <option value="교사운영비">교사운영비</option>
                    <option value="학생교육비">학생교육비</option>
                    <option value="팀운영비">팀운영비</option>
                    <option value="행사비">행사비</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-600">금액 *</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full p-3 md:p-3.5 pl-9 md:pl-10 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                      required
                    />
                    <span className="absolute left-3.5 top-3.5 text-gray-400 font-medium">₩</span>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-gray-600">상세</label>
                  <input
                    type="text"
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    placeholder="상세 내용을 입력하세요."
                    lang="ko"
                    spellCheck="false"
                    className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-600">수령인 *</label>
                  <input
                    type="text"
                    name="recipient"
                    value={formData.recipient}
                    onChange={handleChange}
                    placeholder="이름"
                    className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600">정산현황</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                    >
                      <option value="대기">대기</option>
                      <option value="진행중">진행중</option>
                      <option value="완료">완료</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600">정산일자</label>
                    <input
                      type="date"
                      name="settlementDate"
                      value={formData.settlementDate}
                      onChange={handleChange}
                      className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors text-sm md:text-base"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 pt-4 flex flex-col md:flex-row gap-3 md:gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-3.5 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md hover:shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    {editingId ? '데이터 수정하기' : '데이터 저장하기'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="py-3.5 md:py-4 px-8 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-colors"
                    >
                      취소
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: INQUIRY SCREEN */}
          {!isLoading && activeTab === 'view' && (
            <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 col-span-2 md:col-span-1">
                  <div className="p-2 md:p-3 bg-indigo-100 text-indigo-600 rounded-xl w-fit">
                    <ArrowUpDown size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">총 정산 건수</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-800">{items.length} 건</p>
                  </div>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 md:p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <TrendingUp size={16} className="md:w-5 md:h-5" />
                    </div>
                    <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">총 정산 금액</p>
                  </div>
                  <p className="text-lg md:text-2xl font-bold text-gray-800 break-all leading-tight">₩{items.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 md:p-2 bg-amber-100 text-amber-600 rounded-lg">
                      <PieChart size={16} className="md:w-5 md:h-5" />
                    </div>
                    <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">미정산 금액</p>
                  </div>
                  <p className="text-lg md:text-2xl font-bold text-gray-800 break-all leading-tight">₩{items.filter(i => i.status !== '완료').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Detail List */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm md:text-base">
                    <List className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
                    상세 내역 목록
                  </h3>
                </div>
                
                {/* 1. Mobile Card View */}
                <div className="block md:hidden divide-y divide-gray-100">
                  {currentItems.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="pr-2">
                          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.date}</span>
                          <h4 className="font-bold text-gray-800 text-sm mt-1.5 leading-tight">{item.content}</h4>
                          {item.details && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.details}</p>}
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <div className="font-bold text-indigo-600 text-sm">₩{item.amount.toLocaleString()}</div>
                          <div className="mt-1.5 flex justify-end">
                            <button
                              onClick={() => toggleStatus(item)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all shadow-sm ${
                                item.status === '완료' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              <RefreshCw size={10} className={item.status === '완료' ? 'text-emerald-500' : 'text-amber-600'} />
                              {item.status}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 rounded text-indigo-700 text-[11px] font-medium">
                            <User size={10} /> {item.recipient}
                          </span>
                          {item.brief && <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 px-1 rounded">{item.brief}</span>}
                        </div>
                        <div className="flex gap-1.5">
                          {deleteConfirmId === item.id ? (
                            <div className="flex items-center gap-1 text-[10px]">
                              <span className="text-red-500 font-bold mr-1">삭제?</span>
                              <button onClick={() => handleDelete(item.id)} className="px-2 py-1 bg-red-100 text-red-600 rounded">예</button>
                              <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded">아니오</button>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => handleEditClick(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 rounded"><Pencil size={14} /></button>
                              <button onClick={() => setDeleteConfirmId(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded"><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {currentItems.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">데이터가 없습니다.</div>}
                </div>

                {/* 2. Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-500 border-b">
                      <tr>
                        <th className="px-6 py-4 font-semibold">일자</th>
                        <th className="px-6 py-4 font-semibold">내용</th>
                        <th className="px-6 py-4 font-semibold">적요</th>
                        <th className="px-6 py-4 font-semibold text-right">금액</th>
                        <th className="px-6 py-4 font-semibold text-center">수령인</th>
                        <th className="px-6 py-4 font-semibold text-center">현황</th>
                        <th className="px-6 py-4 font-semibold">정산일자</th>
                        <th className="px-6 py-4 font-semibold text-center">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {currentItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{item.date}</td>
                          <td className="px-6 py-4 whitespace-normal min-w-[150px]">
                            <div className="font-medium text-gray-800">{item.content}</div>
                            {item.details && <div className="text-xs text-gray-400 mt-0.5">{item.details}</div>}
                          </td>
                          <td className="px-6 py-4 text-rose-500 font-medium">{item.brief}</td>
                          <td className="px-6 py-4 text-right font-bold text-indigo-600">₩{item.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-gray-600 text-xs font-medium"><User size={12} /> {item.recipient}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => toggleStatus(item)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-sm ${
                                item.status === '완료' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              }`}
                            >
                              <RefreshCw size={12} className={item.status === '완료' ? 'text-emerald-500' : 'text-amber-600'} /> {item.status}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{item.settlementDate || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            {deleteConfirmId === item.id ? (
                              <div className="flex items-center justify-center gap-1 text-xs">
                                <span className="text-red-500 font-bold mr-1">삭제?</span>
                                <button onClick={() => handleDelete(item.id)} className="px-2 py-1 bg-red-100 text-red-600 rounded">예</button>
                                <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded">아니오</button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleEditClick(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Pencil size={16} /></button>
                                <button onClick={() => setDeleteConfirmId(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {currentItems.length === 0 && <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-400">데이터가 없습니다.</td></tr>}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                {sortedItems.length > 0 && (
                  <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-3 bg-gray-50/50">
                    <span className="text-xs md:text-sm text-gray-500">
                      총 <span className="font-bold text-gray-900">{sortedItems.length}</span>건 
                      <span className="hidden md:inline"> 중 <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, sortedItems.length)}</span>건</span>
                    </span>
                    <div className="flex items-center gap-1 md:gap-2">
                      <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-white md:bg-transparent"><ChevronLeft size={16} /></button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }).map((_, idx) => {
                          const pageNum = idx + 1;
                          if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                            return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-7 h-7 md:w-8 md:h-8 rounded text-xs md:text-sm font-medium ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 bg-white md:bg-transparent'}`}>{pageNum}</button>;
                          } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                            return <span key={pageNum} className="text-gray-400 px-0.5 md:px-1 text-xs md:text-sm">...</span>;
                          } return null;
                        })}
                      </div>
                      <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-white md:bg-transparent"><ChevronRight size={16} /></button>
                    </div>
                  </div>
                )}
              </div>

              {/* [복구됨] Statistics Tables (월별 합계 & 수령인별 합계) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4">
                {/* Monthly Total */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-3 md:p-4 border-b bg-gray-50/80 font-bold flex items-center gap-2 text-sm md:text-base text-gray-700">
                    <Calendar size={18} className="text-indigo-500" /> 월별 합계
                  </div>
                  <div className="p-0 md:p-2">
                    <table className="w-full text-sm md:text-base">
                      <thead>
                        <tr className="text-[11px] md:text-xs text-gray-400 border-b bg-white">
                          <th className="px-4 py-2 text-left font-medium">월 (Year-Month)</th>
                          <th className="px-4 py-2 text-right font-medium">합계 금액</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {monthlyTotals.map(([month, total]) => (
                          <tr key={month} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2.5 md:py-3 font-medium text-gray-700">{month}</td>
                            <td className="px-4 py-2.5 md:py-3 text-right font-bold text-emerald-600">₩{total.toLocaleString()}</td>
                          </tr>
                        ))}
                        {monthlyTotals.length === 0 && (
                          <tr><td colSpan="2" className="text-center py-4 text-xs text-gray-400">데이터가 없습니다.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recipient Total */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-3 md:p-4 border-b bg-gray-50/80 font-bold flex items-center gap-2 text-sm md:text-base text-gray-700">
                    <User size={18} className="text-indigo-500" /> 수령인별 합계
                  </div>
                  <div className="p-0 md:p-2">
                    <table className="w-full text-sm md:text-base">
                      <thead>
                        <tr className="text-[11px] md:text-xs text-gray-400 border-b bg-white">
                          <th className="px-4 py-2 text-left font-medium">수령인</th>
                          <th className="px-4 py-2 text-right font-medium">합계 금액</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {recipientTotals.map(([name, total]) => (
                          <tr key={name} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2.5 md:py-3 font-medium flex items-center gap-2 text-gray-700">
                               <div className="w-5 h-5 md:w-6 md:h-6 bg-indigo-100 rounded-full flex items-center justify-center text-[9px] md:text-[10px] text-indigo-600 font-bold flex-shrink-0">
                                {name.substring(0,1)}
                               </div>
                               <span className="truncate max-w-[100px] md:max-w-none">{name}</span>
                            </td>
                            <td className="px-4 py-2.5 md:py-3 text-right font-bold text-indigo-600">₩{total.toLocaleString()}</td>
                          </tr>
                        ))}
                        {recipientTotals.length === 0 && (
                          <tr><td colSpan="2" className="text-center py-4 text-xs text-gray-400">데이터가 없습니다.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BUDGET SCREEN (신규 추가된 예산 탭) */}
          {!isLoading && activeTab === 'budget' && (
            <div className="bg-white rounded-2xl shadow-sm md:shadow-lg border border-gray-100 overflow-hidden animate-in fade-in duration-300">
              <div className="p-4 md:p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm md:text-base">
                  <Wallet className="w-5 h-5 text-indigo-500" />
                  연간 예산 및 지출 현황
                </h3>
                {isEditingBudget ? (
                  <button
                    onClick={handleSaveBudget}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Save size={16} /> 변경사항 저장
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingBudget(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Pencil size={16} /> 예산 설정
                  </button>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-center border-r border-gray-200">활동항목명</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-right border-r border-gray-200">예산액</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-right border-r border-gray-200">지출액 (차감)</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-right">잔여 예산</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderBudgetRow('합 계', allKeys, false, true)}
                    {renderBudgetRow('사회봉사비', allKeys)}
                    {renderBudgetRow('봉사비', allKeys)}
                    {renderBudgetRow('교회학교운영비(장)', group1Keys)}
                    {renderBudgetRow('· 교사운영비', ['교사운영비'], true)}
                    {renderBudgetRow('· 학생교육비', ['학생교육비'], true)}
                    {renderBudgetRow('· 팀운영비', ['팀운영비'], true)}
                    {renderBudgetRow('교회학교행사비(장)', group2Keys)}
                    {renderBudgetRow('· 행사비', ['행사비'], true)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        <footer className="mt-8 md:mt-12 text-center text-gray-400 text-xs md:text-sm pb-8">
          &copy; 2024 Smart Settlement & Budget System. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default App;
