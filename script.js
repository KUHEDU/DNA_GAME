// 💡 구글 시트 데이터 주소 (TSV 형식으로 변환됨)
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAxmMvkbM1UubK3_JGGG9wKCD0pajse0_PA1fQhUjuFYhzkm86EvTHUV5gjVlkRkk0PU8F1_h9kJln/pub?gid=0&single=true&output=tsv';

const introScreen = document.getElementById('intro-screen');
const worldviewScreen = document.getElementById('worldview-screen');
const gameScreen = document.getElementById('game-screen');

const titleEl = document.getElementById('stage-title');
const descEl = document.getElementById('stage-desc');
const inputEl = document.getElementById('answer-input');
const messageEl = document.getElementById('message-text');
const hintBoxEl = document.getElementById('hint-box');

const successPopup = document.getElementById('success-popup');
const popupKeyword = document.getElementById('popup-keyword');
const popupText = document.getElementById('popup-text');

// 게임 데이터를 담을 빈 배열
let gameData = [];
let currentStageIndex = 0;

// 💡 구글 시트에서 데이터 불러오기 함수
async function fetchGameData() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        
        const rows = data.split('\n');
        const headers = rows[0].split('\t').map(header => header.trim());

        gameData = []; // 초기화
        for (let i = 1; i < rows.length; i++) {
            if (!rows[i].trim()) continue; // 빈 줄 무시
            const values = rows[i].split('\t');
            let stageObj = {};
            for (let j = 0; j < headers.length; j++) {
                stageObj[headers[j]] = values[j] ? values[j].trim() : "";
            }
            gameData.push(stageObj);
        }
        console.log("시트 연동 완료!", gameData);
    } catch (error) {
        console.error("데이터 연동 실패:", error);
        alert("게임 데이터를 불러오지 못했습니다. 인터넷 연결을 확인하세요.");
    }
}

// 배경 이미지 변경 함수
function changeBackground(imageName) {
    document.body.style.backgroundImage = `url('${imageName}')`;
}

// 처음 웹페이지 로드 시 배경 설정 및 데이터 불러오기 시작
window.onload = function() {
    changeBackground('bg_intro.png');
    fetchGameData(); // 💡 웹페이지가 켜지자마자 엑셀 데이터 가져오기
};

function showWorldview() {
    introScreen.classList.add('hidden');
    worldviewScreen.classList.remove('hidden');
    changeBackground('bg_default.png'); 
}

function startGame() {
    // 💡 데이터 로딩이 안 끝났을 경우 방어
    if (gameData.length === 0) {
        alert("데이터를 불러오는 중입니다. 1~2초 후 다시 눌러주세요.");
        return;
    }
    worldviewScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    loadStage();
}

function loadStage() {
    const storyBox = document.querySelector('.story-box');
    
    // 🌟 마지막 스테이지 클리어 처리
    if (currentStageIndex >= gameData.length) {
        titleEl.innerHTML = "MISSION CLEAR<br><span class='stage-subtitle'>인류의 구원</span>";
        descEl.innerHTML = "<br><br><b>[작전 종료]</b><br><br>당신과 건국대학교병원 생존자들의 헌신으로 마침내 완벽한 치료제가 완성되었습니다.<br><br>5가지 핵심 가치를 모두 증명해 낸 당신의 리더십이 인류를 구했습니다.<br><br>수고하셨습니다, 요원님.";
        
        // 투명도 모드 활성화
        storyBox.classList.add('clear-mode');
        
        document.querySelector('.input-section').style.display = 'none';
        hintBoxEl.classList.add('hidden');
        
        changeBackground('bg_clear.png');
        showSacredEffect(); 
        return;
    }

    // 일반 스테이지 로드 시 (투명도 모드 제거)
    storyBox.classList.remove('clear-mode');

    const stage = gameData[currentStageIndex];
    
    // 제목과 부제목 분리 디자인
    const titleParts = stage.title.split(':');
    if (titleParts.length > 1) {
        titleEl.innerHTML = `${titleParts[0]}<br><span class="stage-subtitle">${titleParts[1].trim()}</span>`;
    } else {
        titleEl.innerHTML = stage.title;
    }

    descEl.innerHTML = stage.desc;
    
    inputEl.value = "";
    messageEl.innerText = "";
    messageEl.className = "";
    hintBoxEl.classList.add('hidden');
    
    // bgClass가 시트에 정의되어 있으면 그것을 쓰고, 없으면 기존 규칙(bg_stageX) 사용
    const bgImage = stage.bgClass ? `${stage.bgClass}.png` : `bg_stage${currentStageIndex + 1}.png`;
    changeBackground(bgImage);
}

function checkAnswer() {
    const stage = gameData[currentStageIndex];
    const userInput = inputEl.value.trim();

    if (userInput === stage.answer) {
        popupKeyword.innerText = `[핵심가치: ${stage.keyword}] 획득!`;
        // 💡 innerHTML로 변경하여 <br> 태그가 적용되도록 수정
        popupText.innerHTML = stage.clearText;
        
        successPopup.classList.remove('hidden'); 
        
    } else {
        messageEl.innerText = "❌ 치명적 오류: 코드가 일치하지 않습니다.";
        messageEl.className = "error";
    }
}

function closePopupAndNext() {
    successPopup.classList.add('hidden'); 
    currentStageIndex++; 
    loadStage(); 
}

function showHint() {
    const stage = gameData[currentStageIndex];
    hintBoxEl.innerText = `[AI 통제실 단서]: ${stage.hint}`;
    hintBoxEl.classList.remove('hidden');
}

// 🏥 성스럽고 권위 있는 엔딩 효과 (Sacred Halo)
function showSacredEffect() {
    const halo = document.createElement('div');
    halo.className = 'sacred-halo animate-halo'; 
    document.body.appendChild(halo);
    
    setTimeout(() => {
        halo.remove();
    }, 3000);
}