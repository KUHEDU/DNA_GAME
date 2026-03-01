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
    }
}

function changeBackground(imageName) {
    document.body.style.backgroundImage = `url('${imageName}')`;
}

window.onload = function() {
    changeBackground('bg_intro.png');
    fetchGameData(); 

    // 💡 무전기 수신 대기: 격리실(scanner.html)에서 정답을 찾았다고 연락이 오면!
    window.addEventListener('message', function(event) {
        if (event.data === 'AR_FOUND') {
            alert("🎉 설립자의 유산이 스캔되었습니다! 힌트를 확인하세요.");
            stopARScan(); // 카메라 방을 부숴서 완전히 끕니다.
        }
    });
};

function showWorldview() {
    introScreen.classList.add('hidden');
    worldviewScreen.classList.remove('hidden');
    changeBackground('bg_default.png'); 
}

function checkMissionCode() {
    if (gameData.length === 0) return;
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

    // 🌟 4단계(배열 3)에서만 버튼 등장
    if (currentStageIndex === 3) arBtn.classList.remove('hidden');
    else arBtn.classList.add('hidden');

    if (currentStageIndex === gameData.length - 1) {
        const titleParts = stage.title.split(':');
        titleEl.innerHTML = titleParts.length > 1 ? `${titleParts[0]}<br><span class="stage-subtitle">${titleParts[1].trim()}</span>` : stage.title;
        descEl.innerHTML = stage.desc;
        if (inputEl && inputEl.parentElement) inputEl.parentElement.style.display = 'none'; 
        if (hintBoxEl) hintBoxEl.style.display = 'none'; 
        storyBox.classList.add('clear-mode');
        changeBackground(stage.bgClass ? `${stage.bgClass}.png` : 'bg_clear.png');
        showSacredEffect(); 
        return;
    }

    storyBox.classList.remove('clear-mode'); 
    if (inputEl && inputEl.parentElement) inputEl.parentElement.style.display = 'flex'; 
    if (hintBoxEl) hintBoxEl.style.display = ''; 

    const titleParts = stage.title.split(':');
    titleEl.innerHTML = titleParts.length > 1 ? `${titleParts[0]}<br><span class="stage-subtitle">${titleParts[1].trim()}</span>` : stage.title;
    descEl.innerHTML = stage.desc;
    inputEl.value = ""; messageEl.innerText = ""; messageEl.className = ""; hintBoxEl.classList.add('hidden');
    changeBackground(stage.bgClass ? `${stage.bgClass}.png` : `bg_stage${currentStageIndex + 1}.png`);
}

// 📸 AR 카메라 가동 (Iframe에 주소 할당)
function startARScan() {
    document.getElementById('main-ui').style.display = 'none';
    document.getElementById('ar-overlay').style.display = 'block';
    // 이 순간에만 카메라 방(scanner.html)을 로딩합니다.
    document.getElementById('ar-iframe').src = "scanner.html";
}

// 📸 AR 카메라 종료 (Iframe 주소 삭제 = 카메라 렌즈 완전히 꺼짐)
function stopARScan() {
    document.getElementById('ar-overlay').style.display = 'none';
    document.getElementById('main-ui').style.display = 'flex';
    document.getElementById('ar-iframe').src = ""; // 카메라 즉시 종료!
}

function checkAnswer() {
    const stage = gameData[currentStageIndex];
    if (inputEl.value.trim() === stage.answer) {
        popupKeyword.innerText = `[핵심가치: ${stage.keyword}] 획득!`;
        popupText.innerHTML = stage.clearText;
        successPopup.classList.remove('hidden'); 
    } else {
        messageEl.innerText = "❌ 치명적 오류: 코드가 일치하지 않습니다.";
        messageEl.className = "error";
    }
}

function closePopupAndNext() { successPopup.classList.add('hidden'); currentStageIndex++; loadStage(); }
function showHint() { hintBoxEl.innerText = `[AI 통제실 단서]: ${gameData[currentStageIndex].hint}`; hintBoxEl.classList.remove('hidden'); }
function showSacredEffect() { const halo = document.createElement('div'); halo.className = 'sacred-halo animate-halo'; document.body.appendChild(halo); setTimeout(() => { halo.remove(); }, 3000); }
