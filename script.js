document.addEventListener('DOMContentLoaded', () => {
    const state = {
        players: [],
        settings: {
            timerEnabled: false,
            timerDuration: 20
        },
        currentRound: {
            category: null,
            letter: null,
            answers: [],
            currentPlayerIndex: 0,
            timerId: null
        },
        currentScreen: 'setup',
    };

    const screens = {
        setup: document.getElementById('setup-screen'),
        transition: document.getElementById('transition-screen'),
        game: document.getElementById('game-screen'),
        reveal: document.getElementById('reveal-screen'),
        scoreboard: document.getElementById('scoreboard-screen')
    };
    const playerCountSelect = document.getElementById('player-count');
    const playerNamesContainer = document.getElementById('player-names-container');
    const startGameBtn = document.getElementById('start-game-btn');
    const homeBtn = document.getElementById('home-btn');

    const timerEnabledCheckbox = document.getElementById('timer-enabled-checkbox');
    const timerSettingsContainer = document.getElementById('timer-settings-container');
    const timerDurationInput = document.getElementById('timer-duration-input');
    const timerDurationDisplay = document.getElementById('timer-duration-display');


    let categories = [];

    const updateUI = () => {
        Object.keys(screens).forEach(screenKey => {
            screens[screenKey].classList.toggle('active', screenKey === state.currentScreen);
        });
        homeBtn.classList.toggle('hidden', state.currentScreen === 'setup');
    };

    const startNewRound = () => {
        if (categories.length === 0) {
            console.error("Keine Kategorien geladen, Runde kann nicht gestartet werden.");
            screens.setup.innerHTML = `<div class="text-center p-4 text-error">Spiel konnte nicht gestartet werden. Kategorien konnten nicht geladen werden.</div>`;
            state.currentScreen = 'setup';
            updateUI();
            return;
        }
        state.currentRound = {
            category: categories[Math.floor(Math.random() * categories.length)],
            letter: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
            answers: [],
            currentPlayerIndex: 0,
            timerId: null,
        };
        showTransitionScreen();
    };

    const showTransitionScreen = () => {
        if (state.currentRound.currentPlayerIndex >= state.players.length) {
            showRevealScreen();
            return;
        }

        const nextPlayer = state.players[state.currentRound.currentPlayerIndex];
        screens.transition.innerHTML = `
            <div id="transition-card" class="text-center space-y-8 p-8 card bg-base-100 shadow-xl cursor-pointer min-h-[70vh] flex flex-col justify-center">
                <div class="avatar mx-auto">
                    <div class="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-4">
                        <img src="${nextPlayer.avatar}" alt="Player Avatar" loading="lazy" decoding="async"/>
                    </div>
                </div>
                <div>
                    <h2 class="text-4xl font-bold">Weitergeben an ${nextPlayer.name}</h2>
                    <p class="text-lg opacity-70 mt-2">Tippe, wenn du bereit bist!</p>
                </div>
            </div>`;

        state.currentScreen = 'transition';
        updateUI();

        screens.transition.querySelector('#transition-card').addEventListener('click', showGameScreen);
    };

    const showGameScreen = () => {
        const currentPlayer = state.players[state.currentRound.currentPlayerIndex];
        const {
            category,
            letter
        } = state.currentRound;

        let promptText;
        if (category.letter) {
            promptText = category.text.replace("'%LETTER%'", `<strong class="text-neutral text-5xl">${letter}</strong>`);
        } else {
            promptText = category.text;
        }

        screens.game.innerHTML = `
            <div class="flex items-center justify-between p-3 bg-base-200/60 rounded-2xl shadow-sm">
                <div class="flex items-center space-x-3">
                    <div class="avatar">
                        <div class="w-12 rounded-full ring ring-primary">
                            <img src="${currentPlayer.avatar}" alt="${currentPlayer.name}'s avatar" loading="lazy" decoding="async"/>
                        </div>
                    </div>
                    <div>
                        <div class="font-bold text-lg">${currentPlayer.name}</div>
                        <div class="text-sm opacity-70">Du bist dran!</div>
                    </div>
                </div>
                <div id="timer-display" class="font-mono text-2xl font-black text-neutral"></div>
            </div>
            <progress id="timer-progress" class="progress progress-primary w-full hidden"></progress>
            <div class="card text-primary-content shadow-lg p-8 text-center min-h-[14rem] flex justify-center items-center rounded-3xl">
                <h2 class="text-2xl font-bold leading-tight">${promptText}</h2>
            </div>
            <div class="form-control w-full">
                <input id="answer-input" type="text" placeholder="Deine Antwort hier..."
                        class="input input-bordered w-full text-xl p-7 text-center rounded-full" />
            </div>
            <button id="submit-answer-btn" class="btn btn-success btn-lg w-full rounded-full">
                <span class="material-symbols-rounded">done</span>
                <span>Bestätigen</span>
            </button>`;

        state.currentScreen = 'game';
        updateUI();

        const answerInput = screens.game.querySelector('#answer-input');
        const submitBtn = screens.game.querySelector('#submit-answer-btn');

        answerInput.focus();
        answerInput.addEventListener('keyup', e => {
            if (e.key === 'Enter') submitBtn.click();
        });

        submitBtn.addEventListener('click', handleAnswerSubmission);

        if (state.settings.timerEnabled) {
            const timerDisplay = screens.game.querySelector('#timer-display');
            const timerProgress = screens.game.querySelector('#timer-progress');
            timerProgress.classList.remove('hidden');
            timerProgress.max = state.settings.timerDuration;
            let timeLeft = state.settings.timerDuration;

            const updateTimerDisplay = () => {
                timerDisplay.textContent = timeLeft;
                timerProgress.value = timeLeft;
                if (timeLeft <= 5) {
                    timerDisplay.classList.add('timer-critical');
                } else {
                    timerDisplay.classList.remove('timer-critical');
                }
            };

            updateTimerDisplay(); // Initial display

            state.currentRound.timerId = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                if (timeLeft <= 0) {
                    handleAnswerSubmission();
                }
            }, 1000);
        }
    };

    const handleAnswerSubmission = () => {
        if (state.currentRound.timerId) {
            clearInterval(state.currentRound.timerId);
            state.currentRound.timerId = null;
        }

        const answer = document.getElementById('answer-input')?.value.trim() || '';
        state.currentRound.answers.push({
            playerIndex: state.currentRound.currentPlayerIndex,
            answer: answer,
            score: null
        });
        state.currentRound.currentPlayerIndex++;
        showTransitionScreen();
    };

    const showRevealScreen = () => {
        const revealContainer = document.getElementById('reveal-screen');
        revealContainer.innerHTML = '';

        let revealHTML = `
            <div class="p-4 sm:p-6 bg-base-100 rounded-3xl shadow-xl">
                <h1 class="text-4xl font-black text-center text-secondary mb-2">Die Enthüllung!</h1>
                <h3 id="reveal-prompt" class="text-lg text-center font-semibold mb-6 opacity-80"></h3>
                <div id="reveal-grid" class="grid grid-cols-1 gap-4"></div>
            </div>
            <button id="calculate-scores-btn" class="btn btn-accent btn-lg w-full rounded-full">
                <span class="material-symbols-rounded">calculate</span>
                <span>Punkte berechnen</span>
            </button>
        `;
        revealContainer.innerHTML = revealHTML;

        const revealGrid = document.getElementById('reveal-grid');
        document.getElementById('reveal-prompt').textContent =
            state.currentRound.category.letter ? state.currentRound.category.text.replace("'%LETTER%'", state.currentRound.letter) : state.currentRound.category.text;

        const answerCounts = {};
        state.currentRound.answers.forEach(ans => {
            const lowerCaseAnswer = ans.answer.toLowerCase();
            if (lowerCaseAnswer) answerCounts[lowerCaseAnswer] = (answerCounts[lowerCaseAnswer] || 0) + 1;
        });

        state.currentRound.answers.forEach(ans => {
            if (ans.answer === '') {
                ans.score = 0;
            } else if (answerCounts[ans.answer.toLowerCase()] > 1) {
                ans.score = 5;
            }
        });

        const answerGroups = {};
        state.currentRound.answers.forEach((ans, index) => {
            const key = ans.answer.toLowerCase() || `empty-${index}`;
            if (!answerGroups[key]) answerGroups[key] = [];
            answerGroups[key].push({
                ...ans,
                originalIndex: index
            });
        });

        Object.values(answerGroups).forEach((group) => {
            const isDuplicate = group.length > 1 && group[0].answer;
            const hasAnswer = !!group[0].answer;
            const playerNames = group.map(ans => state.players[ans.playerIndex].name).join(', ');
            const getScoreClass = (score) => (group[0].score === score ? 'btn-active' : '');

            revealGrid.innerHTML += `
                <div class="card bg-base-200 shadow-md">
                    <div class="card-body relative p-4">
                        ${isDuplicate ? `<div class="badge badge-warning font-bold absolute top-2 right-2">DOPPELT</div>` : ''}
                        <div class="flex items-center space-x-3 mb-3">
                             <div class="avatar-group -space-x-6 rtl:space-x-reverse">
                                ${group.map(ans => `
                                <div class="avatar">
                                  <div class="w-10 border-2 border-base-100 rounded-full">
                                    <img src="${state.players[ans.playerIndex].avatar}" alt="${state.players[ans.playerIndex].name}'s avatar" loading="lazy" decoding="async" />
                                  </div>
                                </div>`).join('')}
                            </div>
                            <div class="font-bold text-sm">${playerNames}</div>
                        </div>
                        <p class="text-xl font-semibold text-center p-4 bg-base-100 rounded-lg min-h-[5rem] flex items-center justify-center break-all">
                            ${group[0].answer || '<em class="opacity-60">(Keine Antwort)</em>'}
                        </p>
                        <div class="card-actions justify-center mt-4 space-x-2" data-group-answers='${JSON.stringify(group.map(g => g.originalIndex))}'>
                            <button class="btn btn-sm btn-outline btn-success vote-btn ${getScoreClass(10)}" data-score="10" ${!hasAnswer ? 'disabled' : ''}>🧠 10</button>
                            <button class="btn btn-sm btn-outline btn-warning vote-btn ${getScoreClass(5)}" data-score="5" ${!hasAnswer ? 'disabled' : ''}>🤝 5</button>
                            <button class="btn btn-sm btn-outline btn-error vote-btn ${getScoreClass(0)}" data-score="0" ${!hasAnswer ? '' : ''}>🗑️ 0</button>
                        </div>
                    </div>
                </div>`;
        });

        state.currentScreen = 'reveal';
        updateUI();

        document.getElementById('reveal-grid').addEventListener('click', (e) => {
            const btn = e.target.closest('.vote-btn');
            if (btn && !btn.disabled) {
                const score = parseInt(btn.dataset.score);
                const answerIndices = JSON.parse(btn.parentElement.dataset.groupAnswers);

                answerIndices.forEach(index => {
                    state.currentRound.answers[index].score = score;
                });

                const allVoteWrappers = document.querySelectorAll('.card-actions');
                allVoteWrappers.forEach(wrapper => {
                    if (wrapper.contains(btn)) {
                        wrapper.querySelectorAll('.vote-btn').forEach(b => b.classList.remove('btn-active'));
                    }
                });
                btn.classList.add('btn-active');
            }
        });

        document.getElementById('calculate-scores-btn').addEventListener('click', () => {
            state.currentRound.answers.forEach(ans => {
                if (ans.score === null && ans.answer) {
                    ans.score = 10;
                }
                if (state.players[ans.playerIndex] && ans.score) {
                    state.players[ans.playerIndex].score += ans.score;
                }
            });
            showScoreboardScreen();
        });
    };

    const showScoreboardScreen = () => {
        const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
        const winner = sortedPlayers[0];

        let scoreboardListHTML = '';
        sortedPlayers.forEach((player, index) => {
            const isWinner = index === 0 && winner.score > 0;
            const medal = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

            scoreboardListHTML += `
                <div class="flex items-center justify-between p-4 rounded-2xl shadow ${isWinner ? 'bg-primary text-primary-content scale-105 transform' : 'bg-base-100'}">
                    <div class="flex items-center gap-4">
                        <div class="font-bold text-2xl w-8 text-center">${medal}</div>
                        <div class="avatar">
                            <div class="w-12 rounded-full ring ${isWinner ? 'ring-offset-2 ring-white' : 'ring-primary'}">
                                <img src="${player.avatar}" alt="${player.name}'s avatar" loading="lazy" decoding="async"/>
                            </div>
                        </div>
                        <div class="font-semibold text-lg">${player.name}</div>
                    </div>
                    <div class="text-2xl font-black">${player.score} Pkt.</div>
                </div>`;
        });

        screens.scoreboard.innerHTML = `
            <div class="text-center mb-6">
                <h1 class="text-5xl font-black text-primary">Punktestand</h1>
                ${winner && winner.score > 0 ? `<p class="text-lg opacity-80 mt-2">🎉 Glückwunsch, ${winner.name}! 🎉</p>` : ''}
            </div>
            <div id="scoreboard-list" class="space-y-3 mb-8">${scoreboardListHTML}</div>
            <button id="next-round-btn" class="btn btn-primary btn-lg w-full rounded-full">
                <span class="material-symbols-rounded">replay</span>
                <span>Nächste Runde</span>
            </button>`;

        screens.scoreboard.querySelector('#next-round-btn').addEventListener('click', startNewRound);

        state.currentScreen = 'scoreboard';
        updateUI();

        if (winner && winner.score > 0) {
            setTimeout(() => {
                if (window.confetti) {
                    confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: {
                            y: 0.6
                        },
                        colors: ['#f59e0b', '#ef4444', '#f97316']
                    });
                }
            }, 400);
        }
    };

    const init = async () => {
        try {
            const response = await fetch('categories.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const rawCategories = data.de.categories;

            categories = rawCategories.map(cat => {
                const requiresLetter = cat.letter !== false;
                let text = cat.text;
                if (requiresLetter && !text.includes('%LETTER%')) {
                    text = `${text} mit dem Anfangsbuchstaben '%LETTER%'`;
                }
                return {
                    ...cat,
                    text,
                    letter: requiresLetter
                };
            });

        } catch (error) {
            console.error("Spielkategorien konnten nicht geladen werden:", error);
            const setupScreen = document.getElementById('setup-screen');
            if(setupScreen) {
                 setupScreen.innerHTML = `<div class="p-4 m-4 text-center text-red-700 bg-red-100 rounded-lg shadow"><strong>Fehler:</strong> Spieldaten konnten nicht geladen werden. Bitte prüfe, ob 'categories.json' erreichbar ist, und lade die Seite neu.</div>` + setupScreen.innerHTML;
            }
            return;
        }

        homeBtn.addEventListener('click', () => {
            if (confirm('Möchtest du wirklich zum Hauptmenü zurückkehren? Dein aktueller Spielstand geht verloren.')) {
                location.reload();
            }
        });

        timerEnabledCheckbox.addEventListener('change', () => {
            timerSettingsContainer.classList.toggle('hidden', !timerEnabledCheckbox.checked);
        });

        timerDurationInput.addEventListener('input', () => {
            timerDurationDisplay.textContent = `${timerDurationInput.value} Sekunden`;
        });

        playerCountSelect.addEventListener('change', () => {
            const count = parseInt(playerCountSelect.value);
            playerNamesContainer.innerHTML = '';

            for (let i = 1; i <= count; i++) {
                const seed = `Spieler-${i}-${Math.random()}`;
                const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&radius=50`;
                const inputHTML = `
                    <div class="flex items-center gap-3 p-2 bg-base-200/70 rounded-full shadow-sm">
                        <div class="relative flex-shrink-0">
                            <div class="avatar">
                                <div class="w-14 rounded-full">
                                    <img src="${avatarUrl}" alt="Avatar" loading="lazy" decoding="async"/>
                                </div>
                            </div>
                            <button tabindex="-1" class="randomize-avatar-btn btn btn-xs btn-circle btn-primary absolute -bottom-1 -right-0 border-2 border-white" aria-label="Zufälliger Avatar">
                                <span class="material-symbols-rounded !text-sm text-primary-content">casino</span>
                            </button>
                        </div>
                        <input type="text" placeholder="Spieler ${i}" 
                                class="input input-ghost w-full player-name-input mr-2 !text-lg !font-semibold focus:bg-transparent" />
                    </div>`;
                playerNamesContainer.insertAdjacentHTML('beforeend', inputHTML);
            }
            startGameBtn.classList.remove('hidden');
        });

        playerNamesContainer.addEventListener('click', e => {
            const randomizeBtn = e.target.closest('.randomize-avatar-btn');
            if (randomizeBtn) {
                const img = randomizeBtn.closest('.flex').querySelector('img');
                const randomSeed = Math.random().toString(36).substring(7);
                img.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${randomSeed}&radius=50`;
            }
        });

        startGameBtn.addEventListener('click', () => {
            state.settings.timerEnabled = timerEnabledCheckbox.checked;
            state.settings.timerDuration = parseInt(timerDurationInput.value, 10) || 20;

            const nameInputs = document.querySelectorAll('.player-name-input');
            const avatarImgs = document.querySelectorAll('#player-names-container img');
            state.players = Array.from(nameInputs).map((input, index) => ({
                name: input.value.trim() || `Spieler ${index + 1}`,
                score: 0,
                avatar: avatarImgs[index].src,
            }));
            startNewRound();
        });

        updateUI();
    };

    init();
});
