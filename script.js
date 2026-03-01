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

// 💡 구글 시트에서 데이터 불러오기 함수 (캐시 방지 로직 포함)
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
};

function showWorldview() {
    introScreen.classList.add('hidden');
    worldviewScreen.classList.remove('hidden');
    changeBackground('bg_default.png'); 
}

function startGame() {
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
    const stage = gameData[currentStageIndex];

    // 🌟 [엔딩 로직] 마지막 행일 때
    if (currentStageIndex === gameData.length - 1) {
        const titleParts = stage.title.split(':');
        titleEl.innerHTML = titleParts.length > 1 
            ? `${titleParts[0]}<br><span class="stage-subtitle">${titleParts[1].trim()}</span>` 
            : stage.title;
        descEl.innerHTML = stage.desc;

        // 🔥 UI 숨기기
        if (inputEl && inputEl.parentElement) {
            inputEl.parentElement.style.display = 'none'; 
        }
        if (hintBoxEl) {
            hintBoxEl.style.display = 'none'; 
        }

        // 💡 투명도와 황금빛 효과는 이제 전적으로 CSS(.clear-mode)가 담당합니다!
        storyBox.classList.add('clear-mode');

        const bgImage = stage.bgClass ? `${stage.bgClass}.png` : 'bg_clear.png';
        changeBackground(bgImage);
        showSacredEffect(); 
        return;
    }

    // 🌟 [일반 스테이지 로직]
    storyBox.classList.remove('clear-mode'); // 일반 스테이지에서는 황금빛 제거
    
    // 숨겼던 UI 다시 살리기
    if (inputEl && inputEl.parentElement) {
        inputEl.parentElement.style.display = 'flex'; 
    }
    if (hintBoxEl) {
        hintBoxEl.style.display = ''; 
    }

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
