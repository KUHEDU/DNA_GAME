// 💡 구글 시트 데이터 주소 (TSV 형식)
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

let gameData = [];
let currentStageIndex = 0;

// 💡 구글 시트에서 데이터 불러오기
async function fetchGameData() {
    try {
        const cacheBuster = `&t=${new Date().getTime()}`;
        const response = await fetch(SHEET_URL + cacheBuster);
        const data = await response.text();
        
        const rows = data.split('\n');
        const headers = rows[0].split('\t').map(header => header.trim());

        gameData = []; 
        for (let i = 1; i < rows.length; i++) {
            if (!rows[i].trim()) continue; 
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

function changeBackground(imageName) {
    document.body.style.backgroundImage = `url('${imageName}')`;
}

window.onload = function() {
    changeBackground('bg_intro.png');
    fetchGameData(); 

    // AR 마커 인식 이벤트 리스너 등록
    window.addEventListener('nft-found', function() {
        alert("🎉 설립자의 유산이 스캔되었습니다! 힌트를 확인하세요.");
        // 자동으로 입력칸에 어떤 단어를 채워줄 수도 있습니다.
        // inputEl.value = "FOUNDER";
        stopARScan();
    });
};

function showWorldview() {
    introScreen.classList.add('hidden');
    worldviewScreen.classList.remove('hidden');
    changeBackground('bg_default.png'); 
}

// 💡 미션 시작 전 암호를 확인하는 함수 (0303)
function checkMissionCode() {
    if (gameData.length === 0) {
        alert("데이터를 불러오는 중입니다. 잠시만 기다려주세요.");
        return;
    }

    const inputCode = document.getElementById('mission-code-input').value.trim();
    const errorText = document.getElementById('mission-error-text');

    const requiredCode = gameData[0].missionCode ? gameData[0].missionCode.toString().trim() : "0303";

    if (inputCode === requiredCode) {
        errorText.innerText = "";
        startGame(); 
    } else {
        errorText.innerText = "❌ 접근 거부: 잘못된 미션 코드입니다.";
        errorText.style.color = "#ff7b72";
        
        errorText.style.animation = "none";
        setTimeout(() => { errorText.style.animation = "shake 0.3s"; }, 10);
    }
}

function startGame() {
    worldviewScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    loadStage();
}

function loadStage() {
    const storyBox = document.querySelector('.story-box');
    const arBtn = document.getElementById('ar-scan-btn');
    const stage = gameData[currentStageIndex];

    // 🌟 [추가] 4단계 (배열 인덱스 3)일 때만 AR 스캔 버튼 보이기
    if (currentStageIndex === 3) {
        arBtn.classList.remove('hidden');
    } else {
        arBtn.classList.add('hidden');
    }

    // 🌟 [엔딩 로직] 마지막 행일 때
    if (currentStageIndex === gameData.length - 1) {
        const titleParts = stage.title.split(':');
        titleEl.innerHTML = titleParts.length > 1 
            ? `${titleParts[0]}<br><span class="stage-subtitle">${titleParts[1].trim()}</span>` 
            : stage.title;
        descEl.innerHTML = stage.desc;

        if (inputEl && inputEl.parentElement) inputEl.parentElement.style.display = 'none'; 
        if (hintBoxEl) hintBoxEl.style.display = 'none'; 

        storyBox.classList.add('clear-mode');

        const bgImage = stage.bgClass ? `${stage.bgClass}.png` : 'bg_clear.png';
        changeBackground(bgImage);
        showSacredEffect(); 
        return;
    }

    // 🌟 [일반 스테이지 로직]
    storyBox.classList.remove('clear-mode'); 
    
    if (inputEl && inputEl.parentElement) inputEl.parentElement.style.display = 'flex'; 
    if (hintBoxEl) hintBoxEl.style.display = ''; 

    const titleParts = stage.title.split(':');
    titleEl.innerHTML = titleParts.length > 1 
        ? `${titleParts[0]}<br><span class="stage-subtitle">${titleParts[1].trim()}</span>` 
        : stage.title;
    descEl.innerHTML = stage.desc;
    
    inputEl.value = "";
    messageEl.innerText = "";
    messageEl.className = "";
    hintBoxEl.classList.add('hidden');
    
    const bgImage = stage.bgClass ? `${stage.bgClass}.png` : `bg_stage${currentStageIndex + 1}.png`;
    changeBackground(bgImage);
}

// 📸 AR 카메라 구동 함수
function startARScan() {
    document.getElementById('main-ui').style.display = 'none';
    document.getElementById('ar-overlay').style.display = 'block';
    
    // 처음에 카메라가 켜질 때 화면 크기 조절을 위한 이벤트 발생
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 500);
}

// 📸 AR 카메라 종료 함수
function stopARScan() {
    document.getElementById('ar-overlay').style.display = 'none';
    document.getElementById('main-ui').style.display = 'flex';
}

function checkAnswer() {
    const stage = gameData[currentStageIndex];
    const userInput = inputEl.value.trim();

    if (userInput === stage.answer) {
        popupKeyword.innerText = `[핵심가치: ${stage.keyword}] 획득!`;
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

function showSacredEffect() {
    const halo = document.createElement('div');
    halo.className = 'sacred-halo animate-halo'; 
    document.body.appendChild(halo);
    setTimeout(() => { halo.remove(); }, 3000);
}
