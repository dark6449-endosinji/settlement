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
  ChevronRight
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

const App = () => {
  // 상태 관리
  const [items, setItems] = useState([]); // 초기 데이터를 빈 배열로 시작하여 DB에서 불러옴
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // [수정됨] 첫 화면을 '입력(input)'에서 '조회(view)'로 변경
  const [activeTab, setActiveTab] = useState('view');

  // 페이지네이션 및 수정/삭제 기능 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const ITEMS_PER_PAGE = 10;

  // 입력 폼 상태
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    content: '',
    brief: '',
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
  // 2. 데이터 실시간 불러오기 (Firebase Firestore) - 공용 데이터베이스 경로로 변경
  // ---------------------------------------------------------
  useEffect(() => {
    if (!user || !db) return;
    
    setIsLoading(true);
    // [변경됨] 개인별 경로(users/user.uid) -> 모든 사람이 접근 가능한 공용 경로(public/data)
    const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'settlements');
    
    // onSnapshot을 통한 실시간 데이터 연동
    const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Data Fetch Error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
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
    if (!formData.content || !formData.amount || !formData.recipient) {
      return;
    }
    
    const itemData = {
      ...formData,
      amount: Number(formData.amount),
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      // 데이터 수정
      if (user && db) {
        const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'settlements', editingId.toString());
        await updateDoc(itemRef, itemData);
      } else {
        setItems(prev => prev.map(i => i.id === editingId ? { ...i, ...itemData } : i));
      }
      setEditingId(null);
    } else {
      // 데이터 신규 추가
      itemData.createdAt = new Date().toISOString();
      if (user && db) {
        const newId = Date.now().toString();
        const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'settlements', newId);
        await setDoc(itemRef, { ...itemData, id: newId });
      } else {
        setItems(prev => [...prev, { ...itemData, id: Date.now().toString() }]);
      }
      setCurrentPage(1); // 새 데이터 추가 시 최신 페이지(1페이지)로 이동
    }

    setFormData({
      date: new Date().toISOString().split('T')[0],
      content: '',
      brief: '',
      details: '',
      amount: '',
      recipient: '',
      status: '대기',
      settlementDate: ''
    });
    
    // 저장 후 조회 탭으로 자동 이동 (편의성)
    setActiveTab('view');
  };

  // ---------------------------------------------------------
  // 3-1. 수정 취소 / 수정 모드 진입 / 삭제 핸들러
  // ---------------------------------------------------------
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
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

  // ---------------------------------------------------------
  // 4. 상태 변경 토글 핸들러 (대기 <-> 완료)
  // ---------------------------------------------------------
  const toggleStatus = async (item) => {
    const isCompleted = item.status === '완료';
    const newStatus = isCompleted ? '대기' : '완료';
    const newSettlementDate = isCompleted ? '' : new Date().toISOString().split('T')[0];
    
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

  // 조회 데이터 처리: 날짜순 정렬 (최신순 내림차순)
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [items]);

  // 페이지네이션 처리
  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE) || 1;
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedItems, currentPage]);

  // 데이터 삭제 등으로 페이지 수를 초과하게 된 경우 보정
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  // 월별 합계 계산
  const monthlyTotals = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      const month = item.date.substring(0, 7);
      groups[month] = (groups[month] || 0) + item.amount;
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);

  // 수령인별 합계 계산
  const recipientTotals = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      groups[item.recipient] = (groups[item.recipient] || 0) + item.amount;
    });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  }, [items]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header - 모바일에서 로고와 탭 간격 조절 */}
        <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-700 flex items-center gap-2">
              <CreditCard className="w-6 h-6 md:w-8 md:h-8" />
              Smart Settlement
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">간편하게 정산 내역을 입력하고 관리하세요.</p>
          </div>
          
          {/* Tabs Navigation */}
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-full md:w-auto self-start">
            <button
              onClick={() => setActiveTab('view')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-lg transition-all text-sm md:text-base ${
                activeTab === 'view' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Search size={18} />
              <span className="font-medium">조회</span>
            </button>
            <button
              onClick={() => setActiveTab('input')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-lg transition-all text-sm md:text-base ${
                activeTab === 'input' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <PlusCircle size={18} />
              <span className="font-medium">입력</span>
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
                  <label className="text-sm font-semibold text-gray-600">적요</label>
                  <input
                    type="text"
                    name="brief"
                    value={formData.brief}
                    onChange={handleChange}
                    placeholder="핵심 요약 정보"
                    className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                  />
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

              {/* Detail List (Responsive: Cards on Mobile, Table on PC) */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm md:text-base">
                    <List className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
                    상세 내역 목록
                  </h3>
                </div>
                
                {/* 1. Mobile Card View (md:hidden) */}
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
                                item.status === '완료' 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-amber-100 text-amber-700'
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
                          {item.brief && <span className="text-[11px] text-gray-400">{item.brief}</span>}
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
                              <button onClick={() => handleEditClick(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 rounded" title="수정"><Pencil size={14} /></button>
                              <button onClick={() => setDeleteConfirmId(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded" title="삭제"><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {currentItems.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">데이터가 없습니다.</div>
                  )}
                </div>

                {/* 2. Desktop Table View (hidden md:block) */}
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
                          <td className="px-6 py-4 text-gray-500">{item.brief}</td>
                          <td className="px-6 py-4 text-right font-bold text-indigo-600">₩{item.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-gray-600 text-xs font-medium">
                              <User size={12} /> {item.recipient}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => toggleStatus(item)}
                              title="클릭하여 상태 변경"
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-sm ${
                                item.status === '완료' 
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              }`}
                            >
                              <RefreshCw size={12} className={item.status === '완료' ? 'text-emerald-500' : 'text-amber-600'} />
                              {item.status}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{item.settlementDate || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            {deleteConfirmId === item.id ? (
                              <div className="flex items-center justify-center gap-1 text-xs">
                                <span className="text-red-500 font-bold mr-1">삭제?</span>
                                <button onClick={() => handleDelete(item.id)} className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors">예</button>
                                <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">아니오</button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => handleEditClick(item)}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                  title="수정"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirmId(item.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="삭제"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {currentItems.length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                            저장된 데이터가 없습니다. 먼저 내역을 입력해주세요.
                          </td>
                        </tr>
                      )}
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
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white md:bg-transparent"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }).map((_, idx) => {
                          const pageNum = idx + 1;
                          if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-7 h-7 md:w-8 md:h-8 rounded text-xs md:text-sm font-medium transition-colors ${
                                  currentPage === pageNum ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 bg-white md:bg-transparent'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                            return <span key={pageNum} className="text-gray-400 px-0.5 md:px-1 text-xs md:text-sm">...</span>;
                          }
                          return null;
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white md:bg-transparent"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Statistics Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
        </main>

        <footer className="mt-8 md:mt-12 text-center text-gray-400 text-xs md:text-sm pb-8">
          &copy; 2024 Settlement Management System. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default App;
