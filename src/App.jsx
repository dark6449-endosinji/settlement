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
  RefreshCw
} from 'lucide-react';

// Firebase Database Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

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
  const [activeTab, setActiveTab] = useState('input');

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
  // 2. 데이터 실시간 불러오기 (Firebase Firestore)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!user || !db) return;
    
    setIsLoading(true);
    // 개인별 안전한 저장 경로 설정
    const itemsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'settlements');
    
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
  // 3. 데이터 추가 핸들러 (Firestore 저장)
  // ---------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content || !formData.amount || !formData.recipient) {
      alert('필수 항목을 입력해주세요.');
      return;
    }
    
    const newItem = {
      ...formData,
      amount: Number(formData.amount),
      createdAt: new Date().toISOString()
    };

    if (user && db) {
      // Firebase가 연결된 경우 클라우드에 저장
      const newId = Date.now().toString();
      const itemRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settlements', newId);
      await setDoc(itemRef, { ...newItem, id: newId });
    } else {
      // Firebase 연결 실패 시 로컬 임시 상태에만 추가 (Vercel 등에 DB 설정 전 대응)
      setItems(prev => [...prev, { ...newItem, id: Date.now().toString() }]);
    }

    alert('저장되었습니다.');
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
        const itemRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settlements', item.id.toString());
        await setDoc(itemRef, updatedItem, { merge: true });
      } catch (error) {
        console.error("Status update error", error);
        alert('상태 업데이트에 실패했습니다.');
      }
    } else {
      setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
    }
  };

  // 조회 데이터 처리: 날짜순 정렬
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [items]);

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
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700 flex items-center gap-2">
              <CreditCard className="w-8 h-8" />
              Smart Settlement
            </h1>
            <p className="text-gray-500">간편하게 정산 내역을 입력하고 관리하세요.</p>
          </div>
          
          {/* Tabs Navigation */}
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
                activeTab === 'input' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <PlusCircle size={18} />
              <span className="font-medium">입력</span>
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
                activeTab === 'view' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Search size={18} />
              <span className="font-medium">조회</span>
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
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 animate-in fade-in duration-300">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 border-b pb-4 text-gray-700">
                <PlusCircle className="text-indigo-500" />
                정산 내역 입력
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-600">일자 *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none border-gray-300"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-600">내용 *</label>
                  <input
                    type="text"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="예: 사무용품 구매"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none border-gray-300"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-600">적요</label>
                  <input
                    type="text"
                    name="brief"
                    value={formData.brief}
                    onChange={handleChange}
                    placeholder="핵심 요약 정보"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none border-gray-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-600">금액 *</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full p-3 pl-8 border rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none border-gray-300"
                      required
                    />
                    <span className="absolute left-3 top-3.5 text-gray-400">₩</span>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-gray-600">상세</label>
                  <textarea
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    placeholder="상세 내용을 입력하세요."
                    className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-indigo-200 outline-none border-gray-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-600">수령인 *</label>
                  <input
                    type="text"
                    name="recipient"
                    value={formData.recipient}
                    onChange={handleChange}
                    placeholder="이름"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none border-gray-300"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-600">정산현황</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none border-gray-300"
                    >
                      <option value="대기">대기</option>
                      <option value="진행중">진행중</option>
                      <option value="완료">완료</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-600">정산일자</label>
                    <input
                      type="date"
                      name="settlementDate"
                      value={formData.settlementDate}
                      onChange={handleChange}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none border-gray-300"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 pt-4">
                  <button
                    type="submit"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    데이터 저장하기
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: INQUIRY SCREEN */}
          {!isLoading && activeTab === 'view' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                    <ArrowUpDown size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">총 정산 건수</p>
                    <p className="text-2xl font-bold">{items.length} 건</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">총 정산 금액</p>
                    <p className="text-2xl font-bold">₩{items.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                    <PieChart size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">미정산(대기) 금액</p>
                    <p className="text-2xl font-bold">₩{items.filter(i => i.status !== '완료').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Detail Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <List className="w-5 h-5 text-indigo-500" />
                    상세 내역 목록 (날짜순)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b">
                      <tr>
                        <th className="px-6 py-4 font-semibold">일자</th>
                        <th className="px-6 py-4 font-semibold">내용</th>
                        <th className="px-6 py-4 font-semibold">적요</th>
                        <th className="px-6 py-4 font-semibold text-right">금액</th>
                        <th className="px-6 py-4 font-semibold text-center">수령인</th>
                        <th className="px-6 py-4 font-semibold text-center">현황 (클릭 시 변경)</th>
                        <th className="px-6 py-4 font-semibold">정산일자</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {sortedItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{item.date}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium">{item.content}</div>
                            <div className="text-xs text-gray-400">{item.details}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{item.brief}</td>
                          <td className="px-6 py-4 text-right font-bold text-indigo-600">₩{item.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-gray-600">
                              <User size={12} /> {item.recipient}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {/* 토글 버튼으로 변경 */}
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
                        </tr>
                      ))}
                      {sortedItems.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                            저장된 데이터가 없습니다. 먼저 내역을 입력해주세요.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Statistics Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Total */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-4 border-b bg-gray-50 rounded-t-2xl font-bold flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-500" /> 월별 합계
                  </div>
                  <div className="p-2">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b">
                          <th className="px-4 py-2 text-left">월 (Year-Month)</th>
                          <th className="px-4 py-2 text-right">합계 금액</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {monthlyTotals.map(([month, total]) => (
                          <tr key={month} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{month}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">₩{total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recipient Total */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-4 border-b bg-gray-50 rounded-t-2xl font-bold flex items-center gap-2">
                    <User size={18} className="text-indigo-500" /> 수령인별 합계
                  </div>
                  <div className="p-2">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b">
                          <th className="px-4 py-2 text-left">수령인</th>
                          <th className="px-4 py-2 text-right">합계 금액</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {recipientTotals.map(([name, total]) => (
                          <tr key={name} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium flex items-center gap-2">
                               <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-[10px] text-indigo-600 font-bold">
                                {name.substring(0,1)}
                               </div>
                               {name}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-indigo-600">₩{total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="mt-12 text-center text-gray-400 text-sm pb-8">
          &copy; 2024 Settlement Management System. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default App;
