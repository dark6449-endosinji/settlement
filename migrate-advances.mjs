import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            'AIzaSyAqKoRf7TA37FUEXI5UFpHBoVVfbxvrQNo',
  authDomain:        'my-settlement-app-6fdf0.firebaseapp.com',
  projectId:         'my-settlement-app-6fdf0',
  storageBucket:     'my-settlement-app-6fdf0.firebasestorage.app',
  messagingSenderId: '739203630953',
  appId:             '1:739203630953:web:1f0bcacbf8c1e896a45ff8',
};

const appId = 'my-settlement-app-6fdf0';

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── brief 없는 항목에 붙일 기본값 ──────────────────────────────
// 항목이 1개만 있고 "학생교육비"를 선택했다고 하셨으므로 기본 '학생교육비' 적용
// 복수 항목이 있을 경우 여기서 id → brief 맵을 직접 지정하세요.
const DEFAULT_BRIEF = '학생교육비';

async function migrate() {
  // 익명 로그인 (public read 권한)
  await signInAnonymously(auth);

  const ref = collection(db, 'artifacts', appId, 'public', 'data', 'advances');
  const snap = await getDocs(ref);

  const noBriefDocs = snap.docs.filter(d => !d.data().brief);

  if (noBriefDocs.length === 0) {
    console.log('✅ brief 누락 항목 없음. 마이그레이션 불필요.');
    process.exit(0);
  }

  console.log(`\n📋 brief 누락 전도금 항목 ${noBriefDocs.length}건 발견:\n`);
  noBriefDocs.forEach(d => {
    const data = d.data();
    console.log(`  id: ${d.id}  |  날짜: ${data.date}  |  금액: ₩${Number(data.amount).toLocaleString()}`);
  });

  console.log(`\n🔄 모든 항목에 적요 "${DEFAULT_BRIEF}" 적용 중...\n`);

  for (const d of noBriefDocs) {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'advances', d.id);
    await updateDoc(docRef, { brief: DEFAULT_BRIEF });
    console.log(`  ✔ ${d.id} → brief: "${DEFAULT_BRIEF}" 업데이트 완료`);
  }

  console.log('\n🎉 마이그레이션 완료!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
