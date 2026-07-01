/**
 * 시드니 건축 답사 지도 & 동선 최적화 플래너 - app.js
 * 
 * 핵심 로직:
 * 1. 일자별/테마별 코스 데이터 (Day 1 ~ Day 5 확장)
 * 2. 전체 일정(all) 탭에 Day 4, Day 5 데이터를 포함하여 리스트 및 맵 렌더링
 * 3. 타입별 마커 커스터마이징 (archi는 순서숫자, food는 'F', other는 'O')
 * 4. 지리적 거리에 기반한 최적의 이동 동선 자동 재정렬 알고리즘 (Nearest Neighbor TSP)
 * 5. Nominatim API를 연동한 실시간 장소 검색 및 위치 좌표 변환
 * 6. html2canvas 고화질 지도 캡처 내보내기
 */

// --- 1. 코스별 가변형 데이터 정의 ---
const routesData = {
    // [일자별 답사 루트]
    day1: {
        title: "Day 1 — 항구의 상징과 CBD 공공성",
        desc: "Circular Quay에서 시작하여 더 록스의 인프라를 거쳐 CBD의 핵심 모더니즘 건축을 탐방하고 QVB 유산보존으로 마무리하는 도보 코스입니다.",
        color: "#2563eb", // Deep Blue
        spots: [
            { id: 101, type: "archi", time: "09:00", name: "Circular Quay 역·페리터미널", lat: -33.8615, lng: 151.2108, desc: "답사의 시작점이자 항만 교통망의 핵심 공공 공간", phone: "" },
            { id: 102, type: "archi", time: "09:15", name: "Sydney Opera House (시드니 오페라 하우스)", lat: -33.8568, lng: 151.2153, desc: "요른 웃손 설계. 20세기 유기적 조형미와 거대한 콘크리트 기단의 결합", phone: "" },
            { id: 103, type: "archi", time: "10:30", name: "MCA Australia (시드니 현대미술관)", lat: -33.8599, lng: 151.2090, desc: "기존 아르데코 유산 건물과 모던 윙의 극적인 결합 양식 감상", phone: "" },
            { id: 104, type: "archi", time: "11:30", name: "Sirius Building (시리우스 빌딩)", lat: -33.8594, lng: 151.2075, desc: "브루탈리즘 사회주택에서 고급 주거로 전환된 화제의 재생 건축", phone: "" },
            { id: 105, type: "archi", time: "12:00", name: "Sydney Harbour Bridge / The Rocks", lat: -33.8548, lng: 151.2070, desc: "더 록스의 역사적 골목길과 역사적인 철강 아치 교량 구조 관찰", phone: "" },
            { id: 106, type: "archi", time: "14:00", name: "Australia Square (오스트레일리아 스퀘어)", lat: -33.8643, lng: 151.2079, desc: "해리 시들러 설계. 오픈 플라자를 확보한 상징적인 원형 모더니즘 마천루", phone: "" },
            { id: 107, type: "archi", time: "14:40", name: "1 Bligh Street", lat: -33.8637, lng: 151.2109, desc: "곡선형 유리 타워와 세계 최초 더블스킨 유리 커튼월, 거대한 친환경 아뜨리움", phone: "" },
            { id: 108, type: "archi", time: "15:30", name: "25 Martin Place (구 MLC 센터)", lat: -33.8679, lng: 151.2092, desc: "해리 시들러의 노출 콘크리트 보 및 혁신적인 구조주의 미학을 가진 고층 오피스", phone: "" },
            { id: 109, type: "archi", time: "16:15", name: "8 Chifley Square", lat: -33.8665, lng: 151.2106, desc: "RSHP 설계. 역동적인 대각선 가새(Bracing) 노출 구조와 지상 오픈 필로티 공간", phone: "" },
            { id: 110, type: "archi", time: "17:00", name: "QVB & Sydney Town Hall", lat: -33.8719, lng: 151.2067, desc: "빅토리아 조 로마네스크 부활 양식 건물을 상업 쇼핑몰로 내부 재생한 대표 사례", phone: "" }
        ]
    },
    day2: {
        title: "Day 2 — 수변 재생과 Chippendale 산업유산 전환",
        desc: "윈야드 워크 지하보행로를 거쳐 바랑가루 수변 재생지구와 컨벤션 타운을 본 뒤, 치펀데일(Chippendale)의 매력적인 골목길 공공 공간을 탐사합니다.",
        color: "#16a34a", // Emerald Green
        spots: [
            { id: 201, type: "archi", time: "09:30", name: "Wynyard 역 (출발)", lat: -33.8657, lng: 151.2057, desc: "지하철 환승센터에서 수변 연결부로 이동", phone: "" },
            { id: 202, type: "archi", time: "09:40", name: "Wynyard Walk (윈야드 워크)", lat: -33.8655, lng: 151.2039, desc: "부드러운 곡선의 보행 선형 터널 인프라 답사", phone: "" },
            { id: 203, type: "archi", time: "10:00", name: "International Towers Sydney", lat: -33.8639, lng: 151.2014, desc: "RSHP 설계. 바랑가루 남측 금융지구의 거대한 친환경 오피스 복합체", phone: "" },
            { id: 204, type: "archi", time: "11:00", name: "Barangaroo 수변 보행축 / Reserve", lat: -33.8564, lng: 151.2014, desc: "부두 지형을 친환경 생태공원으로 완벽하게 지형 복원한 성공적 공공 공간", phone: "" },
            { id: 205, type: "archi", time: "13:30", name: "ICC Sydney (국제 컨벤션 센터)", lat: -33.8760, lng: 151.2007, desc: "달링하버의 중심 이벤트 시설. 유리와 금속 입면의 투명한 공공성", phone: "" },
            { id: 206, type: "archi", time: "14:40", name: "The Exchange, Darling Square", lat: -33.8778, lng: 151.2023, desc: "켄고 쿠마 설계. 둥근 도서관 건물을 나선형 목재 루버로 감싸 유기적 온기를 연출", phone: "" },
            { id: 207, type: "archi", time: "15:30", name: "One Central Park", lat: -33.8840, lng: 151.2018, desc: "장 누벨 설계. 수직 정원 파사드와 캔틸레버식 거대 헬리오스탯(태양 반사판)", phone: "" },
            { id: 208, type: "archi", time: "16:40", name: "White Rabbit Gallery (화이트 래빗)", lat: -33.8860, lng: 151.2008, desc: "Chippendale의 대표적인 벽돌 맥주공장 창고를 리노베이션한 현대미술관", phone: "" },
            { id: 209, type: "archi", time: "17:30", name: "Phoenix Central Park", lat: -33.8864, lng: 151.2021, desc: "조각 같은 노출콘크리트 공연 및 미술 공간", phone: "" }
        ]
    },
    day3: {
        title: "Day 3 — 캠퍼스 건축과 하이드 파크 시민 공간",
        desc: "UTS의 세계적인 해체주의 캠퍼스 건축물들을 살펴본 후, 하이드 파크 주위의 공공 박물관과 세인트 메리 성당의 고전 유산을 연결하는 역사-문화 코스입니다.",
        color: "#ea580c", // Orange
        spots: [
            { id: 301, type: "archi", time: "09:30", name: "Central 역 (출발)", lat: -33.8824, lng: 151.2060, desc: "시드니 교통 허브이자 유산 보존 기차역에서 답사 출발", phone: "" },
            { id: 302, type: "archi", time: "09:45", name: "UTS Dr Chau Chak Wing Building", lat: -33.8837, lng: 151.2004, desc: "프랭크 게리 설계. 구겨진 종이봉투를 닮은 벽돌 파사드의 해체주의 교육 공간", phone: "" },
            { id: 303, type: "archi", time: "10:30", name: "UTS Central", lat: -33.8841, lng: 151.2008, desc: "곡면 유리 파사드가 돋보이는 대형 아카데믹 허브 및 독서 광장", phone: "" },
            { id: 304, type: "archi", time: "11:20", name: "Ian Thorpe Aquatic Centre", lat: -33.8797, lng: 151.1979, desc: "해리 시들러 설계. 시드니 하버의 파도를 모티브로 유선형 천장 단면을 가진 수영장", phone: "" },
            { id: 305, type: "archi", time: "12:00", name: "Powerhouse Museum Ultimo", lat: -33.8792, lng: 151.1997, desc: "기존 발전소 유산 건물을 개조한 산업 박물관", phone: "" },
            { id: 306, type: "archi", time: "12:30", name: "The Goods Line (더 굿즈 라인)", lat: -33.8814, lng: 151.2005, desc: "과거 철도 선형 인프라를 뉴욕 하이라인 스타일의 고가 보행자 선형 공원으로 전환", phone: "" },
            { id: 307, type: "archi", time: "14:00", name: "AGNSW Sydney Modern (신관)", lat: -33.8687, lng: 151.2173, desc: "SANAA 설계. 오페라 하우스 이후 최대의 공공 미술 전시관, 가벼운 구조와 열린 시야", phone: "" },
            { id: 308, type: "archi", time: "15:00", name: "St Mary's Cathedral", lat: -33.8712, lng: 151.2131, desc: "19세기 네오 고딕 양식으로 지어진 성당과 하이드파크의 시각적 경관 관계 감상", phone: "" },
            { id: 309, type: "archi", time: "15:40", name: "Australian Museum (오스트레일리아 박물관)", lat: -33.8742, lng: 151.2131, desc: "석조 박물관 건물을 투명한 유리 로비로 조화롭게 확장", phone: "" },
            { id: 310, type: "archi", time: "16:20", name: "Anzac Memorial (안작 기념관)", lat: -33.8756, lng: 151.2114, desc: "하이드파크 남단을 축으로 설계된 대칭형 아르데코 양식 전쟁 기념탑 건축", phone: "" },
            { id: 311, type: "archi", time: "17:00", name: "Paramount House (서리 힐즈)", lat: -33.8794, lng: 151.2117, desc: "영화 배급사 창고 유산 벽돌 위에 정교한 다공성 금속판 증축을 이룬 복합 크리에이티브 공간", phone: "" }
        ]
    },
    day4: {
        title: "Day 4 — 본다이 해안 공공건축과 해양 휴양 코스",
        desc: "시드니의 대표적인 외곽 해안 지역으로 이동하여 태평양을 마주하는 본다이 파빌리온 및 본다이 비치 해안 절벽 산책로 인프라를 탐방합니다.",
        color: "#8b5cf6", // Purple
        spots: [
            { id: 401, type: "archi", time: "09:30", name: "Bondi Beach (본다이 비치)", lat: -33.8915, lng: 151.2767, desc: "세계적으로 유명한 해변이자 휴양 보행로 답사 시작점", phone: "" },
            { id: 402, type: "archi", time: "10:30", name: "Bondi Pavilion (본다이 파빌리온)", lat: -33.8906, lng: 151.2755, desc: "최근 친환경 문화센터 및 공공 커뮤니티홀로 섬세하게 리노베이션 완료된 역사적 스폿", phone: "" },
            { id: 403, type: "archi", time: "12:00", name: "Bondi Icebergs Pool (아이스버그 풀)", lat: -33.8948, lng: 151.2747, desc: "파도가 치는 바다 옆에 바로 결합된 대표적인 야외 해수 풀장의 극적 풍경 관찰", phone: "" },
            { id: 404, type: "other", time: "14:00", name: "Watsons Bay (왓슨스 베이)", lat: -33.8427, lng: 151.2829, desc: "선택 외곽 코스로 갭 팍의 웅장한 해안 절벽 경관 인프라 탐방", phone: "" }
        ]
    },
    day5: {
        title: "Day 5 — 자유 및 외곽 추가 답사 일정",
        desc: "사용자가 자유롭게 답사 일정을 추가하여 최적화 동선을 직접 빌드할 수 있는 맞춤형 스케줄 영역입니다.",
        color: "#14b8a6", // Teal
        spots: [
            { id: 501, type: "archi", time: "09:30", name: "Sydney Fish Market (시드니 피쉬 마켓)", lat: -33.8732, lng: 151.1925, desc: "새로운 대규모 수변 재생 디자인 프로젝트가 진행 예정인 시드니 대표 수변 시장", phone: "" }
        ]
    },
    // [테마별 기획 루트]
    seidler: {
        title: "테마 코스 — 해리 시들러(Harry Seidler) 집중 코스",
        desc: "호주 모더니즘 건축의 선구자 해리 시들러의 주요 랜드마크를 따라가며 구조와 조형의 완전성을 확인합니다.",
        color: "#9333ea",
        spots: [
            { id: 701, type: "archi", time: "1", name: "Australia Square Plaza", lat: -33.8643, lng: 151.2079, desc: "경이로운 원형 마천루 오피스 구조와 조각적인 외부 마당 광장", phone: "" },
            { id: 702, type: "archi", time: "2", name: "25 Martin Place (MLC Center)", lat: -33.8679, lng: 151.2092, desc: "기둥이 없는 격자 보 노출로 구현한 콘크리트 마천루 엔지니어링 미학", phone: "" },
            { id: 703, type: "archi", time: "3", name: "Ian Thorpe Aquatic Centre", lat: -33.8797, lng: 151.1979, desc: "기둥 하나 없이 기하학적으로 휘어진 목재 트러스 구조의 실내 파도 천장", phone: "" },
            { id: 704, type: "archi", time: "4", name: "Rose Seidler House (선택 외곽)", lat: -33.7221, lng: 151.1234, desc: "시드니 북부 Wahroonga 소재. 바우하우스 가치를 호주 기후에 맞게 녹여낸 역사적 시들러 주택", phone: "" }
        ]
    },
    waterfront: {
        title: "테마 코스 — 시드니 서부 수변 재생 연속 코스",
        desc: "상업적 항구에서 생태 및 여가, 비즈니스 중심의 고밀도 도시 수변 보행지로 탈바꿈한 대표적인 전환 사례 동선입니다.",
        color: "#0891b2",
        spots: [
            { id: 801, type: "archi", time: "1", name: "Barangaroo Reserve (북단)", lat: -33.8564, lng: 151.2014, desc: "평평한 부두 터를 유기적 호주 자연 지형 해안선으로 완벽하게 복원한 공원", phone: "" },
            { id: 802, type: "archi", time: "2", name: "Barangaroo South", lat: -33.8617, lng: 151.2008, desc: "글로벌 상업 마천루와 바랑가루 산책로를 연결하는 보행 가로 활성화 기법", phone: "" },
            { id: 803, type: "archi", time: "3", name: "ICC Sydney (Darling Harbour)", lat: -33.8760, lng: 151.2007, desc: "달링하버에 공공 열린 가로망과 대형 컨벤션 시설을 통합 매핑", phone: "" },
            { id: 804, type: "archi", time: "4", name: "The Goods Line", lat: -33.8814, lng: 151.2005, desc: "철도 인프라의 흔적을 담은 콘크리트 패턴과 조경으로 대학가-수변을 잇는 보행 활성화 유도", phone: "" }
        ]
    },
    architects: {
        title: "테마 코스 — 세계적 거장(Starchitect)의 시드니 경쟁",
        desc: "프리츠커상 수상자들을 비롯한 글로벌 대표 건축가들의 명작들을 비교 분석하는 시드니 하이라이트 코스입니다.",
        color: "#e11d48",
        spots: [
            { id: 901, type: "archi", time: "1", name: "Sydney Opera House - Jørn Utzon", lat: -33.8568, lng: 151.2153, desc: "20세기 세계에서 가장 위대한 표현주의 조형 쉘 구조물", phone: "" },
            { id: 902, type: "archi", time: "2", name: "International Towers - RSHP", lat: -33.8639, lng: 151.2014, desc: "리처드 로저스의 핵심 설계 특징인 원색 계열 서비스 샤프트 노출과 고밀도 오피스 평면", phone: "" },
            { id: 903, type: "archi", time: "3", name: "8 Chifley Square - RSHP", lat: -33.8665, lng: 151.2106, desc: "기둥 없는 지상 6층 높이 공공 광장을 개방하고 노출 철골 프레임으로 띄운 타워", phone: "" },
            { id: 904, type: "archi", time: "4", name: "One Central Park - Jean Nouvel", lat: -33.8840, lng: 151.2018, desc: "장 누벨의 수직 조경 파사드와 구조물 하부에 반사광을 쏘아주는 특수 헬리오스탯 외팔보", phone: "" },
            { id: 905, type: "archi", time: "5", name: "The Exchange - Kengo Kuma", lat: -33.8778, lng: 151.2023, desc: "켄고 쿠마의 시그니처 목재 루버 스킨을 나선형으로 둘러 쌓아 만든 따뜻한 커뮤니티 빌딩", phone: "" },
            { id: 606, type: "archi", time: "6", name: "UTS Dr Chau Chak Wing - Frank Gehry", lat: -33.8837, lng: 151.2004, desc: "프랭크 게리의 트레이드 마크인 불규칙 3D 굴곡 입면을 32만 장의 수제 점토 벽돌로 완성", phone: "" },
            { id: 907, type: "archi", time: "7", name: "AGNSW Sydney Modern - SANAA", lat: -33.8687, lng: 151.2173, desc: "공원 구릉지의 지형을 따라 내려가는 3개의 직사각형 얇은 판이 이루는 경량 공공 갤러리", phone: "" }
        ]
    }
};

// --- 2. Leaflet.js 지도 생성 및 초기화 ---
const map = L.map('map', {
    center: [-33.8688, 151.2093],
    zoom: 14,
    zoomControl: false
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    crossOrigin: true
}).addTo(map);

L.control.zoom({
    position: 'bottomleft'
}).addTo(map);

const markerGroup = L.layerGroup().addTo(map);
const pathGroup = L.layerGroup().addTo(map);

let activeRouteKey = 'all'; 
let activePlaceType = 'archi'; 

const students = {
    chanyoung: { name: "찬영", routeKey: "student-chanyoung", color: "#f59e0b" },
    junhee: { name: "준희", routeKey: "student-junhee", color: "#3b82f6" },
    jin: { name: "진", routeKey: "student-jin", color: "#8b5cf6" },
    sungwon: { name: "성원", routeKey: "student-sungwon", color: "#10b981" },
    hyunwoo: { name: "현우", routeKey: "student-hyunwoo", color: "#ef4444" },
};

const collaborationApi = window.SydneyCollaboration;
const collaborationStoreKey = "sydney-archi-walk-collaboration-v1";
let collaborationState = collaborationApi.hydrateState(localStorage.getItem(collaborationStoreKey));
const firebaseCollaborationSync = window.SydneyFirebaseSync
    ? window.SydneyFirebaseSync.createFirebaseCollaborationSync()
    : null;
const sharedDayKeys = ['day1', 'day2', 'day3', 'day4', 'day5'];
const baseDaySpots = sharedDayKeys.reduce((days, dayKey) => {
    days[dayKey] = routesData[dayKey].spots.map((spot) => ({ ...spot }));
    return days;
}, {});

function saveCollaborationState() {
    localStorage.setItem(collaborationStoreKey, collaborationApi.serializeState(collaborationState));
    if (firebaseCollaborationSync) {
        firebaseCollaborationSync.save(collaborationState).catch((error) => {
            console.warn("Firebase collaboration save failed. Local backup was kept.", error);
        });
    }
}

function applyCustomDaySpots() {
    sharedDayKeys.forEach((dayKey) => {
        routesData[dayKey].spots = [
            ...baseDaySpots[dayKey].map((spot) => ({ ...spot })),
            ...collaborationApi.getDaySpots(collaborationState, dayKey),
        ];
    });
}

function getStudentIdFromRoute(routeKey) {
    return Object.keys(students).find((id) => students[id].routeKey === routeKey) || null;
}

function isStudentRoute(routeKey) {
    return Boolean(getStudentIdFromRoute(routeKey));
}

function getSelectedPlanDay() {
    return document.getElementById('place-day')?.value || 'day1';
}

function syncCollaborationRoutes() {
    applyCustomDaySpots();
    const selectedDay = getSelectedPlanDay();

    Object.entries(students).forEach(([studentId, student]) => {
        const baseSpots = routesData[selectedDay].spots.map((spot) => ({
            ...spot,
            originDay: selectedDay.toUpperCase(),
            dayColor: routesData[selectedDay].color,
        }));
        const candidateSpots = collaborationApi.getCandidatesForStudent(collaborationState, studentId, selectedDay).map((spot) => ({
            ...spot,
            isCandidate: true,
            originDay: `${student.name} 후보`,
            dayColor: student.color,
        }));

        routesData[student.routeKey] = {
            title: `${student.name} 후보 일정`,
            desc: `${student.name} 학생이 ${selectedDay.toUpperCase()}에 제안한 후보지를 기존 일정과 함께 확인합니다.`,
            color: student.color,
            spots: [...baseSpots, ...candidateSpots],
            collaborationMode: "student",
        };
    });

    const baseFinalSpots = ['day1', 'day2', 'day3', 'day4', 'day5'].flatMap((dayKey) => {
        return routesData[dayKey].spots.map((spot) => ({
            ...spot,
            originDay: dayKey.toUpperCase(),
            dayColor: routesData[dayKey].color,
        }));
    });
    const finalCandidateSpots = collaborationApi.getFinalCandidates(collaborationState).map((spot) => ({
        ...spot,
        isFinalAdded: true,
        originDay: `${students[spot.owner].name} 확정`,
        dayColor: "#10b981",
    }));

    routesData.final = {
        title: "최종 답사지",
        desc: "기존 답사 일정에 회의에서 선택한 학생 후보지를 합친 최종 이동용 목록입니다.",
        color: "#111827",
        spots: [...baseFinalSpots, ...finalCandidateSpots],
        collaborationMode: "final",
    };
}

function updateCollaborationFormState() {
    const studentId = getStudentIdFromRoute(activeRouteKey);
    const row = document.getElementById('student-context-row');
    if (!row) return;
    row.classList.toggle('hidden', !studentId);
    if (studentId) {
        document.getElementById('candidate-owner').value = studentId;
    }
}

// --- 3. 최적의 동선 정렬 알고리즘 (Nearest Neighbor TSP) ---
function optimizeRoute() {
    if (activeRouteKey === 'all') {
        alert("최적화는 일자별(Day 1 ~ Day 5)을 개별 선택한 후 진행해 주세요.");
        return;
    }

    const route = routesData[activeRouteKey];
    if (!route || route.spots.length <= 2) {
        alert("최적화를 진행하려면 최소 3개 이상의 장소가 필요합니다.");
        return;
    }

    const spots = [...route.spots];
    const optimized = [];
    
    const startNode = spots.shift();
    optimized.push(startNode);

    let currentNode = startNode;

    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    while (spots.length > 0) {
        let minDistance = Infinity;
        let nearestIndex = -1;

        for (let i = 0; i < spots.length; i++) {
            const dist = getDistance(currentNode.lat, currentNode.lng, spots[i].lat, spots[i].lng);
            if (dist < minDistance) {
                minDistance = dist;
                nearestIndex = i;
            }
        }

        const nextNode = spots.splice(nearestIndex, 1)[0];
        optimized.push(nextNode);
        currentNode = nextNode;
    }

    optimized.forEach((spot, index) => {
        spot.time = `순서 ${index + 1}`;
    });

    routesData[activeRouteKey].spots = optimized;
    updateRouteView(activeRouteKey);
}

// --- 4. 코스 렌더링 함수 ---
function updateRouteView(routeKey) {
    syncCollaborationRoutes();
    activeRouteKey = routeKey;

    let targetSpots = [];
    let titleText = "";
    let descText = "";
    let themeColor = "#2563eb";

    if (routeKey === 'all') {
        titleText = "전체 일정 목록";
        descText = "5일 동안 시드니 전역에서 탐방할 건축 명소 및 식당/카페의 모든 리스트입니다.";
        themeColor = "#475569";
        
        // Day 1 ~ Day 5의 모든 스팟 합치기
        targetSpots = [
            ...routesData.day1.spots.map(s => ({...s, originDay: 'Day 1', dayColor: routesData.day1.color})),
            ...routesData.day2.spots.map(s => ({...s, originDay: 'Day 2', dayColor: routesData.day2.color})),
            ...routesData.day3.spots.map(s => ({...s, originDay: 'Day 3', dayColor: routesData.day3.color})),
            ...routesData.day4.spots.map(s => ({...s, originDay: 'Day 4', dayColor: routesData.day4.color})),
            ...routesData.day5.spots.map(s => ({...s, originDay: 'Day 5', dayColor: routesData.day5.color}))
        ];

        document.getElementById('btn-optimize').style.opacity = "0.5";
        document.getElementById('btn-optimize').title = "최적화는 각 일차별 페이지에서 구동 가능합니다.";
    } else {
        const route = routesData[routeKey];
        if (!route) return;
        titleText = route.title;
        descText = route.desc;
        themeColor = route.color;
        targetSpots = route.spots.map(s => ({...s, originDay: s.originDay || routeKey.toUpperCase(), dayColor: s.dayColor || route.color}));
        
        document.getElementById('btn-optimize').style.opacity = "1";
        document.getElementById('btn-optimize').title = "지리적 거리를 계산하여 최적의 동선 순서로 자동 배치합니다.";
    }

    // 1. 텍스트 세팅
    document.getElementById('intro-title').innerText = titleText;
    document.getElementById('intro-desc').innerText = descText;
    document.getElementById('route-count').innerText = `${targetSpots.length}개 스팟`;
    document.getElementById('map-title-display').innerText = titleText;
    document.getElementById('map-subtitle-display').innerText = descText;

    const customPlaceCard = document.getElementById('custom-place-card');
    if (routeKey === 'all' || routeKey.startsWith('day') || isStudentRoute(routeKey)) {
        customPlaceCard.classList.remove('hidden');
    } else {
        customPlaceCard.classList.add('hidden');
    }
    updateCollaborationFormState();

    // 2. 사이드바 리스트 렌더링
    const listContainer = document.getElementById('itinerary-list');
    listContainer.innerHTML = '';

    targetSpots.forEach((spot, idx) => {
        const stepNum = idx + 1;
        
        let nodeClass = "step-num-node";
        let nodeText = stepNum;
        let timeColor = spot.dayColor || themeColor;
        let placeDetail = spot.desc;
        let originBadge = `<span style="font-size: 8px; background:${timeColor}; color: white; padding:1px 4px; border-radius:3px; margin-left:6px;">${spot.originDay}</span>`;
        let candidateBadge = spot.isCandidate || spot.isFinalAdded ? `<span class="candidate-meta">${spot.originDay}</span>` : "";

        if (spot.type === "food") {
            nodeClass += " food-badge";
            nodeText = "F";
            timeColor = "#f43f5e";
            placeDetail = `📞 전화: ${spot.phone || '정보 없음'} | 주소: ${spot.desc || '주소 미제공'}`;
        } else if (spot.type === "other") {
            nodeClass += " other-badge";
            nodeText = "O";
            timeColor = "#64748b";
        }

        const itemEl = document.createElement('div');
        const deleteButton = spot.isCandidate || spot.isFinalAdded ? "" : `
                        <button class="btn-delete-step" data-id="${spot.id}" data-origin="${spot.originDay ? spot.originDay.toLowerCase().replace(' ', '') : ''}" title="삭제">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
        `;
        itemEl.className = `route-step-item${spot.isCandidate ? ' candidate-item' : ''}${spot.isFinalAdded ? ' final-added-item' : ''}`;
        itemEl.innerHTML = `
            <div class="${nodeClass}">${nodeText}</div>
            <div class="step-body-card">
                <span class="step-time-badge" style="background-color: ${timeColor}15; color: ${timeColor};">${spot.time || `순서 ${stepNum}`}</span>
                ${spot.isCandidate || spot.isFinalAdded ? "" : originBadge}
                ${candidateBadge}
                <div class="step-place-name">
                    <span>${spot.name}</span>
                    <div style="display:flex; align-items:center;">
                        <i class="fa-solid fa-chevron-right" style="margin-right: 8px;"></i>
                        ${deleteButton}
                    </div>
                </div>
                <p class="step-desc">${placeDetail}</p>
            </div>
        `;

        const deleteStepButton = itemEl.querySelector('.btn-delete-step');
        if (deleteStepButton) {
            deleteStepButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`"${spot.name}" 장소를 일정에서 제거하시겠습니까?`)) {
                    const targetDay = e.currentTarget.dataset.origin;
                    if (routesData[targetDay]) {
                        const isSharedCustomSpot = collaborationApi
                            .getDaySpots(collaborationState, targetDay)
                            .some((sharedSpot) => String(sharedSpot.id) === String(spot.id));
                        if (isSharedCustomSpot) {
                            collaborationState = collaborationApi.removeDaySpot(collaborationState, targetDay, spot.id);
                            saveCollaborationState();
                        }
                        routesData[targetDay].spots = routesData[targetDay].spots.filter(s => s.id !== spot.id);
                    }
                    updateRouteView(routeKey);
                }
            });
        }

        itemEl.querySelector('.step-body-card').addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-step')) return;
            map.setView([spot.lat, spot.lng], 16);
            markerGroup.eachLayer(layer => {
                if (layer.options.spotId === spot.id) {
                    layer.openPopup();
                }
            });
        });

        listContainer.appendChild(itemEl);
    });

    if (routeKey === 'final') {
        const selected = new Set(collaborationState.finalIds);
        const pendingCandidates = collaborationState.candidates.filter((candidate) => !selected.has(String(candidate.id)));
        const reviewPanel = document.createElement('div');
        reviewPanel.className = 'candidate-review-panel';
        reviewPanel.innerHTML = `
            <h4><i class="fa-solid fa-check-double"></i> 회의 후 최종 답사지에 넣을 후보 선택</h4>
            ${pendingCandidates.length === 0 ? '<p class="step-desc">아직 선택 가능한 학생 후보가 없습니다.</p>' : pendingCandidates.map((candidate) => `
                <label class="candidate-select-row">
                    <input type="checkbox" class="candidate-final-checkbox" value="${candidate.id}">
                    <span>${students[candidate.owner].name} 후보 · ${candidate.day.toUpperCase()} · ${candidate.name}</span>
                </label>
            `).join('')}
            <div class="final-actions">
                <button id="btn-add-selected-final" class="btn-primary" type="button">
                    <i class="fa-solid fa-check"></i> 선택 후보를 최종 답사지에 추가
                </button>
            </div>
        `;
        listContainer.appendChild(reviewPanel);

        const finalButton = document.getElementById('btn-add-selected-final');
        if (finalButton) {
            finalButton.disabled = pendingCandidates.length === 0;
            finalButton.addEventListener('click', () => {
                const selectedIds = Array.from(document.querySelectorAll('.candidate-final-checkbox:checked')).map((input) => input.value);
                if (selectedIds.length === 0) {
                    alert("최종 답사지에 추가할 후보를 선택해주세요.");
                    return;
                }
                collaborationState = collaborationApi.addFinalCandidates(collaborationState, selectedIds);
                saveCollaborationState();
                updateRouteView('final');
            });
        }
    }

    // 3. 지도 리렌더링
    markerGroup.clearLayers();
    pathGroup.clearLayers();

    const bounds = [];

    if (routeKey === 'all') {
        const days = ['day1', 'day2', 'day3', 'day4', 'day5'];
        
        days.forEach(dKey => {
            const dRoute = routesData[dKey];
            const dCoords = [];

            dRoute.spots.forEach((spot, idx) => {
                bounds.push([spot.lat, spot.lng]);
                dCoords.push([spot.lat, spot.lng]);

                let pinColor = dRoute.color;
                let badgeChar = idx + 1;
                let popupType = "건축 답사지";

                if (spot.type === "food") { pinColor = "#f43f5e"; badgeChar = "F"; popupType = "식당/카페"; }
                else if (spot.type === "other") { pinColor = "#64748b"; badgeChar = "O"; popupType = "기타 장소"; }

                const customIcon = L.divIcon({
                    className: 'custom-flag-marker',
                    html: `<div class="flag-pin" style="--pin-color: ${pinColor}">${badgeChar}</div>`,
                    iconSize: [26, 26],
                    iconAnchor: [13, 26],
                    popupAnchor: [0, -28]
                });

                const marker = L.marker([spot.lat, spot.lng], { 
                    icon: customIcon,
                    spotId: spot.id
                }).bindPopup(`
                    <div style="font-family: 'Noto Sans KR', sans-serif; min-width: 160px;">
                        <strong style="color: ${dRoute.color}; font-size:10px;">[${dKey.toUpperCase()} - ${popupType}]</strong>
                        <div style="font-weight:700; margin-top:3px; font-size:12px;">${spot.name}</div>
                        <div style="font-size:10px; color:#475569; margin-top:2px;">${spot.desc}</div>
                    </div>
                `);
                markerGroup.addLayer(marker);
            });

            if (dCoords.length > 1) {
                L.polyline(dCoords, {
                    color: dRoute.color,
                    weight: 3.5,
                    opacity: 0.7,
                    dashArray: '5, 8'
                }).addTo(pathGroup);
            }
        });

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [60, 60] });
        }
    } else {
        const dCoords = [];
        targetSpots.forEach((spot, idx) => {
            bounds.push([spot.lat, spot.lng]);
            dCoords.push([spot.lat, spot.lng]);

            let pinColor = spot.dayColor || themeColor;
            let badgeChar = idx + 1;
            let popupType = "건축 답사지";

            if (spot.type === "food") { badgeChar = "F"; popupType = "식당/카페"; if (!spot.isCandidate && !spot.isFinalAdded) pinColor = "#f43f5e"; }
            else if (spot.type === "other") { badgeChar = "O"; popupType = "기타 장소"; if (!spot.isCandidate && !spot.isFinalAdded) pinColor = "#64748b"; }
            if (spot.isCandidate) popupType = `${popupType} 후보`;
            if (spot.isFinalAdded) popupType = `${popupType} 확정`;

            const customIcon = L.divIcon({
                className: 'custom-flag-marker',
                html: `<div class="flag-pin" style="--pin-color: ${pinColor}">${badgeChar}</div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -30]
            });

            const marker = L.marker([spot.lat, spot.lng], { 
                icon: customIcon,
                spotId: spot.id
            }).bindPopup(`
                <div style="font-family: 'Noto Sans KR', sans-serif; min-width: 170px;">
                    <strong style="color: ${themeColor}; font-size:10px;">[${popupType} - 순서 ${idx + 1}]</strong>
                    <div style="font-weight:700; margin-top:3px; font-size:13px;">${spot.name}</div>
                    <div style="font-size:10px; color:#475569; margin-top:2px;">${spot.desc}</div>
                </div>
            `);
            markerGroup.addLayer(marker);
        });

        if (dCoords.length > 1) {
            L.polyline(dCoords, {
                color: themeColor,
                weight: 3.5,
                opacity: 0.8,
                dashArray: '6, 8'
            }).addTo(pathGroup);
        }

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [70, 70] });
        }
    }
}

// --- 5. 폼 제어 및 검색 추가 이벤트 ---

document.querySelectorAll('.type-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        activePlaceType = e.target.dataset.type;

        document.querySelectorAll('.type-fields').forEach(f => f.classList.add('hidden'));
        document.getElementById(`fields-${activePlaceType}`).classList.remove('hidden');
    });
});

document.getElementById('dynamic-add-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedDay = document.getElementById('place-day').value;
    let name = "";
    let address = "";
    let extraInfo = "";

    if (activePlaceType === 'archi') {
        name = document.getElementById('archi-name').value.trim();
        address = document.getElementById('archi-address').value.trim();
        extraInfo = document.getElementById('archi-desc').value.trim() || "상세 특징 없음";
    } else if (activePlaceType === 'food') {
        name = document.getElementById('food-name').value.trim();
        address = document.getElementById('food-address').value.trim();
        extraInfo = document.getElementById('food-phone').value.trim();
    } else if (activePlaceType === 'other') {
        name = document.getElementById('other-name').value.trim();
        address = document.getElementById('other-address').value.trim();
        extraInfo = document.getElementById('other-desc').value.trim() || "기타 정보";
    }

    if (!name) {
        alert("장소 또는 식당/카페의 이름을 입력해 주세요.");
        return;
    }

    const searchQuery = address ? `${address}, Sydney` : `${name}, Sydney, Australia`;
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;

    const submitBtn = document.getElementById('btn-add-place');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> 위치 좌표 탐색 중...`;

    try {
        const response = await fetch(searchUrl, {
            headers: { 'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7' }
        });
        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);

            const newSpot = {
                id: Date.now(),
                owner: getStudentIdFromRoute(activeRouteKey) || document.getElementById('candidate-owner').value,
                day: selectedDay,
                type: activePlaceType,
                time: `순서 ${routesData[selectedDay].spots.length + 1}`,
                name: name,
                lat: lat,
                lng: lng,
                desc: activePlaceType === 'food' ? (address || "주소 미지정") : extraInfo,
                phone: activePlaceType === 'food' ? extraInfo : ""
            };

            const activeStudentId = getStudentIdFromRoute(activeRouteKey);
            if (activeStudentId) {
                const candidateCount = collaborationApi.getCandidatesForStudent(collaborationState, activeStudentId, selectedDay).length;
                collaborationState = collaborationApi.addCandidate(collaborationState, {
                    ...newSpot,
                    id: String(newSpot.id),
                    owner: activeStudentId,
                    time: `후보 ${candidateCount + 1}`,
                });
                saveCollaborationState();
            } else {
                collaborationState = collaborationApi.addDaySpot(collaborationState, selectedDay, newSpot);
                saveCollaborationState();
            }

            // 입력 필드 비우기
            document.getElementById('archi-name').value = '';
            document.getElementById('archi-address').value = '';
            document.getElementById('archi-desc').value = '';
            document.getElementById('food-name').value = '';
            document.getElementById('food-address').value = '';
            document.getElementById('food-phone').value = '';
            document.getElementById('other-name').value = '';
            document.getElementById('other-address').value = '';
            document.getElementById('other-desc').value = '';

            if (activeStudentId) {
                updateRouteView(activeRouteKey);
            } else {
                const dayTab = document.querySelector(`#subtabs-main .tab-btn[data-route="${selectedDay}"]`);
                if (dayTab) dayTab.click();
            }
        } else {
            alert(`"${name}"의 지리적 위치를 찾지 못했습니다. 보다 명확한 구글식 건물명 또는 영문 주소로 기입해 보세요.`);
        }
    } catch (err) {
        console.error("장소 추가 검색 에러:", err);
        alert("장소를 검색하는 도중 네트워크 통신 에러가 발생했습니다.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

// --- 6. 탭 전환 및 저장 이벤트 바인딩 ---

document.getElementById('place-day').addEventListener('change', () => {
    if (isStudentRoute(activeRouteKey)) {
        updateRouteView(activeRouteKey);
    }
});

document.querySelectorAll('.menu-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.menu-tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const menuMode = e.target.dataset.menu;
        const mainSubtabs = document.getElementById('subtabs-main');
        const themeSubtabs = document.getElementById('subtabs-theme');
        const collabSubtabs = document.getElementById('subtabs-collab');

        if (menuMode === 'main') {
            mainSubtabs.classList.remove('hidden');
            themeSubtabs.classList.add('hidden');
            collabSubtabs.classList.add('hidden');
            const activeSub = mainSubtabs.querySelector('.tab-btn.active') || mainSubtabs.querySelector('.tab-btn');
            activeSub.classList.add('active');
            updateRouteView(activeSub.dataset.route);
        } else if (menuMode === 'theme') {
            mainSubtabs.classList.add('hidden');
            themeSubtabs.classList.remove('hidden');
            collabSubtabs.classList.add('hidden');
            const activeSub = themeSubtabs.querySelector('.tab-btn.active') || themeSubtabs.querySelector('.tab-btn');
            activeSub.classList.add('active');
            updateRouteView(activeSub.dataset.route);
        } else {
            mainSubtabs.classList.add('hidden');
            themeSubtabs.classList.add('hidden');
            collabSubtabs.classList.remove('hidden');
            const activeSub = collabSubtabs.querySelector('.tab-btn.active') || collabSubtabs.querySelector('.tab-btn');
            activeSub.classList.add('active');
            updateRouteView(activeSub.dataset.route);
        }
    });
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const parentContainer = e.target.parentElement;
        parentContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        updateRouteView(e.target.dataset.route);
    });
});

document.getElementById('btn-optimize').addEventListener('click', optimizeRoute);

document.getElementById('btn-export-image').addEventListener('click', () => {
    const captureArea = document.getElementById('capture-area');
    const exportBtn = document.getElementById('btn-export-image');
    const originalText = exportBtn.innerHTML;
    
    exportBtn.disabled = true;
    exportBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 이미지 생성 중...`;

    html2canvas(captureArea, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#0f172a',
        logging: false,
        scale: 2
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Sydney_Optimized_Walk_${activeRouteKey}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        exportBtn.disabled = false;
        exportBtn.innerHTML = originalText;
    }).catch(err => {
        console.error("이미지 캡처 오류:", err);
        alert("이미지 변환 중 오류가 발생했습니다.");
        exportBtn.disabled = false;
        exportBtn.innerHTML = originalText;
    });
});

// --- 7. 초기 렌더링 ---
window.addEventListener('DOMContentLoaded', () => {
    if (firebaseCollaborationSync) {
        firebaseCollaborationSync.start(collaborationState, {
            onRemoteState: (remoteState) => {
                collaborationState = remoteState;
                localStorage.setItem(collaborationStoreKey, collaborationApi.serializeState(collaborationState));
                updateRouteView(activeRouteKey);
            },
            onStatus: (status) => {
                console.info(`Firebase collaboration sync: ${status}`);
            },
            onError: (error) => {
                console.warn("Firebase collaboration sync is unavailable. Local backup remains active.", error);
            },
        });
    }

    setTimeout(() => {
        map.invalidateSize();
        updateRouteView('all');
    }, 300);
});
