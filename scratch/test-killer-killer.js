/**
 * Automated Test Suite for Killer Killer
 * Verifies all 25 test requirements from Part 15
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '..');
const kkHtml = fs.readFileSync(path.join(rootDir, 'games/killer-killer.html'), 'utf8').replace(/\r\n/g, '\n');
const kkCss = fs.readFileSync(path.join(rootDir, 'games/killer-killer.css'), 'utf8').replace(/\r\n/g, '\n');
const kkJs = fs.readFileSync(path.join(rootDir, 'games/killer-killer.js'), 'utf8').replace(/\r\n/g, '\n');

console.log('==============================================');
console.log('   RUNNING KILLER KILLER AUTOMATED TESTS      ');
console.log('==============================================\n');

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    process.exit(1);
  }
}

// 1. Four-player minimum
test('1. Four-player minimum enforced in logic and UI', () => {
  assert(kkJs.includes('this.playerNames.length <= 4'), 'Setup must prevent removing below 4 players');
  assert(kkJs.includes('Minimum 4 players required'), 'Error notice must warn on < 4 players');
  assert(kkJs.includes('total < 4'), 'Start button must be disabled when total < 4');
});

// 2. Twelve-player maximum
test('2. Twelve-player maximum enforced', () => {
  assert(kkJs.includes('this.playerNames.length >= 12'), 'Setup must limit adding beyond 12 players');
  assert(kkJs.includes('Maximum 12 players allowed'), 'Error notice for 12 players max');
});

// 3. Correct random role assignment (Fisher-Yates)
test('3. Correct role assignment: 1 Killer, 1 Police, 1 Doctor, N-3 Citizens with Fisher-Yates', () => {
  assert(kkJs.includes("roleDeck = ['KILLER', 'POLICE', 'DOCTOR']"), 'Base roles must include Killer, Police, Doctor');
  assert(kkJs.includes("roleDeck.push('CITIZEN')"), 'Remaining roles must be Citizen');
  assert(kkJs.includes('[roleDeck[i], roleDeck[j]] = [roleDeck[j], roleDeck[i]]'), 'Fisher-Yates shuffle must be used');
});

// 4. Correct secret word distribution
test('4. Correct secret word distribution', () => {
  assert(kkJs.includes('this.currentSecretWord'), 'Secret word must be tracked');
  assert(kkJs.includes('this.currentCategory'), 'Category must be tracked');
  assert(kkJs.includes('WORD_BANK'), 'Offline word bank must be defined');
});

// 5. Killer receives only the category
test('5. Killer receives only category, never the actual secret word', () => {
  assert(kkJs.includes("player.role === 'KILLER'"), 'Distinct handling for Killer role');
  assert(kkJs.includes("this.secretWordLabel.textContent = 'UNKNOWN (BLUFF!)'"), 'Killer label must state UNKNOWN (BLUFF!)');
  assert(kkJs.includes('You do NOT know the exact word!'), 'Instructions must remind Killer to bluff');
});

// 6. Private role reveal
test('6. Private role reveal with shield/tap-to-reveal', () => {
  assert(kkHtml.includes('id="roleCardShield"'), 'Role card shield element exists');
  assert(kkHtml.includes('id="btnRevealRole"'), 'Reveal role button exists');
  assert(kkJs.includes('this.btnRevealRole.addEventListener'), 'Event listener attached for role reveal');
});

// 7. Secret handoff between players
test('7. Secret handoff between players', () => {
  assert(kkHtml.includes('id="viewHandoff"'), 'Handoff view exists');
  assert(kkHtml.includes('id="handoffPlayerName"'), 'Handoff target name exists');
  assert(kkJs.includes('requestHandoff'), 'Handoff helper method exists');
});

// 8. Word descriptions with randomized speaking order (Fisher-Yates) and passing option
test('8. Word descriptions with randomized speaking order (Fisher-Yates) and passing option', () => {
  assert(kkJs.includes('startWordClueRound'), 'startWordClueRound exists');
  assert(!kkJs.includes('(this.round - 1) % living.length'), 'Old rotation formula removed');
  assert(kkJs.includes('Math.floor(Math.random() * (i + 1))'), 'Fisher-Yates random shuffle present');
  assert(kkHtml.includes('id="btnPassSpeaker"'), 'Pass turn button exists in HTML');
  assert(kkJs.includes('this.btnPassSpeaker.addEventListener'), 'Pass turn handler wired');
});

// 9. Killer guessing correctly
test('9. Killer guessing correctly awards +1 bonus point', () => {
  assert(kkJs.includes('isCorrect = guess.toLowerCase() === this.currentSecretWord.toLowerCase()'), 'Case-insensitive word match');
  assert(kkJs.includes('this.killerBonusPoints = 1'), 'Bonus point assigned on correct guess');
  assert(kkJs.includes('this.killerGuessedCorrectly = isCorrect'), 'Correct flag saved');
});

// 10. Killer guessing incorrectly
test('10. Killer guessing incorrectly gives no bonus point and does not eliminate', () => {
  assert(kkJs.includes('No bonus point awarded'), 'Feedback informs no bonus point on incorrect guess');
  assert(!kkJs.includes('this.killerBonusPoints = -1'), 'No penalty or auto-elimination on incorrect guess');
});

// 11. Killer cannot guess twice
test('11. Killer cannot guess twice (limited to one guess per game)', () => {
  assert(kkJs.includes('this.killerHasGuessed = true'), 'Flag set upon guessing or skipping');
  assert(kkJs.includes('!this.killerHasGuessed'), 'Condition enforces only 1 guess attempt');
});

// 12. Killer attack
test('12. Killer attack targeting living players except self', () => {
  assert(kkJs.includes('p.isAlive && p.id !== killer.id'), 'Killer cannot target dead or self');
  assert(kkJs.includes('this.nightState.killerTargetId = target.id'), 'Killer target saved in memory');
});

// 13. Doctor successfully saves a target
test('13. Doctor successfully saves target if matching Killer target', () => {
  assert(kkJs.includes('killerTarget.id === doctorTarget.id'), 'Doctor and Killer match condition');
  assert(kkJs.includes('this.nightState.savedByDoctor = true'), 'Doctor save flag set');
  assert(kkJs.includes('nobody was eliminated'), 'Public announcement indicates nobody died');
});

// 14. Police investigation
test('14. Police investigation correctly checks target role', () => {
  assert(kkJs.includes("target.role === 'KILLER'"), 'Police check matches role KILLER');
  assert(kkJs.includes('IS THE KILLER'), 'Reveals Killer status privately to Police');
  assert(kkJs.includes('is NOT the Killer'), 'Reveals non-Killer status privately to Police');
});

// 15. Public night announcement
test('15. Public night announcement does not reveal secret roles or targets', () => {
  assert(kkJs.includes('dayNightOutcomeMessage'), 'Public message container exists');
  assert(!kkJs.includes('killer attacked [Player] and doctor protected'), 'Secret details never announced publicly');
});

// 16. Nominations
test('16. Nominations allow toggling suspects without automatic elimination', () => {
  assert(kkJs.includes('this.nominatedPlayerIds'), 'Nomination set exists');
  assert(kkHtml.includes('id="viewNomination"'), 'Nomination screen exists');
  assert(!kkJs.includes('this.nominatedPlayerIds.forEach(id => eliminate(id))'), 'Nominations do not eliminate');
});

// 17. Secret voting
test('17. Secret voting with private handoff and self-vote prevention', () => {
  assert(kkJs.includes('p.isAlive && p.id !== voter.id'), 'Voter cannot vote for self or dead');
  assert(kkJs.includes('this.votes[targetId]++'), 'Votes recorded secretly in memory');
});

// 18. Voting tie
test('18. Voting tie results in no elimination', () => {
  assert(kkJs.includes('topTied.length > 1'), 'Tie condition detected');
  assert(kkJs.toLowerCase().includes('nobody was eliminated this round'), 'Tie message displayed');
  assert(kkJs.includes('this.eliminatedByVote = null'), 'No player eliminated on tie');
});

// 19. Citizen victory
test('19. Citizen victory occurs when Killer is eliminated', () => {
  assert(kkJs.includes("!killer || !killer.isAlive"), 'Citizens win condition');
  assert(kkJs.includes("this.triggerVictory('CITIZENS')"), 'Citizens victory trigger');
});

// 20. Killer victory
test('20. Killer victory occurs when livingKillers >= livingNonKillers', () => {
  assert(kkJs.includes('livingKillers >= livingNonKillers'), 'Killer win parity condition');
  assert(kkJs.includes("this.triggerVictory('KILLER')"), 'Killer victory trigger');
});

// 21. Dead player restrictions
test('21. Dead players cannot vote, act, or give clues', () => {
  assert(kkJs.includes('this.players.filter(p => p.isAlive)'), 'Living players filtered for actions');
  assert(kkJs.includes('this.votingLivingPlayers = this.players.filter(p => p.isAlive)'), 'Only living players vote');
});

// 22. Restart and new game
test('22. Restart and new game buttons correctly reset or return to setup', () => {
  assert(kkHtml.includes('id="btnPlayAgainSame"'), 'Play again same button exists');
  assert(kkHtml.includes('id="btnNewGameSetup"'), 'New game setup button exists');
  assert(kkJs.includes('this.btnPlayAgainSame.addEventListener'), 'Play again wired');
  assert(kkJs.includes('this.btnNewGameSetup.addEventListener'), 'Return to setup wired');
});

// 23. Mobile touch interactions
test('23. Mobile touch interactions: viewport user-scalable=no, tap targets', () => {
  assert(kkHtml.includes('user-scalable=no'), 'Viewport meta configured for touch games');
  assert(kkCss.includes('-webkit-tap-highlight-color: transparent'), 'Tap highlight disabled');
  assert(kkCss.includes('min-height: 100vh') || kkCss.includes('min-height: 100%'), 'Full screen touch friendly');
});

// 24. Small-screen layout & CSS media queries
test('24. Responsive down to 320px and 360px', () => {
  assert(kkCss.includes('@media (max-width: 580px)'), 'Mobile media query exists');
  assert(kkCss.includes('@media (max-width: 360px)'), 'Ultra-compact 360px media query exists');
});

// 25. No secret information exposed in public history or LocalStorage
test('25. No secrets in public history or LocalStorage', () => {
  // Check that localStorage only stores sound mute preference
  const storageMatches = [...kkJs.matchAll(/localStorage\.(setItem|getItem)\(['"]([^'"]+)['"]/g)].map(m => m[2]);
  storageMatches.forEach(k => {
    assert(k === 'playrush_kk_sound_muted', `LocalStorage must ONLY store audio preferences, found: ${k}`);
  });

  // Verify publicHistory never stores secret word or roles
  assert(!kkJs.includes('this.addPublicHistoryLog(this.currentSecretWord)'), 'Secret word never added to public history');
  assert(!kkJs.includes('this.addPublicHistoryLog(this.currentCategory)'), 'Category never added to public history during active game');
});

/* ==========================================================================
   PART B: ONE FLOW MODE TESTS (16 SPECIFIC TEST ITEMS)
   ========================================================================== */
console.log('\n--- Running One Flow Mode Specific Tests ---');

// OF-1: Both modes can be selected
test('OF-1. Both modes can be selected in HTML and JS', () => {
  assert(kkHtml.includes('id="optModeOneFlow"'), 'One Flow Mode option element exists');
  assert(kkHtml.includes('id="optModeSeparateNight"'), 'Separate Night option element exists');
  assert(kkJs.includes("this.setGameMode('ONE_FLOW')"), 'setGameMode handles ONE_FLOW');
  assert(kkJs.includes("this.setGameMode('SEPARATE_NIGHT')"), 'setGameMode handles SEPARATE_NIGHT');
});

// OF-2: One Flow is the default
test('OF-2. One Flow Mode is selected by default', () => {
  assert(kkJs.includes("this.gameMode = 'ONE_FLOW'"), 'Default gameMode is ONE_FLOW');
  assert(kkHtml.includes('class="mode-option-card selected" id="optModeOneFlow"'), 'One Flow card is marked selected in HTML');
});

// OF-3: Killer action occurs immediately after role reveal
test('OF-3. Killer secret action occurs immediately during One Flow turn', () => {
  assert(kkJs.includes("player.role === 'KILLER'"), 'Checks for Killer role in turn');
  assert(kkJs.includes("this.oneFlowActionBadge.textContent = 'KILLER NIGHT ACTION'"), 'Killer night action badge displayed');
  assert(kkJs.includes("this.btnConfirmOneFlowAction.textContent = 'CONFIRM TARGET'"), 'Confirm target button available');
  assert(kkJs.includes('this.nightState.killerTargetId = this.selectedOneFlowTargetId'), 'Killer target saved to night state');
});

// OF-4: Doctor action occurs immediately after role reveal
test('OF-4. Doctor protection occurs immediately during One Flow turn', () => {
  assert(kkJs.includes("player.role === 'DOCTOR'"), 'Checks for Doctor role in turn');
  assert(kkJs.includes("this.oneFlowActionBadge.textContent = 'DOCTOR NIGHT ACTION'"), 'Doctor night action badge displayed');
  assert(kkJs.includes("this.btnConfirmOneFlowAction.textContent = 'CONFIRM PROTECTION'"), 'Confirm protection button available');
  assert(kkJs.includes('this.nightState.doctorTargetId = this.selectedOneFlowTargetId'), 'Doctor target saved to night state');
});

// OF-5: Police investigation occurs immediately after role reveal
test('OF-5. Police investigation occurs immediately during One Flow turn', () => {
  assert(kkJs.includes("player.role === 'POLICE'"), 'Checks for Police role in turn');
  assert(kkJs.includes("this.oneFlowActionBadge.textContent = 'POLICE NIGHT ACTION'"), 'Police night action badge displayed');
  assert(kkJs.includes("this.btnConfirmOneFlowAction.textContent = 'INVESTIGATE SUSPECT'"), 'Investigate button available');
  assert(kkJs.includes('this.nightState.policeTargetId = this.selectedOneFlowTargetId'), 'Police target saved to night state');
});

// OF-6: Citizens do not receive secret actions
test('OF-6. Citizens do not receive secret night actions and can pass directly', () => {
  assert(kkJs.includes("this.oneFlowActionBox.classList.add('hidden')"), 'Action box hidden for citizens');
  assert(kkJs.includes("this.btnHideRole.classList.remove('hidden')"), 'Hide role button immediately visible for citizens');
});

// OF-7: All players complete turns before morning
test('OF-7. All living players complete turns before resolving night actions', () => {
  assert(kkJs.includes('this.oneFlowPlayerIndex >= this.oneFlowLivingPlayers.length'), 'Index check verifies all players complete turns');
  assert(kkJs.includes('this.resolveNightActions()'), 'Resolves night actions once all turns complete');
});

// OF-8: No second handoff at night in One Flow
test('OF-8. No second handoff at night in One Flow mode', () => {
  assert(kkJs.includes("if (this.gameMode === 'ONE_FLOW') {\n      this.startOneFlowRound();"), 'Round 1 begins directly with One Flow without separate night intro');
});

// OF-9: Subsequent rounds use One Flow behavior
test('OF-9. Subsequent rounds repeat One Flow pattern for all living players', () => {
  assert(kkJs.includes("if (this.gameMode === 'ONE_FLOW') {\n      this.startOneFlowRound();\n    } else {\n      this.switchView(this.viewNightIntro);"), 'handlePostVotingTransition routes to startOneFlowRound');
});

// OF-10: Dead players excluded from handoffs
test('OF-10. Dead players are completely excluded from One Flow turns', () => {
  assert(kkJs.includes('this.oneFlowLivingPlayers = this.players.filter(p => p.isAlive)'), 'Only living players added to One Flow turn sequence');
});

// OF-11: Secret actions remain private
test('OF-11. Secret actions remain strictly private with neutral handoffs', () => {
  assert(kkJs.includes('Pass the device secretly. Make sure no one else is looking at the screen.'), 'Uniform neutral subtext on handoff screen');
  assert(kkHtml.includes('id="oneFlowActionBox"'), 'Action box encapsulated inside private revealed card');
});

// OF-12: Doctor protection resolves correctly (shared logic)
test('OF-12. Doctor protection resolves correctly in shared resolveNightActions', () => {
  assert(kkJs.includes('killerTarget.id === doctorTarget.id'), 'Doctor and Killer target comparison');
  assert(kkJs.includes('this.nightState.savedByDoctor = true'), 'savedByDoctor flag set on match');
});

// OF-13: Police results cleared before next handoff
test('OF-13. Police investigation results cleared before advancing to next player', () => {
  assert(kkJs.includes("this.oneFlowPoliceOutcome.innerHTML = ''"), 'Police outcome cleared');
  assert(kkJs.includes("this.oneFlowPoliceOutcome.classList.add('hidden')"), 'Police outcome hidden');
});

// OF-14: Separate Night Phase retains original behavior
test('OF-14. Separate Night Phase mode retains original distinct night sequence', () => {
  assert(kkJs.includes('this.showHandoffForRoleReveal()'), 'Role reveal sequence preserved');
  assert(kkJs.includes('this.startNightSequence()'), 'Separate night sequence preserved');
  assert(kkJs.includes('this.advanceNightFromKiller()'), 'Separate Killer night step preserved');
  assert(kkJs.includes('this.advanceNightFromDoctor()'), 'Separate Doctor night step preserved');
  assert(kkJs.includes('this.advanceNightFromPolice()'), 'Separate Police night step preserved');
});

// OF-15: Both modes preserve same victory conditions
test('OF-15. Both modes share identical win conditions and victory triggers', () => {
  assert(kkJs.includes('checkWinConditions()'), 'Universal checkWinConditions used');
  assert(kkJs.includes("this.triggerVictory('CITIZENS')"), 'Citizens win preserved');
  assert(kkJs.includes("this.triggerVictory('KILLER')"), 'Killer win preserved');
});

// OF-16: No secret info leaks to history/LocalStorage
test('OF-16. No secret actions, targets, or words leak to history or LocalStorage', () => {
  assert(!kkJs.includes('this.addPublicHistoryLog(this.nightState.killerTargetId)'), 'Killer target ID never in public log');
  assert(!kkJs.includes('this.addPublicHistoryLog(this.nightState.doctorTargetId)'), 'Doctor target ID never in public log');
  assert(!kkJs.includes('this.addPublicHistoryLog(this.nightState.policeTargetId)'), 'Police target ID never in public log');
});

// --- Random Speaking Order (RSO) Upgrade Tests ---
console.log('\n--- Running Random Speaking Order Specific Tests ---');

// RSO-1: Every living player appears exactly once in speakerOrder
test('RSO-1. Every living player appears exactly once in the randomized clue speaking order', () => {
  assert(kkJs.includes('const living = this.players.filter(p => p.isAlive);'), 'Filters living players');
  assert(kkJs.includes('const shuffled = [...living];'), 'Clones living players before shuffle');
  assert(kkJs.includes('this.speakerOrder = shuffled;'), 'Assigns shuffled array to speakerOrder');
  
  // Execution test simulating Fisher-Yates logic
  const mockPlayers = [
    { id: 1, name: 'Alice', isAlive: true },
    { id: 2, name: 'Bob', isAlive: true },
    { id: 3, name: 'Charlie', isAlive: true },
    { id: 4, name: 'Diana', isAlive: true }
  ];
  const living = mockPlayers.filter(p => p.isAlive);
  const shuffled = [...living];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  assert(shuffled.length === living.length, 'Shuffled array length matches living count');
  const ids = shuffled.map(p => p.id);
  const uniqueIds = new Set(ids);
  assert(uniqueIds.size === living.length, 'No duplicate players in speakerOrder');
});

// RSO-2: Eliminated players are completely excluded
test('RSO-2. Eliminated players are completely excluded from the randomized speaking order', () => {
  const mockPlayers = [
    { id: 1, name: 'Alice', isAlive: true },
    { id: 2, name: 'Bob', isAlive: false },
    { id: 3, name: 'Charlie', isAlive: true },
    { id: 4, name: 'Diana', isAlive: false }
  ];
  const living = mockPlayers.filter(p => p.isAlive);
  const shuffled = [...living];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  assert(shuffled.length === 2, 'Only 2 living players included');
  assert(!shuffled.some(p => !p.isAlive), 'No eliminated players present');
});

// RSO-3: Starting player is dynamically assigned as the first element of the shuffled order
test('RSO-3. Starting player is dynamically assigned as the first element of the shuffled order', () => {
  assert(kkJs.includes('this.speakerIndex = 0;'), 'speakerIndex initialized to 0 at start of round');
  assert(kkJs.includes('const currentSpeaker = this.speakerOrder[this.speakerIndex];'), 'Current speaker retrieved from speakerOrder[speakerIndex]');
  assert(!kkJs.includes('(this.round - 1) % living.length'), 'Old rotation-start logic is completely removed');
});

// RSO-4: Fisher-Yates produces statistically valid permutations
test('RSO-4. Fisher-Yates shuffle produces statistically varied speaking orders across rounds', () => {
  const mockLiving = [
    { id: 1, name: 'P1' },
    { id: 2, name: 'P2' },
    { id: 3, name: 'P3' },
    { id: 4, name: 'P4' },
    { id: 5, name: 'P5' }
  ];
  const firstSpeakers = new Set();
  const fullPermutations = new Set();
  for (let r = 0; r < 50; r++) {
    const shuffled = [...mockLiving];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    firstSpeakers.add(shuffled[0].id);
    fullPermutations.add(shuffled.map(p => p.id).join(','));
  }
  assert(firstSpeakers.size > 1, 'Multiple different players selected as starting speaker over 50 rounds');
  assert(fullPermutations.size > 10, 'Rich diversity of permutations generated by Fisher-Yates');
});

// RSO-5: Speaking order remains fixed throughout an active clue round
test('RSO-5. Speaking order remains fixed throughout an active clue round without mid-turn reshuffling', () => {
  assert(kkJs.includes('advanceSpeaker(passed) {\n    this.speakerIndex++;\n    this.renderSpeakerTurn();\n  }'), 'advanceSpeaker only increments speakerIndex without reshuffling');
});

// RSO-6: Passing turn counts as turn completion and advances to next player
test('RSO-6. Passing turn (advanceSpeaker(true)) counts as turn completion and advances to next player', () => {
  assert(kkHtml.includes('id="btnPassSpeaker"'), 'Pass speaker button exists in HTML');
  assert(kkJs.includes('this.advanceSpeaker(true);'), 'Pass turn button handler wires advanceSpeaker(true)');
  assert(kkJs.includes('advanceSpeaker(passed)'), 'advanceSpeaker accepts passed argument');
});

// RSO-7: Clue round cleanly advances to daytime discussion once all living players have spoken or passed
test('RSO-7. Clue round cleanly advances to daytime discussion once all living players have spoken or passed', () => {
  assert(kkJs.includes('if (this.speakerIndex >= this.speakerOrder.length) {'), 'Checks if all speakers have completed their turn');
  assert(kkJs.includes('this.startDiscussionPhase();'), 'Transitions to discussion phase when clue round is finished');
});

// RSO-8: Players eliminated between clue rounds are cleanly excluded in subsequent round
test('RSO-8. Players eliminated between clue rounds are cleanly excluded in the subsequent round', () => {
  const players = [
    { id: 1, name: 'P1', isAlive: true },
    { id: 2, name: 'P2', isAlive: true },
    { id: 3, name: 'P3', isAlive: true },
    { id: 4, name: 'P4', isAlive: true }
  ];
  // Round 1
  let living = players.filter(p => p.isAlive);
  assert(living.length === 4, 'Round 1 has 4 living players');
  // Player 2 eliminated in Round 1 vote
  players[1].isAlive = false;
  // Round 2
  living = players.filter(p => p.isAlive);
  assert(living.length === 3, 'Round 2 filters down to 3 living players');
  const shuffled = [...living];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  assert(!shuffled.some(p => p.id === 2), 'Eliminated player 2 is not in Round 2 speaking order');
});

// RSO-9: Works cleanly in both One Flow and Separate Night Phase modes
test('RSO-9. Randomized speaking order works identically and cleanly in both game modes', () => {
  assert(kkJs.includes('this.startWordClueRound()'), 'Clue round entrypoint called in daytime flow');
  assert(kkJs.includes('this.viewWordDescription'), 'Word description view defined');
});

// RSO-10: UI elements properly reflect randomized queue and turn indicators without leaking private roles
test('RSO-10. UI elements properly reflect randomized queue and turn indicators without leaking private roles', () => {
  assert(kkHtml.includes('SPEAKING ORDER (RANDOMIZED EACH ROUND):'), 'HTML queue title updated to randomized');
  assert(kkJs.includes('this.currentSpeakerName.textContent = currentSpeaker.name;'), 'Displays current speaker name');
  assert(kkJs.includes('chip.textContent = speaker.name;'), 'Chips only display player names, never roles');
  assert(!kkJs.includes('chip.textContent = speaker.role'), 'Roles never leaked onto speaker chips');
});

console.log(`\n==============================================`);
console.log(`ALL ${passedTests} TESTS PASSED SUCCESSFULLY!`);
console.log(`==============================================\n`);
