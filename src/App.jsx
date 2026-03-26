import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ViewTab from './components/ViewTab';
import InputTab from './components/InputTab';
import BudgetTab from './components/BudgetTab';
import AdminLoginModal from './components/AdminLoginModal';

import { app, auth, db, appId } from './firebase/config';
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';

const App = () => {
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('view');
  const [editingItem, setEditingItem] = useState(null);

  const [budget, setBudget] = useState({
    교사운영비: 700000,
    학생교육비: 3140000,
    팀운영비: 300000,
    행사비: 4500000
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 1. 사용자 인증 처리
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    // 초기에는 익명 로그인으로 모두가 접근 가능하도록 함 (권한 없음 상태)
    const initAuth = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
           await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
        setIsLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // 로그인한 유저가 익명(isAnonymous)이 아니면 관리자로 취급
      setIsAdmin(currentUser && !currentUser.isAnonymous);
      if (!currentUser) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. 실시간 데이터 불러오기
  useEffect(() => {
    if (!user || !db) return;
    
    setIsLoading(true);
    const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'settlements');
    const unsubscribeItems = onSnapshot(itemsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Data Fetch Error:", error);
      setIsLoading(false);
    });

    const budgetRef = doc(db, 'artifacts', appId, 'public', 'data', 'budget', 'current');
    const unsubscribeBudget = onSnapshot(budgetRef, (snapshot) => {
      if (snapshot.exists()) {
        setBudget(snapshot.data());
      }
    }, (error) => console.error("Budget Fetch Error:", error));

    return () => {
      unsubscribeItems();
      unsubscribeBudget();
    };
  }, [user]);

  // Handle Create / Update
  const handleSaveItem = async (formData) => {
    if (!isAdmin) return; // 추가 보안 확인

    const itemData = {
      ...formData,
      amount: Number(formData.amount),
      updatedAt: new Date().toISOString()
    };

    if (editingItem && editingItem.id) {
      if (db) {
        const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'settlements', editingItem.id.toString());
        await updateDoc(itemRef, itemData);
      } else {
        setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...itemData } : i));
      }
      setEditingItem(null);
    } else {
      itemData.createdAt = new Date().toISOString();
      if (db) {
        const newId = Date.now().toString();
        const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'settlements', newId);
        await setDoc(itemRef, { ...itemData, id: newId });
      } else {
        setItems(prev => [...prev, { ...itemData, id: Date.now().toString() }]);
      }
    }
    setActiveTab('view');
  };

  const handleDeleteItem = async (id) => {
    if (!isAdmin) return;
    if (db) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settlements', id.toString()));
      } catch (error) {
        console.error("Delete error", error);
      }
    } else {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleToggleStatus = async (item) => {
    if (!isAdmin) return;
    const isCompleted = item.status === '완료';
    const newStatus = isCompleted ? '대기' : '완료';
    // 로컬 타임존 반영 오늘 날짜
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const newSettlementDate = isCompleted ? '' : today;
    
    const updatedItem = { 
      ...item, 
      status: newStatus,
      settlementDate: newSettlementDate
    };

    if (db) {
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

  const handleEditClick = (item) => {
    if (!isAdmin) return;
    setEditingItem(item);
    setActiveTab('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveBudget = async () => {
    if (!isAdmin) return;
    if (db) {
      try {
        const budgetRef = doc(db, 'artifacts', appId, 'public', 'data', 'budget', 'current');
        await setDoc(budgetRef, budget);
      } catch (error) {
        console.error("Budget save error:", error);
      }
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      await signInAnonymously(auth); // 로그아웃 후 다시 익명 모드로 돌아감
    }
    setIsAdmin(false);
    setActiveTab('view');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-8">
      <AdminLoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSuccess={() => {
          setIsLoginModalOpen(false);
          setIsAdmin(true);
        }}
      />
      
      <div className="max-w-6xl mx-auto">
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isAdmin={isAdmin}
          onLoginClick={() => setIsLoginModalOpen(true)}
          onLogoutClick={handleLogout}
        />

        <main>
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-indigo-600 font-medium">데이터를 불러오는 중...</span>
            </div>
          )}

          {!isLoading && activeTab === 'view' && (
            <ViewTab 
              items={items} 
              isAdmin={isAdmin} 
              onEditClick={handleEditClick} 
              onDelete={handleDeleteItem} 
              onToggleStatus={handleToggleStatus} 
            />
          )}

          {!isLoading && activeTab === 'input' && isAdmin && (
            <InputTab 
              editingItem={editingItem} 
              onSave={handleSaveItem} 
              onCancel={() => { setEditingItem(null); setActiveTab('view'); }} 
            />
          )}

          {!isLoading && activeTab === 'budget' && (
            <BudgetTab 
              budget={budget} 
              setBudget={setBudget} 
              items={items} 
              isAdmin={isAdmin} 
              handleSaveBudget={handleSaveBudget} 
            />
          )}
        </main>

        <footer className="mt-8 md:mt-12 text-center text-gray-400 text-xs md:text-sm pb-8">
          &copy; {new Date().getFullYear()} Smart Settlement & Budget System. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default App;
