/**
 * PlayRush — Killer Killer
 * Local Pass-and-Play Multiplayer Social Deduction + Secret Word Challenge
 * Pure Vanilla JavaScript & Web Audio API Engine
 */

'use strict';

/* ==========================================================================
   OFFLINE WORD BANK (12 Categories, 180 Recognizable Words)
   Structure designed for easy Bengali/Bangla expansion in future
   ========================================================================== */
const WORD_BANK = [
  {
    category: 'Fruits',
    bnCategory: 'ফল',
    words: [
      { word: 'Mango', bn: 'আম' },
      { word: 'Apple', bn: 'আপেল' },
      { word: 'Banana', bn: 'কলা' },
      { word: 'Strawberry', bn: 'স্ট্রবেরি' },
      { word: 'Pineapple', bn: 'আনারস' },
      { word: 'Orange', bn: 'কমলা' },
      { word: 'Watermelon', bn: 'তরমুজ' },
      { word: 'Grapes', bn: 'আঙ্গুর' },
      { word: 'Papaya', bn: 'পেঁপে' },
      { word: 'Lemon', bn: 'লেবু' },
      { word: 'Coconut', bn: 'নারকেল' },
      { word: 'Cherry', bn: 'চেরি' },
      { word: 'Guava', bn: 'পিয়ারা' },
      { word: 'Peach', bn: 'পিচ' },
      { word: 'Lychee', bn: 'লিচু' }
    ]
  },
  {
    category: 'Animals',
    bnCategory: 'প্রাণী',
    words: [
      { word: 'Tiger', bn: 'বাঘ' },
      { word: 'Elephant', bn: 'হাতি' },
      { word: 'Dolphin', bn: 'ডলফিন' },
      { word: 'Penguin', bn: 'পেঙ্গুইন' },
      { word: 'Kangaroo', bn: 'ক্যাঙ্গারু' },
      { word: 'Panda', bn: 'পান্ডা' },
      { word: 'Eagle', bn: 'ঈগল' },
      { word: 'Wolf', bn: 'নেকড়ে' },
      { word: 'Lion', bn: 'সিংহ' },
      { word: 'Giraffe', bn: 'জিরাফ' },
      { word: 'Rabbit', bn: 'খরগোশ' },
      { word: 'Owl', bn: 'প্যাঁচা' },
      { word: 'Zebra', bn: 'জেব্রা' },
      { word: 'Cheetah', bn: 'চিতা' },
      { word: 'Koala', bn: 'কোয়ালা' }
    ]
  },
  {
    category: 'Countries',
    bnCategory: 'দেশ',
    words: [
      { word: 'Bangladesh', bn: 'বাংলাদেশ' },
      { word: 'Japan', bn: 'জাপান' },
      { word: 'Brazil', bn: 'ব্রাজিল' },
      { word: 'Canada', bn: 'কানাডা' },
      { word: 'Egypt', bn: 'মিশর' },
      { word: 'France', bn: 'ফ্রান্স' },
      { word: 'Australia', bn: 'অস্ট্রেলিয়া' },
      { word: 'Italy', bn: 'ইতালি' },
      { word: 'Germany', bn: 'জার্মানি' },
      { word: 'Mexico', bn: 'মেক্সিকো' },
      { word: 'India', bn: 'ভারত' },
      { word: 'Argentina', bn: 'আর্জেন্টিনা' },
      { word: 'Spain', bn: 'স্পেন' },
      { word: 'Turkey', bn: 'তুরস্ক' },
      { word: 'Norway', bn: 'নরওয়ে' }
    ]
  },
  {
    category: 'Food',
    bnCategory: 'খাবার',
    words: [
      { word: 'Pizza', bn: 'পিজ্জা' },
      { word: 'Burger', bn: 'বার্গার' },
      { word: 'Biryani', bn: 'বিরিয়ানি' },
      { word: 'Pasta', bn: 'পাস্তা' },
      { word: 'Sushi', bn: 'সুশি' },
      { word: 'Tacos', bn: 'টাকোস' },
      { word: 'Ice Cream', bn: 'আইসক্রিম' },
      { word: 'Chocolate', bn: 'চকলেট' },
      { word: 'Pancake', bn: 'প্যানকেক' },
      { word: 'Sandwich', bn: 'স্যান্ডউইচ' },
      { word: 'Noodles', bn: 'নুডুলস' },
      { word: 'Salad', bn: 'সালাদ' },
      { word: 'Samosa', bn: 'সিঙ্গাড়া' },
      { word: 'Curry', bn: 'কারি' },
      { word: 'Waffles', bn: 'ওয়াফেল' }
    ]
  },
  {
    category: 'Sports',
    bnCategory: 'খেলাধুলা',
    words: [
      { word: 'Cricket', bn: 'ক্রিকেট' },
      { word: 'Football', bn: 'ফুটবল' },
      { word: 'Basketball', bn: 'বাস্কেটবল' },
      { word: 'Tennis', bn: 'টেনিস' },
      { word: 'Badminton', bn: 'ব্যাডমিন্টন' },
      { word: 'Swimming', bn: 'সাঁতার' },
      { word: 'Volleyball', bn: 'ভলিবল' },
      { word: 'Boxing', bn: 'বক্সিং' },
      { word: 'Baseball', bn: 'বেসবল' },
      { word: 'Golf', bn: 'গল্ফ' },
      { word: 'Archery', bn: 'তীরন্দাজি' },
      { word: 'Cycling', bn: 'সাইক্লিং' },
      { word: 'Hockey', bn: 'হকি' },
      { word: 'Rugby', bn: 'রাগবি' },
      { word: 'Karate', bn: 'কারাতে' }
    ]
  },
  {
    category: 'Vehicles',
    bnCategory: 'যানবাহন',
    words: [
      { word: 'Helicopter', bn: 'হেলিকপ্টার' },
      { word: 'Submarine', bn: 'সাবমেরিন' },
      { word: 'Motorcycle', bn: 'মোটরসাইকেল' },
      { word: 'Airplane', bn: 'বিমান' },
      { word: 'Train', bn: 'ট্রেন' },
      { word: 'Bicycle', bn: 'সাইকেল' },
      { word: 'Spaceship', bn: 'মহাকাশযান' },
      { word: 'Ambulance', bn: 'অ্যাম্বুলেন্স' },
      { word: 'Tractor', bn: 'ট্রাক্টর' },
      { word: 'Yacht', bn: 'ইয়ট' },
      { word: 'Scooter', bn: 'স্কুটার' },
      { word: 'Truck', bn: 'ট্রাক' },
      { word: 'Speedboat', bn: 'স্পিডবোট' },
      { word: 'Bus', bn: 'বাস' },
      { word: 'Hot Air Balloon', bn: 'বেলুন' }
    ]
  },
  {
    category: 'Technology',
    bnCategory: 'প্রযুক্তি',
    words: [
      { word: 'Smartphone', bn: 'স্মার্টফোন' },
      { word: 'Laptop', bn: 'ল্যাপটপ' },
      { word: 'Drone', bn: 'ড্রোন' },
      { word: 'Robot', bn: 'রোবট' },
      { word: 'Camera', bn: 'ক্যামেরা' },
      { word: 'Headphones', bn: 'হেডফোন' },
      { word: 'Smartwatch', bn: 'স্মার্টওয়াচ' },
      { word: 'Telescope', bn: 'টেলিস্কোপ' },
      { word: 'Satellite', bn: 'স্যাটেলাইট' },
      { word: 'Microphone', bn: 'মাইক্রোফোন' },
      { word: 'Keyboard', bn: 'কীবোর্ড' },
      { word: 'VR Headset', bn: 'ভিআর হেডসেট' },
      { word: 'Smart TV', bn: 'স্মার্ট টিভি' },
      { word: 'Solar Panel', bn: 'সোলার প্যানেল' },
      { word: '3D Printer', bn: 'থ্রিডি প্রিন্টার' }
    ]
  },
  {
    category: 'Household Items',
    bnCategory: 'গৃহস্থালি সামগ্রী',
    words: [
      { word: 'Mirror', bn: 'আয়না' },
      { word: 'Clock', bn: 'ঘড়ি' },
      { word: 'Refrigerator', bn: 'ফ্রিজ' },
      { word: 'Pillow', bn: 'বালিশ' },
      { word: 'Blanket', bn: 'কম্বল' },
      { word: 'Toothbrush', bn: 'টুথব্রাশ' },
      { word: 'Umbrella', bn: 'ছাতা' },
      { word: 'Scissors', bn: 'কাঁচি' },
      { word: 'Flashlight', bn: 'টর্চলাইট' },
      { word: 'Backpack', bn: 'ব্যাগ' },
      { word: 'Teapot', bn: 'কেটলি' },
      { word: 'Candle', bn: 'মোমবাতি' },
      { word: 'Microwave', bn: 'মাইক্রোওয়েভ' },
      { word: 'Iron', bn: 'ইস্ত্রি' },
      { word: 'Fan', bn: 'ফ্যান' }
    ]
  },
  {
    category: 'Professions',
    bnCategory: 'পেশা',
    words: [
      { word: 'Doctor', bn: 'ডাক্তার' },
      { word: 'Pilot', bn: 'পাইলট' },
      { word: 'Astronaut', bn: 'মহাকাশচারী' },
      { word: 'Chef', bn: 'শেফ' },
      { word: 'Firefighter', bn: 'দমকলকর্মী' },
      { word: 'Detective', bn: 'গোয়েন্দা' },
      { word: 'Teacher', bn: 'শিক্ষক' },
      { word: 'Scientist', bn: 'বিজ্ঞানী' },
      { word: 'Artist', bn: 'শিল্পী' },
      { word: 'Photographer', bn: 'ফটোগ্রাফার' },
      { word: 'Musician', bn: 'সংগীতশিল্পী' },
      { word: 'Engineer', bn: 'প্রকৌশলী' },
      { word: 'Architect', bn: 'স্থপতি' },
      { word: 'Lawyer', bn: 'আইনজীবী' },
      { word: 'Archaeologist', bn: 'প্রত্নতাত্ত্বিক' }
    ]
  },
  {
    category: 'Nature',
    bnCategory: 'প্রকৃতি',
    words: [
      { word: 'Volcano', bn: 'আগ্নেয়গিরি' },
      { word: 'Waterfall', bn: 'জলপ্রপাত' },
      { word: 'Rainbow', bn: 'রংধনু' },
      { word: 'Glacier', bn: 'হিমবাহ' },
      { word: 'Desert', bn: 'মরুভূমি' },
      { word: 'Forest', bn: 'জঙ্গল' },
      { word: 'Ocean', bn: 'মহাসাগর' },
      { word: 'Mountain', bn: 'পাহাড়' },
      { word: 'Tornado', bn: 'টর্নেডো' },
      { word: 'Island', bn: 'দ্বীপ' },
      { word: 'Cave', bn: 'গুহা' },
      { word: 'River', bn: 'নদী' },
      { word: 'Canyon', bn: 'গিরিখাত' },
      { word: 'Coral Reef', bn: 'প্রবাল প্রাচীর' },
      { word: 'Aurora', bn: 'মেরুজ্যোতি' }
    ]
  },
  {
    category: 'School',
    bnCategory: 'বিদ্যালয়',
    words: [
      { word: 'Backpack', bn: 'ব্যাগ' },
      { word: 'Microscope', bn: 'অণুবীক্ষণযন্ত্র' },
      { word: 'Calculator', bn: 'ক্যালকুলেটর' },
      { word: 'Globe', bn: 'গ্লোব' },
      { word: 'Blackboard', bn: 'ব্ল্যাকবোর্ড' },
      { word: 'Textbook', bn: 'পাঠ্যবই' },
      { word: 'Compass', bn: 'কম্পাস' },
      { word: 'Notebook', bn: 'খাতা' },
      { word: 'Pencil', bn: 'পেন্সিল' },
      { word: 'Diploma', bn: 'সনদপত্র' },
      { word: 'Ruler', bn: 'স্কেল' },
      { word: 'Bell', bn: 'ঘণ্টা' },
      { word: 'Paintbrush', bn: 'তুলি' },
      { word: 'Eraser', bn: 'রাবার' },
      { word: 'Desk', bn: 'ডেস্ক' }
    ]
  },
  {
    category: 'Movies & Entertainment',
    bnCategory: 'সিনেমা ও বিনোদন',
    words: [
      { word: 'Cinema', bn: 'সিনেমা' },
      { word: 'Popcorn', bn: 'পপকর্ন' },
      { word: 'Superhero', bn: 'সুপারহিরো' },
      { word: 'Director', bn: 'পরিচালক' },
      { word: 'Cartoon', bn: 'কার্টুন' },
      { word: 'Magic', bn: 'যাদু' },
      { word: 'Oscar', bn: 'অস্কার' },
      { word: 'Stage', bn: 'মঞ্চ' },
      { word: 'Ticket', bn: 'টিকেট' },
      { word: 'Stunt', bn: 'স্টান্ট' },
      { word: 'Circus', bn: 'সার্কাস' },
      { word: 'Comic', bn: 'কমিক' },
      { word: 'Soundtrack', bn: 'সাউন্ডট্র্যাক' },
      { word: 'Villain', bn: 'ভিলেন' },
      { word: 'Screenplay', bn: 'চিত্রনাট্য' }
    ]
  }
];

/* ==========================================================================
   SOUND FX ENGINE (Web Audio API Synthesizer)
   ========================================================================== */
class SoundFX {
  constructor() {
    this.isMuted = true;
    this.atmoEnabled = false;
    this.musicEnabled = false;
  }
  playClick() {} playReveal() {} playVote() {} playElimination() {}
  playNight() {} playDay() {} playVictory() {} playWhisper() {}
  playLaughter() {} playScream() {} playDoorCreak() {} playFootsteps() {}
  playKnocks() {} playBell() {} playHeartbeat() {} playBuffer() {}
  synthFallback() {} initContext() {} preloadAssets() {}
  toggleMute() { return true; }
  toggleAtmo() { return false; }
  toggleMusic() { return false; }
  startDrone() {} stopDrone() {} startScheduler() {} stopScheduler() {}
  startHeartbeatLoop() {} stopHeartbeatLoop() {}
  startSetupAmbience() {} stopSetupAmbience() {}
  startSetupMelody() {} stopSetupMelody() {}
  startMusicLayers() {} stopMusicLayers() {}
  setPhase() {} testSound() {}
}

class KillerKillerGame {
  constructor() {
    this.sound = new SoundFX();

    // Default Players for easy party start
    this.playerNames = ['Alex', 'Jordan', 'Sam', 'Taylor'];
    this.editingPlayerIndex = -1;

    // Active Game Secrets & Runtime State (In-Memory ONLY)
    this.sessionName = 'Mystery Match #1';
    this.gameMode = 'ONE_FLOW'; // 'ONE_FLOW' (Default) | 'SEPARATE_NIGHT'
    this.secretWordEnabled = true;
    this.timerEnabled = true;
    this.timerDuration = 120; // seconds

    this.players = [];
    this.currentCategory = '';
    this.currentSecretWord = '';
    this.previousWord = '';

    this.round = 1;
    this.isGameActive = false;

    // One Flow State
    this.oneFlowLivingPlayers = [];
    this.oneFlowPlayerIndex = 0;
    this.selectedOneFlowTargetId = null;

    // Handoff & Turn Sequences
    this.handoffTarget = null;
    this.onHandoffReadyCallback = null;

    this.revealPlayerIndex = 0;
    this.nightStep = 'KILLER'; // 'KILLER', 'DOCTOR', 'POLICE'
    this.nightState = {
      killerTargetId: null,
      doctorTargetId: null,
      policeTargetId: null,
      investigationResult: null,
      eliminatedId: null,
      savedByDoctor: false
    };

    // Daytime Stages
    this.speakerIndex = 0;
    this.speakerOrder = [];
    this.discussionSecondsRemaining = 120;
    this.discussionTimerInterval = null;
    this.isTimerPaused = false;

    // Killer Guess State
    this.killerHasGuessed = false;
    this.killerGuessedCorrectly = false;
    this.killerBonusPoints = 0;
    this.killerWordGuessSubmitted = '';

    // Nominations & Voting
    this.nominatedPlayerIds = new Set();
    this.finalDefenseTimerInterval = null;
    this.finalDefenseSecondsRemaining = 45;

    this.votingPlayerIndex = 0;
    this.votingLivingPlayers = [];
    this.selectedVoteTargetId = null;
    this.votes = {}; // playerId -> vote count
    this.eliminatedByVote = null;
    this.votingTied = false;

    // Public History (Strictly public town events, NEVER secrets)
    this.publicHistory = [];

    // Cache DOM Elements
    this.initDomElements();
    this.bindEvents();
    this.updateSoundIcon();
    this.renderPlayerList();
    this.updateRoleDistributionPreview();
  }

  /* ------------------------------------------------------------------------
     DOM Cache
     ------------------------------------------------------------------------ */
  initDomElements() {
    // Header & Global
    this.btnShowRules = document.getElementById('btnShowRules');
    this.btnShowHistory = document.getElementById('btnShowHistory');
    this.btnNewGameHeader = document.getElementById('btnNewGameHeader');
    this.historyBadge = document.getElementById('historyBadge');

    // Views
    this.viewSetup = document.getElementById('viewSetup');
    this.viewHandoff = document.getElementById('viewHandoff');
    this.viewRoleReveal = document.getElementById('viewRoleReveal');
    this.viewNightIntro = document.getElementById('viewNightIntro');
    this.viewNightKiller = document.getElementById('viewNightKiller');
    this.viewNightDoctor = document.getElementById('viewNightDoctor');
    this.viewNightPolice = document.getElementById('viewNightPolice');
    this.viewPoliceResult = document.getElementById('viewPoliceResult');
    this.viewDayAnnouncement = document.getElementById('viewDayAnnouncement');
    this.viewWordDescription = document.getElementById('viewWordDescription');
    this.viewDiscussion = document.getElementById('viewDiscussion');
    this.viewKillerGuess = document.getElementById('viewKillerGuess');
    this.viewNomination = document.getElementById('viewNomination');
    this.viewFinalDiscussion = document.getElementById('viewFinalDiscussion');
    this.viewVoting = document.getElementById('viewVoting');
    this.viewVoteResults = document.getElementById('viewVoteResults');
    this.viewVictory = document.getElementById('viewVictory');

    // Setup Form
    this.inputGameName = document.getElementById('inputGameName');
    this.optModeOneFlow = document.getElementById('optModeOneFlow');
    this.optModeSeparateNight = document.getElementById('optModeSeparateNight');
    this.toggleSecretWord = document.getElementById('toggleSecretWord');
    this.toggleTimer = document.getElementById('toggleTimer');
    this.timerDurationSelect = document.getElementById('timerDurationSelect');
    this.roleCountTotal = document.getElementById('roleCountTotal');
    this.roleCountKiller = document.getElementById('roleCountKiller');
    this.roleCountPolice = document.getElementById('roleCountPolice');
    this.roleCountDoctor = document.getElementById('roleCountDoctor');
    this.roleCountCitizens = document.getElementById('roleCountCitizens');
    this.playerCountBadge = document.getElementById('playerCountBadge');
    this.inputPlayerName = document.getElementById('inputPlayerName');
    this.btnAddPlayer = document.getElementById('btnAddPlayer');
    this.setupErrorMsg = document.getElementById('setupErrorMsg');
    this.playerListContainer = document.getElementById('playerListContainer');
    this.btnStartGame = document.getElementById('btnStartGame');

    // Handoff Screen
    this.handoffPlayerName = document.getElementById('handoffPlayerName');
    this.handoffTaskSubtext = document.getElementById('handoffTaskSubtext');
    this.btnHandoffReady = document.getElementById('btnHandoffReady');

    // Role Reveal
    this.roleCardShield = document.getElementById('roleCardShield');
    this.btnRevealRole = document.getElementById('btnRevealRole');
    this.roleCardRevealed = document.getElementById('roleCardRevealed');
    this.roleIconContainer = document.getElementById('roleIconContainer');
    this.roleBadgeText = document.getElementById('roleBadgeText');
    this.roleTitleText = document.getElementById('roleTitleText');
    this.roleDescriptionText = document.getElementById('roleDescriptionText');
    this.secretWordBox = document.getElementById('secretWordBox');
    this.secretCategoryLabel = document.getElementById('secretCategoryLabel');
    this.secretWordLabel = document.getElementById('secretWordLabel');
    this.secretWordInstructions = document.getElementById('secretWordInstructions');
    this.oneFlowActionBox = document.getElementById('oneFlowActionBox');
    this.oneFlowActionBadge = document.getElementById('oneFlowActionBadge');
    this.oneFlowActionTitle = document.getElementById('oneFlowActionTitle');
    this.oneFlowActionDesc = document.getElementById('oneFlowActionDesc');
    this.oneFlowTargetList = document.getElementById('oneFlowTargetList');
    this.oneFlowPoliceOutcome = document.getElementById('oneFlowPoliceOutcome');
    this.oneFlowConfirmedBanner = document.getElementById('oneFlowConfirmedBanner');
    this.oneFlowConfirmedText = document.getElementById('oneFlowConfirmedText');
    this.btnConfirmOneFlowAction = document.getElementById('btnConfirmOneFlowAction');
    this.btnHideRole = document.getElementById('btnHideRole');

    // Night Actions
    this.btnStartNightActions = document.getElementById('btnStartNightActions');
    this.killerTargetList = document.getElementById('killerTargetList');
    this.btnConfirmKillerTarget = document.getElementById('btnConfirmKillerTarget');
    this.doctorTargetList = document.getElementById('doctorTargetList');
    this.btnConfirmDoctorTarget = document.getElementById('btnConfirmDoctorTarget');
    this.policeTargetList = document.getElementById('policeTargetList');
    this.btnConfirmPoliceInvestigate = document.getElementById('btnConfirmPoliceInvestigate');
    this.policeResultText = document.getElementById('policeResultText');
    this.btnDismissPoliceResult = document.getElementById('btnDismissPoliceResult');

    // Day Announcement
    this.dayAnnouncementRound = document.getElementById('dayAnnouncementRound');
    this.dayNightOutcomeMessage = document.getElementById('dayNightOutcomeMessage');
    this.dayLivingList = document.getElementById('dayLivingList');
    this.dayEliminatedList = document.getElementById('dayEliminatedList');
    this.btnProceedToClues = document.getElementById('btnProceedToClues');

    // Word Description
    this.wordClueRoundTag = document.getElementById('wordClueRoundTag');
    this.currentSpeakerName = document.getElementById('currentSpeakerName');
    this.speakerTurnProgress = document.getElementById('speakerTurnProgress');
    this.btnNextSpeaker = document.getElementById('btnNextSpeaker');
    this.btnPassSpeaker = document.getElementById('btnPassSpeaker');
    this.speakerOrderList = document.getElementById('speakerOrderList');
    this.btnSkipCluesToDiscussion = document.getElementById('btnSkipCluesToDiscussion');

    // Discussion
    this.discussionTimerDisplay = document.getElementById('discussionTimerDisplay');
    this.btnTimerToggle = document.getElementById('btnTimerToggle');
    this.btnTimerAdd30 = document.getElementById('btnTimerAdd30');
    this.btnTimerReset = document.getElementById('btnTimerReset');
    this.btnProceedToNominations = document.getElementById('btnProceedToNominations');
    this.btnProceedToKillerGuess = document.getElementById('btnProceedToKillerGuess');

    // Killer Guess
    this.killerGuessCategory = document.getElementById('killerGuessCategory');
    this.inputKillerWordGuess = document.getElementById('inputKillerWordGuess');
    this.btnSubmitKillerGuess = document.getElementById('btnSubmitKillerGuess');
    this.btnSkipKillerGuess = document.getElementById('btnSkipKillerGuess');
    this.killerGuessFeedback = document.getElementById('killerGuessFeedback');
    this.btnProceedAfterKillerGuess = document.getElementById('btnProceedAfterKillerGuess');

    // Nominations & Final Defense
    this.nominationGrid = document.getElementById('nominationGrid');
    this.nominatedSummaryText = document.getElementById('nominatedSummaryText');
    this.btnProceedToFinalDiscussion = document.getElementById('btnProceedToFinalDiscussion');
    this.btnSkipToVoting = document.getElementById('btnSkipToVoting');
    this.finalNominatedDisplay = document.getElementById('finalNominatedDisplay');
    this.finalDiscussionTimerDisplay = document.getElementById('finalDiscussionTimerDisplay');
    this.btnStartVoting = document.getElementById('btnStartVoting');

    // Voting & Results
    this.voterPromptName = document.getElementById('voterPromptName');
    this.votingCandidatesGrid = document.getElementById('votingCandidatesGrid');
    this.btnConfirmVote = document.getElementById('btnConfirmVote');
    this.btnAbstainVote = document.getElementById('btnAbstainVote');
    this.voteResultsRound = document.getElementById('voteResultsRound');
    this.voteTallyContainer = document.getElementById('voteTallyContainer');
    this.voteOutcomeAnnouncement = document.getElementById('voteOutcomeAnnouncement');
    this.eliminatedRoleRevealBanner = document.getElementById('eliminatedRoleRevealBanner');
    this.btnProceedAfterVoting = document.getElementById('btnProceedAfterVoting');

    // Victory Screen
    this.victoryBannerTitle = document.getElementById('victoryBannerTitle');
    this.victorySubtitle = document.getElementById('victorySubtitle');
    this.victoryWinningTeam = document.getElementById('victoryWinningTeam');
    this.victoryRoundsCount = document.getElementById('victoryRoundsCount');
    this.victorySecretCategory = document.getElementById('victorySecretCategory');
    this.victorySecretWord = document.getElementById('victorySecretWord');
    this.victoryKillerGuessResult = document.getElementById('victoryKillerGuessResult');
    this.victoryKillerBonusPoints = document.getElementById('victoryKillerBonusPoints');
    this.victoryRosterTableBody = document.getElementById('victoryRosterTableBody');
    this.btnPlayAgainSame = document.getElementById('btnPlayAgainSame');
    this.btnNewGameSetup = document.getElementById('btnNewGameSetup');

    // Modals
    this.modalHistory = document.getElementById('modalHistory');
    this.btnCloseHistoryModal = document.getElementById('btnCloseHistoryModal');
    this.historyLogList = document.getElementById('historyLogList');
    this.modalRules = document.getElementById('modalRules');
    this.btnCloseRulesModal = document.getElementById('btnCloseRulesModal');
    this.modalConfirmQuit = document.getElementById('modalConfirmQuit');
    this.btnCancelQuit = document.getElementById('btnCancelQuit');
    this.btnCancelQuit2 = document.getElementById('btnCancelQuit2');
    this.btnConfirmQuit = document.getElementById('btnConfirmQuit');
  }

  /* ------------------------------------------------------------------------
     Screen Switcher Helper
     ------------------------------------------------------------------------ */
  switchView(activeView) {
    const allViews = [
      this.viewSetup,
      this.viewHandoff,
      this.viewRoleReveal,
      this.viewNightIntro,
      this.viewNightKiller,
      this.viewNightDoctor,
      this.viewNightPolice,
      this.viewPoliceResult,
      this.viewDayAnnouncement,
      this.viewWordDescription,
      this.viewDiscussion,
      this.viewKillerGuess,
      this.viewNomination,
      this.viewFinalDiscussion,
      this.viewVoting,
      this.viewVoteResults,
      this.viewVictory
    ];

    allViews.forEach(v => {
      if (v) {
        v.classList.add('hidden');
        v.classList.remove('active-view');
      }
    });

    if (activeView) {
      activeView.classList.remove('hidden');
      activeView.classList.add('active-view');
      window.scrollTo(0, 0);
      if (this.sound && typeof this.sound.setPhase === 'function') {
        this.sound.setPhase(activeView.id);
      }
    }
  }

  /* ------------------------------------------------------------------------
     Event Bindings
     ------------------------------------------------------------------------ */
  bindEvents() {

    // Modals
    this.btnShowRules.addEventListener('click', () => {
      this.sound.playClick();
      this.modalRules.classList.remove('hidden');
    });
    this.btnCloseRulesModal.addEventListener('click', () => {
      this.sound.playClick();
      this.modalRules.classList.add('hidden');
    });

    this.btnShowHistory.addEventListener('click', () => {
      this.sound.playClick();
      this.renderHistoryModal();
      this.modalHistory.classList.remove('hidden');
    });
    this.btnCloseHistoryModal.addEventListener('click', () => {
      this.sound.playClick();
      this.modalHistory.classList.add('hidden');
    });

    this.btnNewGameHeader.addEventListener('click', () => {
      this.sound.playClick();
      if (this.isGameActive) {
        this.modalConfirmQuit.classList.remove('hidden');
      } else {
        this.switchView(this.viewSetup);
      }
    });

    const closeQuitModal = () => {
      this.sound.playClick();
      this.modalConfirmQuit.classList.add('hidden');
    };
    this.btnCancelQuit.addEventListener('click', closeQuitModal);
    if (this.btnCancelQuit2) this.btnCancelQuit2.addEventListener('click', closeQuitModal);

    this.btnConfirmQuit.addEventListener('click', () => {
      this.sound.playClick();
      this.modalConfirmQuit.classList.add('hidden');
      this.quitToSetup();
    });

    // Game Mode Selection
    if (this.optModeOneFlow) {
      this.optModeOneFlow.addEventListener('click', () => {
        this.setGameMode('ONE_FLOW');
      });
      this.optModeOneFlow.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.setGameMode('ONE_FLOW');
        }
      });
    }

    if (this.optModeSeparateNight) {
      this.optModeSeparateNight.addEventListener('click', () => {
        this.setGameMode('SEPARATE_NIGHT');
      });
      this.optModeSeparateNight.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.setGameMode('SEPARATE_NIGHT');
        }
      });
    }

    // Setup Actions
    this.btnAddPlayer.addEventListener('click', () => this.handleAddPlayer());
    this.inputPlayerName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleAddPlayer();
      }
    });


    this.toggleSecretWord.addEventListener('change', () => {
      this.sound.playClick();
      this.secretWordEnabled = this.toggleSecretWord.checked;
    });

    this.toggleTimer.addEventListener('change', () => {
      this.sound.playClick();
      this.timerEnabled = this.toggleTimer.checked;
    });

    this.timerDurationSelect.addEventListener('change', () => {
      this.timerDuration = parseInt(this.timerDurationSelect.value, 10) || 120;
    });

    this.btnStartGame.addEventListener('click', () => this.startMatch());

    // Handoff Ready
    this.btnHandoffReady.addEventListener('click', () => {
      this.sound.playClick();
      if (typeof this.onHandoffReadyCallback === 'function') {
        const cb = this.onHandoffReadyCallback;
        this.onHandoffReadyCallback = null;
        cb();
      }
    });

    // Role Reveal
    this.btnRevealRole.addEventListener('click', () => {
      this.sound.playReveal();
      this.roleCardShield.classList.add('hidden');
      this.roleCardRevealed.classList.remove('hidden');
    });

    // One Flow Action Confirmation
    if (this.btnConfirmOneFlowAction) {
      this.btnConfirmOneFlowAction.addEventListener('click', () => {
        this.sound.playClick();
        this.confirmOneFlowAction();
      });
    }

    this.btnHideRole.addEventListener('click', () => {
      this.sound.playClick();
      this.roleCardRevealed.classList.add('hidden');
      this.roleCardShield.classList.remove('hidden');
      if (this.gameMode === 'ONE_FLOW') {
        this.advanceOneFlowPlayer();
      } else {
        this.advanceRoleRevealSequence();
      }
    });

    // Night Phase
    this.btnStartNightActions.addEventListener('click', () => {
      this.sound.playNight();
      this.startNightSequence();
    });

    this.btnConfirmKillerTarget.addEventListener('click', () => {
      this.sound.playClick();
      this.advanceNightFromKiller();
    });

    this.btnConfirmDoctorTarget.addEventListener('click', () => {
      this.sound.playClick();
      this.advanceNightFromDoctor();
    });

    this.btnConfirmPoliceInvestigate.addEventListener('click', () => {
      this.sound.playClick();
      this.advanceNightFromPolice();
    });

    this.btnDismissPoliceResult.addEventListener('click', () => {
      this.sound.playClick();
      this.switchView(this.viewNightIntro);
      this.resolveNightActions();
    });

    // Day Announcement
    this.btnProceedToClues.addEventListener('click', () => {
      this.sound.playClick();
      if (this.secretWordEnabled) {
        this.startWordClueRound();
      } else {
        this.startDiscussionPhase();
      }
    });

    // Word Description
    this.btnNextSpeaker.addEventListener('click', () => {
      this.sound.playClick();
      this.advanceSpeaker(false);
    });

    this.btnPassSpeaker.addEventListener('click', () => {
      this.sound.playClick();
      this.advanceSpeaker(true);
    });

    this.btnSkipCluesToDiscussion.addEventListener('click', () => {
      this.sound.playClick();
      this.startDiscussionPhase();
    });

    // Discussion Controls
    this.btnTimerToggle.addEventListener('click', () => {
      this.sound.playClick();
      this.toggleDiscussionTimer();
    });

    this.btnTimerAdd30.addEventListener('click', () => {
      this.sound.playClick();
      this.discussionSecondsRemaining += 30;
      this.updateTimerDisplay();
    });

    this.btnTimerReset.addEventListener('click', () => {
      this.sound.playClick();
      this.discussionSecondsRemaining = this.timerDuration;
      this.updateTimerDisplay();
    });

    this.btnProceedToNominations.addEventListener('click', () => {
      this.sound.playClick();
      this.clearIntervals();
      this.startNominationPhase();
    });

    this.btnProceedToKillerGuess.addEventListener('click', () => {
      this.sound.playClick();
      this.clearIntervals();
      this.promptKillerGuessHandoff();
    });

    // Killer Guess
    this.btnSubmitKillerGuess.addEventListener('click', () => {
      this.handleKillerWordGuessSubmit();
    });

    this.btnSkipKillerGuess.addEventListener('click', () => {
      this.sound.playClick();
      this.killerHasGuessed = true;
      this.startNominationPhase();
    });

    this.btnProceedAfterKillerGuess.addEventListener('click', () => {
      this.sound.playClick();
      this.startNominationPhase();
    });

    // Nomination Actions
    this.btnProceedToFinalDiscussion.addEventListener('click', () => {
      this.sound.playClick();
      this.startFinalDiscussionPhase();
    });

    this.btnSkipToVoting.addEventListener('click', () => {
      this.sound.playClick();
      this.startVotingPhase();
    });

    // Final Defense
    this.btnStartVoting.addEventListener('click', () => {
      this.sound.playClick();
      this.clearIntervals();
      this.startVotingPhase();
    });

    // Voting
    this.btnConfirmVote.addEventListener('click', () => {
      this.sound.playClick();
      this.recordVoteAndAdvance(this.selectedVoteTargetId);
    });

    this.btnAbstainVote.addEventListener('click', () => {
      this.sound.playClick();
      this.recordVoteAndAdvance(null);
    });

    this.btnProceedAfterVoting.addEventListener('click', () => {
      this.sound.playClick();
      this.handlePostVotingTransition();
    });

    // Victory Actions
    this.btnPlayAgainSame.addEventListener('click', () => {
      this.sound.playClick();
      this.startMatch();
    });

    this.btnNewGameSetup.addEventListener('click', () => {
      this.sound.playClick();
      this.quitToSetup();
    });

    // Warn on accidental tab close / navigation during game
    window.addEventListener('beforeunload', (e) => {
      if (this.isGameActive) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  updateSoundIcon() {}

  /* ------------------------------------------------------------------------
     Player Manager (Setup Screen)
     ------------------------------------------------------------------------ */
  handleAddPlayer() {
    this.sound.playClick();
    this.hideSetupError();

    const raw = (this.inputPlayerName.value || '').trim();
    if (!raw) {
      this.showSetupError('Player name cannot be empty.');
      return;
    }
    if (raw.length > 16) {
      this.showSetupError('Player name must be 16 characters or less.');
      return;
    }
    if (this.playerNames.some(n => n.toLowerCase() === raw.toLowerCase())) {
      this.showSetupError(`A player named "${raw}" is already added. Names must be unique.`);
      return;
    }
    if (this.playerNames.length >= 12) {
      this.showSetupError('Maximum 12 players allowed.');
      return;
    }

    this.playerNames.push(raw);
    this.inputPlayerName.value = '';
    this.renderPlayerList();
    this.updateRoleDistributionPreview();
  }

  removePlayer(idx) {
    this.sound.playClick();
    this.hideSetupError();
    if (this.playerNames.length <= 4) {
      this.showSetupError('Minimum 4 players required to play.');
      return;
    }
    this.playerNames.splice(idx, 1);
    this.renderPlayerList();
    this.updateRoleDistributionPreview();
  }

  startEditPlayer(idx) {
    this.editingPlayerIndex = idx;
    this.renderPlayerList();
  }

  saveEditPlayer(idx, newName) {
    const raw = (newName || '').trim();
    if (!raw) {
      this.showSetupError('Player name cannot be empty.');
      return;
    }
    const isDuplicate = this.playerNames.some((n, i) => i !== idx && n.toLowerCase() === raw.toLowerCase());
    if (isDuplicate) {
      this.showSetupError(`Another player is already named "${raw}".`);
      return;
    }
    this.playerNames[idx] = raw;
    this.editingPlayerIndex = -1;
    this.renderPlayerList();
  }

  showSetupError(msg) {
    this.setupErrorMsg.textContent = msg;
    this.setupErrorMsg.classList.remove('hidden');
  }

  hideSetupError() {
    this.setupErrorMsg.textContent = '';
    this.setupErrorMsg.classList.add('hidden');
  }

  renderPlayerList() {
    this.playerListContainer.innerHTML = '';
    const total = this.playerNames.length;
    this.playerCountBadge.textContent = `${total} / 12`;
    this.roleCountTotal.textContent = String(total);
    this.btnStartGame.disabled = total < 4 || total > 12;

    this.playerNames.forEach((name, idx) => {
      const row = document.createElement('div');
      row.className = 'player-row-item';

      const isEditing = this.editingPlayerIndex === idx;

      row.innerHTML = `
        <div class="player-info-left">
          <span class="player-avatar-num">${idx + 1}</span>
          ${
            isEditing
              ? `<input type="text" class="player-name-input-edit" id="editPlayerInput_${idx}" value="${this.escapeHtml(name)}" maxlength="16">`
              : `<span class="player-name-text">${this.escapeHtml(name)}</span>`
          }
        </div>
        <div class="player-row-actions">
          ${
            isEditing
              ? `<button type="button" class="btn-icon-subtle" title="Save name" id="btnSaveEdit_${idx}">
                   <svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
                 </button>`
              : `<button type="button" class="btn-icon-subtle" title="Edit name" id="btnEditPlayer_${idx}">
                   <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                 </button>`
          }
          <button type="button" class="btn-icon-subtle delete" title="Remove player" id="btnRemovePlayer_${idx}">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      `;

      this.playerListContainer.appendChild(row);

      // Event Listeners
      if (isEditing) {
        const editInput = document.getElementById(`editPlayerInput_${idx}`);
        const saveBtn = document.getElementById(`btnSaveEdit_${idx}`);
        editInput.focus();
        editInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this.saveEditPlayer(idx, editInput.value);
        });
        saveBtn.addEventListener('click', () => this.saveEditPlayer(idx, editInput.value));
      } else {
        const editBtn = document.getElementById(`btnEditPlayer_${idx}`);
        editBtn.addEventListener('click', () => this.startEditPlayer(idx));
      }

      const removeBtn = document.getElementById(`btnRemovePlayer_${idx}`);
      removeBtn.addEventListener('click', () => this.removePlayer(idx));
    });
  }

  updateRoleDistributionPreview() {
    const total = this.playerNames.length;
    const killerCount = 1;
    const policeCount = 1;
    const doctorCount = 1;
    const citizenCount = Math.max(1, total - (killerCount + policeCount + doctorCount));

    this.roleCountKiller.textContent = String(killerCount);
    this.roleCountPolice.textContent = String(policeCount);
    this.roleCountDoctor.textContent = String(doctorCount);
    this.roleCountCitizens.textContent = String(citizenCount);
  }

  /* ------------------------------------------------------------------------
     Match Initialization & Randomization
     ------------------------------------------------------------------------ */
  startMatch() {
    if (this.playerNames.length < 4 || this.playerNames.length > 12) {
      this.showSetupError('Please ensure 4 to 12 players are added.');
      return;
    }

    this.sound.playClick();
    this.isGameActive = true;
    this.round = 1;
    this.sessionName = (this.inputGameName.value || '').trim() || 'Mystery Match #1';
    this.secretWordEnabled = this.toggleSecretWord.checked;
    this.timerEnabled = this.toggleTimer.checked;
    this.timerDuration = parseInt(this.timerDurationSelect.value, 10) || 120;

    // Reset Killer Guess
    this.killerHasGuessed = false;
    this.killerGuessedCorrectly = false;
    this.killerBonusPoints = 0;
    this.killerWordGuessSubmitted = '';

    // Pick Secret Word and Category
    this.pickRandomSecretWord();

    // Assign Roles using Fisher-Yates
    this.assignRandomRoles();

    // Reset Public History
    this.publicHistory = [];
    this.addPublicHistoryLog(`Game started: "${this.sessionName}" with ${this.players.length} players.`);
    this.addPublicHistoryLog(`Game Mode: ${this.gameMode === 'ONE_FLOW' ? 'One Flow Mode' : 'Separate Night Phase'}.`);
    this.addPublicHistoryLog(`Secret Word Challenge: ${this.secretWordEnabled ? 'ENABLED' : 'DISABLED'}.`);

    // Begin Game Sequence depending on Mode
    if (this.gameMode === 'ONE_FLOW') {
      this.startOneFlowRound();
    } else {
      this.revealPlayerIndex = 0;
      this.showHandoffForRoleReveal();
    }
  }

  pickRandomSecretWord() {
    // Select a random category
    const availableCategories = WORD_BANK.filter(c => c.words && c.words.length > 0);
    const catObj = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    this.currentCategory = catObj.category;

    // Pick a word (avoiding previousWord if possible)
    const validWords = catObj.words.filter(w => w.word !== this.previousWord);
    const chosen = validWords.length > 0
      ? validWords[Math.floor(Math.random() * validWords.length)]
      : catObj.words[Math.floor(Math.random() * catObj.words.length)];

    this.currentSecretWord = chosen.word;
    this.previousWord = chosen.word;
  }

  assignRandomRoles() {
    const total = this.playerNames.length;
    const roleDeck = ['KILLER', 'POLICE', 'DOCTOR'];
    while (roleDeck.length < total) {
      roleDeck.push('CITIZEN');
    }

    // Fisher-Yates Shuffle
    for (let i = roleDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roleDeck[i], roleDeck[j]] = [roleDeck[j], roleDeck[i]];
    }

    this.players = this.playerNames.map((name, idx) => ({
      id: idx,
      name,
      role: roleDeck[idx],
      isAlive: true,
      eliminatedInRound: null
    }));

    // Shuffle player order so turn sequence differs every match
    for (let i = this.players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.players[i], this.players[j]] = [this.players[j], this.players[i]];
    }
  }

  /* ------------------------------------------------------------------------
     Private Handoff Controller
     ------------------------------------------------------------------------ */
  requestHandoff(playerName, subtext, onReady) {
    this.handoffPlayerName.textContent = playerName;
    this.handoffTaskSubtext.textContent = subtext || 'Make sure no one else is looking at the screen.';
    this.onHandoffReadyCallback = onReady;
    this.switchView(this.viewHandoff);
  }

  setGameMode(mode) {
    if (mode !== 'ONE_FLOW' && mode !== 'SEPARATE_NIGHT') return;
    this.gameMode = mode;
    this.sound.playClick();

    if (this.optModeOneFlow && this.optModeSeparateNight) {
      const isOneFlow = mode === 'ONE_FLOW';
      this.optModeOneFlow.classList.toggle('selected', isOneFlow);
      this.optModeOneFlow.setAttribute('aria-checked', isOneFlow ? 'true' : 'false');
      this.optModeSeparateNight.classList.toggle('selected', !isOneFlow);
      this.optModeSeparateNight.setAttribute('aria-checked', !isOneFlow ? 'true' : 'false');
    }
  }

  /* ------------------------------------------------------------------------
     PHASE 2 & 3: ROLE & SECRET WORD REVEAL
     ------------------------------------------------------------------------ */
  showHandoffForRoleReveal() {
    if (this.revealPlayerIndex >= this.players.length) {
      // All players have reviewed their role. Proceed to Night 1!
      this.sound.playNight();
      this.switchView(this.viewNightIntro);
      return;
    }

    const player = this.players[this.revealPlayerIndex];
    this.requestHandoff(
      player.name,
      'Pass the device secretly to reveal their assigned role and secret word.',
      () => this.showRoleRevealScreen(player)
    );
  }

  populateRoleCardData(player) {
    // Clean previous classes
    this.roleCardRevealed.className = 'role-card-revealed hidden';

    if (player.role === 'KILLER') {
      this.roleCardRevealed.classList.add('theme-killer');
      this.roleIconContainer.innerHTML = `<svg viewBox="0 0 24 24" fill="#c6283d"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
      this.roleBadgeText.textContent = 'SECRET ENEMY';
      this.roleTitleText.textContent = 'KILLER';
      this.roleDescriptionText.textContent =
        'Eliminate citizens secretly at night. During the daytime Secret Word Challenge, you only know the category — listen carefully and bluff your descriptions!';

      if (this.secretWordEnabled) {
        this.secretWordBox.classList.remove('hidden');
        this.secretCategoryLabel.textContent = this.currentCategory.toUpperCase();
        this.secretWordLabel.textContent = 'UNKNOWN (BLUFF!)';
        this.secretWordLabel.className = 'data-val-word bluff-warning';
        this.secretWordInstructions.textContent =
          'You do NOT know the exact word! Listen to other players during daytime and give convincing clues to avoid detection.';
      } else {
        this.secretWordBox.classList.add('hidden');
      }
    } else if (player.role === 'POLICE') {
      this.roleCardRevealed.classList.add('theme-police');
      this.roleIconContainer.innerHTML = `<svg viewBox="0 0 24 24" fill="#779b83"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>`;
      this.roleBadgeText.textContent = 'INVESTIGATOR';
      this.roleTitleText.textContent = 'POLICE';
      this.roleDescriptionText.textContent =
        'Investigate one suspect secretly each night to discover if they are the Killer. Guide the town without exposing yourself too soon.';

      if (this.secretWordEnabled) {
        this.secretWordBox.classList.remove('hidden');
        this.secretCategoryLabel.textContent = this.currentCategory.toUpperCase();
        this.secretWordLabel.textContent = this.currentSecretWord.toUpperCase();
        this.secretWordLabel.className = 'data-val-word';
        this.secretWordInstructions.textContent =
          'You know the secret word! Describe it in daytime without saying the word itself.';
      } else {
        this.secretWordBox.classList.add('hidden');
      }
    } else if (player.role === 'DOCTOR') {
      this.roleCardRevealed.classList.add('theme-doctor');
      this.roleIconContainer.innerHTML = `<svg viewBox="0 0 24 24" fill="#66849c"><path d="M19 10.5h-5.5V5c0-.55-.45-1-1-1h-1c-.55 0-1 .45-1 1v5.5H5c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h5.5V19c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-5.5H19c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1z"/></svg>`;
      this.roleBadgeText.textContent = 'PROTECTOR';
      this.roleTitleText.textContent = 'DOCTOR';
      this.roleDescriptionText.textContent =
        'Protect one player each night from the Killer. If your target matches the Killer\'s target, nobody dies! You may protect yourself.';

      if (this.secretWordEnabled) {
        this.secretWordBox.classList.remove('hidden');
        this.secretCategoryLabel.textContent = this.currentCategory.toUpperCase();
        this.secretWordLabel.textContent = this.currentSecretWord.toUpperCase();
        this.secretWordLabel.className = 'data-val-word';
        this.secretWordInstructions.textContent =
          'You know the secret word! Describe it in daytime without saying the word itself.';
      } else {
        this.secretWordBox.classList.add('hidden');
      }
    } else {
      // CITIZEN
      this.roleCardRevealed.classList.add('theme-citizen');
      this.roleIconContainer.innerHTML = `<svg viewBox="0 0 24 24" fill="#d9d9d9"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
      this.roleBadgeText.textContent = 'INNOCENT CITIZEN';
      this.roleTitleText.textContent = 'CITIZEN';
      this.roleDescriptionText.textContent =
        'Listen carefully to everyone\'s descriptions during the daytime Secret Word Challenge. Spot whoever is hesitating or bluffing, and vote them out!';

      if (this.secretWordEnabled) {
        this.secretWordBox.classList.remove('hidden');
        this.secretCategoryLabel.textContent = this.currentCategory.toUpperCase();
        this.secretWordLabel.textContent = this.currentSecretWord.toUpperCase();
        this.secretWordLabel.className = 'data-val-word';
        this.secretWordInstructions.textContent =
          'You know the secret word! Describe it in daytime without saying the word itself.';
      } else {
        this.secretWordBox.classList.add('hidden');
      }
    }
  }

  showRoleRevealScreen(player) {
    if (this.revealPlayerGreeting) this.revealPlayerGreeting.textContent = `Hello, ${player.name}`;
    this.roleCardShield.classList.remove('hidden');
    this.roleCardRevealed.classList.add('hidden');
    this.oneFlowActionBox.classList.add('hidden');
    this.btnHideRole.classList.remove('hidden');

    this.populateRoleCardData(player);
    this.switchView(this.viewRoleReveal);
  }

  advanceRoleRevealSequence() {
    this.revealPlayerIndex++;
    this.showHandoffForRoleReveal();
  }

  /* ------------------------------------------------------------------------
     ONE FLOW MODE SEQUENCE
     ------------------------------------------------------------------------ */
  startOneFlowRound() {
    this.nightState = {
      killerTargetId: null,
      doctorTargetId: null,
      policeTargetId: null,
      investigationResult: null,
      eliminatedId: null,
      savedByDoctor: false
    };

    // Filter living players only (dead players excluded completely)
    this.oneFlowLivingPlayers = this.players.filter(p => p.isAlive);
    this.oneFlowPlayerIndex = 0;
    this.promptNextOneFlowPlayer();
  }

  promptNextOneFlowPlayer() {
    if (this.oneFlowPlayerIndex >= this.oneFlowLivingPlayers.length) {
      // All living players completed their turns!
      // Resolve night actions and show Morning Report
      this.resolveNightActions();
      return;
    }

    const player = this.oneFlowLivingPlayers[this.oneFlowPlayerIndex];
    // Exact neutral handoff text for every player (never leaks role or action presence)
    const subtext = this.round === 1
      ? 'Pass the device secretly. Make sure no one else is looking at the screen.'
      : 'Pass the device secretly. Make sure no one else is looking at the screen.';

    this.requestHandoff(
      player.name,
      subtext,
      () => this.showOneFlowPlayerScreen(player)
    );
  }

  showOneFlowPlayerScreen(player) {
    if (this.revealPlayerGreeting) this.revealPlayerGreeting.textContent = `Hello, ${player.name}`;
    this.roleCardShield.classList.remove('hidden');
    this.roleCardRevealed.classList.add('hidden');

    // Populate role and secret word card
    this.populateRoleCardData(player);

    // Setup One Flow Action Box
    this.selectedOneFlowTargetId = null;
    this.oneFlowPoliceOutcome.classList.add('hidden');
    this.oneFlowPoliceOutcome.innerHTML = '';
    this.oneFlowConfirmedBanner.classList.add('hidden');
    this.oneFlowTargetList.classList.remove('hidden');
    this.oneFlowTargetList.innerHTML = '';
    this.btnConfirmOneFlowAction.disabled = true;

    if (player.role === 'KILLER') {
      this.oneFlowActionBox.classList.remove('hidden');
      this.oneFlowActionBadge.textContent = 'KILLER NIGHT ACTION';
      this.oneFlowActionTitle.textContent = 'Choose your target to eliminate:';
      this.oneFlowActionDesc.textContent = 'Select one living player. You cannot target yourself.';

      // Killer can target living players except themselves
      const livingTargets = this.players.filter(p => p.isAlive && p.id !== player.id);
      this.renderOneFlowTargets(livingTargets, false, player.id);

      this.btnConfirmOneFlowAction.textContent = 'CONFIRM TARGET';
      this.btnConfirmOneFlowAction.classList.remove('hidden');
      this.btnHideRole.classList.add('hidden');
    } else if (player.role === 'DOCTOR') {
      this.oneFlowActionBox.classList.remove('hidden');
      this.oneFlowActionBadge.textContent = 'DOCTOR NIGHT ACTION';
      this.oneFlowActionTitle.textContent = 'Choose one player to protect tonight:';
      this.oneFlowActionDesc.textContent = "If the Killer targets this player, they will survive! You may protect yourself.";

      // Doctor can protect any living player including themselves
      const livingTargets = this.players.filter(p => p.isAlive);
      this.renderOneFlowTargets(livingTargets, true, player.id);

      this.btnConfirmOneFlowAction.textContent = 'CONFIRM PROTECTION';
      this.btnConfirmOneFlowAction.classList.remove('hidden');
      this.btnHideRole.classList.add('hidden');
    } else if (player.role === 'POLICE') {
      this.oneFlowActionBox.classList.remove('hidden');
      this.oneFlowActionBadge.textContent = 'POLICE NIGHT ACTION';
      this.oneFlowActionTitle.textContent = 'Choose one suspect to secretly investigate:';
      this.oneFlowActionDesc.textContent = 'You will immediately discover if this player is the Killer.';

      // Police can investigate any living player except themselves
      const livingTargets = this.players.filter(p => p.isAlive && p.id !== player.id);
      this.renderOneFlowTargets(livingTargets, false, player.id);

      this.btnConfirmOneFlowAction.textContent = 'INVESTIGATE SUSPECT';
      this.btnConfirmOneFlowAction.classList.remove('hidden');
      this.btnHideRole.classList.add('hidden');
    } else {
      // CITIZEN - No secret night action required
      this.oneFlowActionBox.classList.add('hidden');
      this.btnConfirmOneFlowAction.classList.add('hidden');
      this.btnHideRole.classList.remove('hidden');
    }

    this.switchView(this.viewRoleReveal);
  }

  renderOneFlowTargets(targets, allowSelf, selfId) {
    this.oneFlowTargetList.innerHTML = '';
    targets.forEach(target => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'target-card-btn';
      const isSelf = allowSelf && target.id === selfId;
      btn.innerHTML = `
        <span class="target-avatar-circle">${target.id + 1}</span>
        <span class="target-player-label">${this.escapeHtml(target.name)}${isSelf ? ' (You)' : ''}</span>
      `;

      btn.addEventListener('click', () => {
        this.sound.playClick();
        this.oneFlowTargetList.querySelectorAll('.target-card-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedOneFlowTargetId = target.id;
        this.btnConfirmOneFlowAction.disabled = false;
      });

      this.oneFlowTargetList.appendChild(btn);
    });
  }

  confirmOneFlowAction() {
    const player = this.oneFlowLivingPlayers[this.oneFlowPlayerIndex];
    if (!player || this.selectedOneFlowTargetId === null) return;

    if (player.role === 'KILLER') {
      this.nightState.killerTargetId = this.selectedOneFlowTargetId;
      this.oneFlowTargetList.classList.add('hidden');
      this.btnConfirmOneFlowAction.classList.add('hidden');
      this.oneFlowConfirmedText.textContent = 'Target confirmed & locked for tonight.';
      this.oneFlowConfirmedBanner.classList.remove('hidden');
      this.btnHideRole.classList.remove('hidden');
    } else if (player.role === 'DOCTOR') {
      this.nightState.doctorTargetId = this.selectedOneFlowTargetId;
      this.oneFlowTargetList.classList.add('hidden');
      this.btnConfirmOneFlowAction.classList.add('hidden');
      this.oneFlowConfirmedText.textContent = 'Protection confirmed & locked for tonight.';
      this.oneFlowConfirmedBanner.classList.remove('hidden');
      this.btnHideRole.classList.remove('hidden');
    } else if (player.role === 'POLICE') {
      this.nightState.policeTargetId = this.selectedOneFlowTargetId;
      const suspect = this.players.find(p => p.id === this.selectedOneFlowTargetId);
      const isKiller = suspect ? suspect.role === 'KILLER' : false;

      this.oneFlowTargetList.classList.add('hidden');
      this.btnConfirmOneFlowAction.classList.add('hidden');

      this.oneFlowPoliceOutcome.className = isKiller
        ? 'one-flow-police-outcome is-killer'
        : 'one-flow-police-outcome not-killer';
      this.oneFlowPoliceOutcome.innerHTML = isKiller
        ? `🚨 CONFIDENTIAL: <strong>${this.escapeHtml(suspect ? suspect.name : '')}</strong> IS THE KILLER!`
        : `🛡️ CONFIDENTIAL: <strong>${this.escapeHtml(suspect ? suspect.name : '')}</strong> is NOT the Killer.`;
      this.oneFlowPoliceOutcome.classList.remove('hidden');

      this.oneFlowConfirmedText.textContent = 'Investigation complete. Keep this strictly confidential!';
      this.oneFlowConfirmedBanner.classList.remove('hidden');
      this.btnHideRole.classList.remove('hidden');
    }
  }

  advanceOneFlowPlayer() {
    // Clear private outcome & state before showing next player's handoff
    this.oneFlowActionBox.classList.add('hidden');
    this.oneFlowTargetList.innerHTML = '';
    this.oneFlowPoliceOutcome.innerHTML = '';
    this.oneFlowPoliceOutcome.classList.add('hidden');
    this.oneFlowConfirmedBanner.classList.add('hidden');
    this.selectedOneFlowTargetId = null;

    this.roleCardRevealed.classList.add('hidden');
    this.roleCardShield.classList.remove('hidden');

    this.oneFlowPlayerIndex++;
    this.promptNextOneFlowPlayer();
  }

  /* ------------------------------------------------------------------------
     PHASE 4: NIGHT PHASE SEQUENCE
     ------------------------------------------------------------------------ */
  startNightSequence() {
    this.nightState = {
      killerTargetId: null,
      doctorTargetId: null,
      policeTargetId: null,
      investigationResult: null,
      eliminatedId: null,
      savedByDoctor: false
    };

    // Step 1: Killer
    const killer = this.players.find(p => p.role === 'KILLER');
    if (killer && killer.isAlive) {
      this.requestHandoff(
        killer.name,
        'Secret Night Phase — Killer Action. Keep screen concealed.',
        () => this.showKillerNightScreen(killer)
      );
    } else {
      // Killer eliminated (should not happen before game ends, but handled safely)
      this.advanceNightFromKiller();
    }
  }

  showKillerNightScreen(killer) {
    this.killerTargetList.innerHTML = '';
    this.btnConfirmKillerTarget.disabled = true;
    this.nightState.killerTargetId = null;

    const livingTargets = this.players.filter(p => p.isAlive && p.id !== killer.id);

    livingTargets.forEach(target => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'target-card-btn';
      btn.innerHTML = `
        <span class="target-avatar-circle">${target.id + 1}</span>
        <span class="target-player-label">${this.escapeHtml(target.name)}</span>
      `;

      btn.addEventListener('click', () => {
        this.sound.playClick();
        this.killerTargetList.querySelectorAll('.target-card-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.nightState.killerTargetId = target.id;
        this.btnConfirmKillerTarget.disabled = false;
      });

      this.killerTargetList.appendChild(btn);
    });

    this.switchView(this.viewNightKiller);
  }

  advanceNightFromKiller() {
    // Step 2: Doctor
    const doctor = this.players.find(p => p.role === 'DOCTOR');
    if (doctor && doctor.isAlive) {
      this.requestHandoff(
        doctor.name,
        'Secret Night Phase — Doctor Action. Keep screen concealed.',
        () => this.showDoctorNightScreen(doctor)
      );
    } else {
      this.advanceNightFromDoctor();
    }
  }

  showDoctorNightScreen(doctor) {
    this.doctorTargetList.innerHTML = '';
    this.btnConfirmDoctorTarget.disabled = true;
    this.nightState.doctorTargetId = null;

    // Doctor can protect any living player including themselves
    const livingTargets = this.players.filter(p => p.isAlive);

    livingTargets.forEach(target => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'target-card-btn';
      btn.innerHTML = `
        <span class="target-avatar-circle">${target.id + 1}</span>
        <span class="target-player-label">${this.escapeHtml(target.name)}${target.id === doctor.id ? ' (You)' : ''}</span>
      `;

      btn.addEventListener('click', () => {
        this.sound.playClick();
        this.doctorTargetList.querySelectorAll('.target-card-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.nightState.doctorTargetId = target.id;
        this.btnConfirmDoctorTarget.disabled = false;
      });

      this.doctorTargetList.appendChild(btn);
    });

    this.switchView(this.viewNightDoctor);
  }

  advanceNightFromDoctor() {
    // Step 3: Police
    const police = this.players.find(p => p.role === 'POLICE');
    if (police && police.isAlive) {
      this.requestHandoff(
        police.name,
        'Secret Night Phase — Police Action. Keep screen concealed.',
        () => this.showPoliceNightScreen(police)
      );
    } else {
      this.resolveNightActions();
    }
  }

  showPoliceNightScreen(police) {
    this.policeTargetList.innerHTML = '';
    this.btnConfirmPoliceInvestigate.disabled = true;
    this.nightState.policeTargetId = null;

    // Police can investigate any living player except themselves
    const livingTargets = this.players.filter(p => p.isAlive && p.id !== police.id);

    livingTargets.forEach(target => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'target-card-btn';
      btn.innerHTML = `
        <span class="target-avatar-circle">${target.id + 1}</span>
        <span class="target-player-label">${this.escapeHtml(target.name)}</span>
      `;

      btn.addEventListener('click', () => {
        this.sound.playClick();
        this.policeTargetList.querySelectorAll('.target-card-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.nightState.policeTargetId = target.id;
        this.btnConfirmPoliceInvestigate.disabled = false;
      });

      this.policeTargetList.appendChild(btn);
    });

    this.switchView(this.viewNightPolice);
  }

  advanceNightFromPolice() {
    const target = this.players.find(p => p.id === this.nightState.policeTargetId);
    if (!target) {
      this.resolveNightActions();
      return;
    }

    const isKiller = target.role === 'KILLER';
    this.policeResultText.className = isKiller ? 'police-outcome-box is-killer' : 'police-outcome-box not-killer';
    this.policeResultText.innerHTML = isKiller
      ? `🚨 CONFIDENTIAL: <strong>${this.escapeHtml(target.name)}</strong> IS THE KILLER!`
      : `🛡️ CONFIDENTIAL: <strong>${this.escapeHtml(target.name)}</strong> is NOT the Killer.`;

    this.switchView(this.viewPoliceResult);
  }

  /* ------------------------------------------------------------------------
     NIGHT RESOLUTION
     ------------------------------------------------------------------------ */
  resolveNightActions() {
    const killerTarget = this.players.find(p => p.id === this.nightState.killerTargetId);
    const doctorTarget = this.players.find(p => p.id === this.nightState.doctorTargetId);

    if (killerTarget && doctorTarget && killerTarget.id === doctorTarget.id) {
      // Saved by Doctor!
      this.nightState.savedByDoctor = true;
      this.nightState.eliminatedId = null;
      this.addPublicHistoryLog(`Round ${this.round}: Night ended — nobody was eliminated.`);
    } else if (killerTarget) {
      // Killer eliminated someone
      killerTarget.isAlive = false;
      killerTarget.eliminatedInRound = this.round;
      this.nightState.eliminatedId = killerTarget.id;
      this.nightState.savedByDoctor = false;
      this.addPublicHistoryLog(`Round ${this.round}: Night ended — ${killerTarget.name} was eliminated.`);
    }

    // Check Win Condition after Night!
    if (this.checkWinConditions()) {
      return;
    }

    // Proceed to Daytime Announcement
    this.showDayAnnouncement();
  }

  /* ------------------------------------------------------------------------
     PHASE 5: DAY ANNOUNCEMENT
     ------------------------------------------------------------------------ */
  showDayAnnouncement() {
    this.dayAnnouncementRound.textContent = `ROUND ${this.round}: DAWN`;

    if (this.nightState.savedByDoctor) {
      this.sound.playSave();
      this.dayNightOutcomeMessage.className = 'day-report-message saved';
      this.dayNightOutcomeMessage.innerHTML =
        '✨ <strong>Miraculous morning!</strong> Nobody was eliminated last night thanks to swift emergency aid!';
    } else if (this.nightState.eliminatedId !== null) {
      this.sound.playElimination();
      const victim = this.players.find(p => p.id === this.nightState.eliminatedId);
      this.dayNightOutcomeMessage.className = 'day-report-message casualty';
      this.dayNightOutcomeMessage.innerHTML =
        `💀 <strong>Tragedy struck!</strong> <strong>${this.escapeHtml(victim ? victim.name : 'A player')}</strong> was found eliminated last night.`;
    } else {
      this.dayNightOutcomeMessage.className = 'day-report-message';
      this.dayNightOutcomeMessage.innerHTML = 'A quiet night in the town. Nobody was harmed.';
    }

    // Render Living & Dead lists
    this.dayLivingList.innerHTML = '';
    this.dayEliminatedList.innerHTML = '';

    this.players.forEach(p => {
      const pill = document.createElement('span');
      if (p.isAlive) {
        pill.className = 'status-pill alive';
        pill.textContent = p.name;
        this.dayLivingList.appendChild(pill);
      } else {
        pill.className = 'status-pill dead';
        pill.textContent = p.name;
        this.dayEliminatedList.appendChild(pill);
      }
    });

    if (this.players.every(p => p.isAlive)) {
      this.dayEliminatedList.innerHTML = '<span style="font-size:0.75rem; color:#a1a3ad;">None</span>';
    }

    this.btnProceedToClues.textContent = this.secretWordEnabled
      ? 'BEGIN WORD DESCRIPTIONS'
      : 'BEGIN TOWN DISCUSSION';

    this.switchView(this.viewDayAnnouncement);
  }

  /* ------------------------------------------------------------------------
     PHASE 6: WORD DESCRIPTION ROUND (Secret Word Clues)
     ------------------------------------------------------------------------ */
  startWordClueRound() {
    this.wordClueRoundTag.textContent = `ROUND ${this.round}: WORD CLUES`;

    // Filter living players
    const living = this.players.filter(p => p.isAlive);
    if (living.length === 0) return;

    // Fresh randomized speaking order every clue round using Fisher-Yates shuffle
    const shuffled = [...living];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    this.speakerOrder = shuffled;
    this.speakerIndex = 0;

    this.renderSpeakerTurn();
    this.switchView(this.viewWordDescription);
  }

  renderSpeakerTurn() {
    if (this.speakerIndex >= this.speakerOrder.length) {
      // Clues round complete! Proceed to discussion.
      this.startDiscussionPhase();
      return;
    }

    const currentSpeaker = this.speakerOrder[this.speakerIndex];
    this.currentSpeakerName.textContent = currentSpeaker.name;
    this.speakerTurnProgress.textContent = `Speaker ${this.speakerIndex + 1} of ${this.speakerOrder.length}`;

    // Render order chips
    this.speakerOrderList.innerHTML = '';
    this.speakerOrder.forEach((speaker, idx) => {
      const chip = document.createElement('span');
      chip.className = 'order-chip';
      if (idx === this.speakerIndex) chip.classList.add('current');
      if (idx < this.speakerIndex) chip.classList.add('done');
      chip.textContent = speaker.name;
      this.speakerOrderList.appendChild(chip);
    });
  }

  advanceSpeaker(passed) {
    this.speakerIndex++;
    this.renderSpeakerTurn();
  }

  /* ------------------------------------------------------------------------
     PHASE 7: DAYTIME DISCUSSION
     ------------------------------------------------------------------------ */
  startDiscussionPhase() {
    this.discussionSecondsRemaining = this.timerDuration;
    this.isTimerPaused = false;
    this.btnTimerToggle.textContent = 'PAUSE';

    // Show or hide Killer Guess button based on conditions
    const killer = this.players.find(p => p.role === 'KILLER');
    const killerCanGuess =
      this.secretWordEnabled &&
      !this.killerHasGuessed &&
      killer &&
      killer.isAlive;

    if (killerCanGuess) {
      this.btnProceedToKillerGuess.classList.remove('hidden');
    } else {
      this.btnProceedToKillerGuess.classList.add('hidden');
    }

    this.updateTimerDisplay();
    this.startDiscussionTimer();
    this.switchView(this.viewDiscussion);
  }

  startDiscussionTimer() {
    this.clearIntervals();
    if (!this.timerEnabled) {
      this.discussionTimerDisplay.textContent = 'UNTIL VOTING';
      return;
    }

    this.discussionTimerInterval = setInterval(() => {
      if (!this.isTimerPaused && this.discussionSecondsRemaining > 0) {
        this.discussionSecondsRemaining--;
        this.updateTimerDisplay();
        if (this.discussionSecondsRemaining <= 0) {
          this.clearIntervals();
          this.sound.playClick();
        }
      }
    }, 1000);
  }

  toggleDiscussionTimer() {
    this.isTimerPaused = !this.isTimerPaused;
    this.btnTimerToggle.textContent = this.isTimerPaused ? 'RESUME' : 'PAUSE';
  }

  updateTimerDisplay() {
    const mins = Math.floor(this.discussionSecondsRemaining / 60);
    const secs = this.discussionSecondsRemaining % 60;
    const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    this.discussionTimerDisplay.textContent = str;

    if (this.discussionSecondsRemaining <= 15) {
      this.discussionTimerDisplay.classList.add('urgent');
    } else {
      this.discussionTimerDisplay.classList.remove('urgent');
    }
  }

  clearIntervals() {
    if (this.discussionTimerInterval) {
      clearInterval(this.discussionTimerInterval);
      this.discussionTimerInterval = null;
    }
    if (this.finalDefenseTimerInterval) {
      clearInterval(this.finalDefenseTimerInterval);
      this.finalDefenseTimerInterval = null;
    }
  }

  /* ------------------------------------------------------------------------
     PHASE 8: KILLER SECRET WORD GUESS
     ------------------------------------------------------------------------ */
  promptKillerGuessHandoff() {
    const killer = this.players.find(p => p.role === 'KILLER');
    if (!killer || !killer.isAlive || this.killerHasGuessed) {
      this.startNominationPhase();
      return;
    }

    this.requestHandoff(
      killer.name,
      'Private Killer Opportunity: Guess the Secret Word for a bonus point!',
      () => this.showKillerGuessScreen(killer)
    );
  }

  showKillerGuessScreen(killer) {
    this.killerGuessCategory.textContent = this.currentCategory.toUpperCase();
    this.inputKillerWordGuess.value = '';
    this.killerGuessFeedback.className = 'guess-feedback-box hidden';
    this.btnSubmitKillerGuess.disabled = false;
    this.btnSkipKillerGuess.disabled = false;
    this.btnProceedAfterKillerGuess.classList.add('hidden');

    this.switchView(this.viewKillerGuess);
  }

  handleKillerWordGuessSubmit() {
    const guess = (this.inputKillerWordGuess.value || '').trim();
    if (!guess) return;

    this.sound.playClick();
    this.killerHasGuessed = true;
    this.killerWordGuessSubmitted = guess;

    // Case-insensitive comparison with actual secret word
    const isCorrect = guess.toLowerCase() === this.currentSecretWord.toLowerCase();
    this.killerGuessedCorrectly = isCorrect;
    if (isCorrect) {
      this.killerBonusPoints = 1;
    }

    this.inputKillerWordGuess.disabled = true;
    this.btnSubmitKillerGuess.disabled = true;
    this.btnSkipKillerGuess.disabled = true;

    this.killerGuessFeedback.className = isCorrect ? 'guess-feedback-box correct' : 'guess-feedback-box incorrect';
    this.killerGuessFeedback.innerHTML = isCorrect
      ? '🎉 <strong>SPOT ON!</strong> You correctly deduced the secret word! (+1 Bonus Point earned at game end)'
      : '❌ <strong>INCORRECT GUESS.</strong> Your guess was recorded. No bonus point awarded.';

    this.killerGuessFeedback.classList.remove('hidden');
    this.btnProceedAfterKillerGuess.classList.remove('hidden');
  }

  /* ------------------------------------------------------------------------
     PHASE 9: NOMINATIONS & FINAL DEFENSE
     ------------------------------------------------------------------------ */
  startNominationPhase() {
    this.nominatedPlayerIds.clear();
    this.renderNominationGrid();
    this.updateNominationSummary();
    this.switchView(this.viewNomination);
  }

  renderNominationGrid() {
    this.nominationGrid.innerHTML = '';
    const living = this.players.filter(p => p.isAlive);

    living.forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nom-card-btn';
      if (this.nominatedPlayerIds.has(p.id)) btn.classList.add('nominated');

      btn.innerHTML = `
        <span class="target-avatar-circle">${p.id + 1}</span>
        <span class="target-player-label">${this.escapeHtml(p.name)}</span>
      `;

      btn.addEventListener('click', () => {
        this.sound.playClick();
        if (this.nominatedPlayerIds.has(p.id)) {
          this.nominatedPlayerIds.delete(p.id);
          btn.classList.remove('nominated');
        } else {
          this.nominatedPlayerIds.add(p.id);
          btn.classList.add('nominated');
        }
        this.updateNominationSummary();
      });

      this.nominationGrid.appendChild(btn);
    });
  }

  updateNominationSummary() {
    if (this.nominatedPlayerIds.size === 0) {
      this.nominatedSummaryText.textContent = 'None';
    } else {
      const names = [...this.nominatedPlayerIds]
        .map(id => this.players.find(p => p.id === id))
        .filter(Boolean)
        .map(p => p.name);
      this.nominatedSummaryText.textContent = names.join(', ');
    }
  }

  startFinalDiscussionPhase() {
    if (this.nominatedPlayerIds.size === 0) {
      // If none nominated, go directly to voting
      this.startVotingPhase();
      return;
    }

    this.finalNominatedDisplay.innerHTML = '';
    this.nominatedPlayerIds.forEach(id => {
      const p = this.players.find(pl => pl.id === id);
      if (p) {
        const pill = document.createElement('span');
        pill.className = 'final-defense-pill';
        pill.textContent = p.name;
        this.finalNominatedDisplay.appendChild(pill);
      }
    });

    this.finalDefenseSecondsRemaining = 45;
    this.finalDiscussionTimerDisplay.textContent = '00:45';

    this.clearIntervals();
    this.finalDefenseTimerInterval = setInterval(() => {
      if (this.finalDefenseSecondsRemaining > 0) {
        this.finalDefenseSecondsRemaining--;
        const secs = String(this.finalDefenseSecondsRemaining).padStart(2, '0');
        this.finalDiscussionTimerDisplay.textContent = `00:${secs}`;
        if (this.finalDefenseSecondsRemaining <= 0) {
          this.clearIntervals();
        }
      }
    }, 1000);

    this.switchView(this.viewFinalDiscussion);
  }

  /* ------------------------------------------------------------------------
     PHASE 10: SECRET VOTING & RESULTS
     ------------------------------------------------------------------------ */
  startVotingPhase() {
    this.votingLivingPlayers = this.players.filter(p => p.isAlive);
    this.votingPlayerIndex = 0;
    this.votes = {};
    this.players.forEach(p => {
      this.votes[p.id] = 0;
    });

    this.promptNextVoter();
  }

  promptNextVoter() {
    if (this.votingPlayerIndex >= this.votingLivingPlayers.length) {
      // All votes cast!
      this.tallyVotesAndReveal();
      return;
    }

    const voter = this.votingLivingPlayers[this.votingPlayerIndex];
    this.requestHandoff(
      voter.name,
      'Secret Voting Ballot. Keep screen concealed from other players.',
      () => this.showVotingBallotScreen(voter)
    );
  }

  showVotingBallotScreen(voter) {
    this.voterPromptName.textContent = voter.name;
    this.selectedVoteTargetId = null;
    this.btnConfirmVote.disabled = true;
    this.votingCandidatesGrid.innerHTML = '';

    // Candidates: Living players EXCEPT voter (No self-voting!)
    const eligibleTargets = this.players.filter(p => p.isAlive && p.id !== voter.id);

    eligibleTargets.forEach(candidate => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vote-card-btn';
      btn.innerHTML = `
        <span class="target-avatar-circle">${candidate.id + 1}</span>
        <span class="target-player-label">${this.escapeHtml(candidate.name)}</span>
      `;

      btn.addEventListener('click', () => {
        this.sound.playClick();
        this.votingCandidatesGrid.querySelectorAll('.vote-card-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedVoteTargetId = candidate.id;
        this.btnConfirmVote.disabled = false;
      });

      this.votingCandidatesGrid.appendChild(btn);
    });

    this.switchView(this.viewVoting);
  }

  recordVoteAndAdvance(targetId) {
    if (targetId !== null && this.votes[targetId] !== undefined) {
      this.votes[targetId]++;
    }
    this.votingPlayerIndex++;
    this.promptNextVoter();
  }

  tallyVotesAndReveal() {
    this.voteResultsRound.textContent = `ROUND ${this.round} VOTE TALLY`;
    this.voteTallyContainer.innerHTML = '';

    const living = this.players.filter(p => p.isAlive);
    const results = living.map(p => ({
      player: p,
      count: this.votes[p.id] || 0
    })).sort((a, b) => b.count - a.count);

    results.forEach(r => {
      const row = document.createElement('div');
      row.className = 'tally-row';
      row.innerHTML = `
        <span class="tally-player">${this.escapeHtml(r.player.name)}</span>
        <span class="tally-count">${r.count} vote${r.count === 1 ? '' : 's'}</span>
      `;
      this.voteTallyContainer.appendChild(row);
    });

    // Check for highest vote & ties
    const highestCount = results.length > 0 ? results[0].count : 0;
    const topTied = results.filter(r => r.count === highestCount && r.count > 0);

    if (highestCount === 0 || topTied.length > 1) {
      // Tie or 0 votes: nobody eliminated!
      this.votingTied = true;
      this.eliminatedByVote = null;
      this.voteOutcomeAnnouncement.innerHTML =
        '🤝 <strong>The vote is tied!</strong> No clear majority was reached, so nobody was eliminated this round.';
      this.eliminatedRoleRevealBanner.classList.add('hidden');
      this.addPublicHistoryLog(`Round ${this.round}: Daytime voting resulted in a tie. Nobody was eliminated.`);
    } else {
      // Clear majority elimination
      this.votingTied = false;
      const eliminated = topTied[0].player;
      eliminated.isAlive = false;
      eliminated.eliminatedInRound = this.round;
      this.eliminatedByVote = eliminated;

      this.sound.playElimination();
      this.voteOutcomeAnnouncement.innerHTML =
        `🗳️ <strong>${this.escapeHtml(eliminated.name)}</strong> received the most votes (${highestCount}) and was eliminated from the town.`;

      // Publicly reveal the eliminated player's role immediately
      this.eliminatedRoleRevealBanner.innerHTML =
        `PUBLIC ROLE REVEAL: <strong>${this.escapeHtml(eliminated.name)}</strong> was the <span style="text-decoration:underline;">${eliminated.role}</span>!`;
      this.eliminatedRoleRevealBanner.classList.remove('hidden');

      this.addPublicHistoryLog(
        `Round ${this.round}: ${eliminated.name} was eliminated by vote (${highestCount} votes). Role: ${eliminated.role}.`
      );
    }

    this.switchView(this.viewVoteResults);
  }

  handlePostVotingTransition() {
    // Check Win Condition after voting
    if (this.checkWinConditions()) {
      return;
    }

    // Advance Round and proceed to next Night
    this.round++;
    this.addPublicHistoryLog(`Round ${this.round} started.`);

    // Re-shuffle player order every round
    for (let i = this.players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.players[i], this.players[j]] = [this.players[j], this.players[i]];
    }
    this.sound.playNight();

    if (this.gameMode === 'ONE_FLOW') {
      this.startOneFlowRound();
    } else {
      this.switchView(this.viewNightIntro);
    }
  }

  /* ------------------------------------------------------------------------
     PHASE 11: WIN CONDITIONS & VICTORY SCREEN
     ------------------------------------------------------------------------ */
  checkWinConditions() {
    const killer = this.players.find(p => p.role === 'KILLER');
    const livingKillers = this.players.filter(p => p.isAlive && p.role === 'KILLER').length;
    const livingNonKillers = this.players.filter(p => p.isAlive && p.role !== 'KILLER').length;

    // Condition 1: Killer is eliminated -> Citizens win!
    if (!killer || !killer.isAlive) {
      this.triggerVictory('CITIZENS');
      return true;
    }

    // Condition 2: Living Killers >= Living Non-Killers -> Killer wins!
    if (livingKillers >= livingNonKillers) {
      this.triggerVictory('KILLER');
      return true;
    }

    return false;
  }

  triggerVictory(winningTeam) {
    this.isGameActive = false;
    this.clearIntervals();
    this.sound.playVictory();

    this.victoryRoundsCount.textContent = String(this.round);
    this.victorySecretCategory.textContent = this.currentCategory.toUpperCase();
    this.victorySecretWord.textContent = this.currentSecretWord.toUpperCase();

    if (this.killerWordGuessSubmitted) {
      this.victoryKillerGuessResult.textContent = `"${this.killerWordGuessSubmitted}" (${this.killerGuessedCorrectly ? 'CORRECT' : 'INCORRECT'})`;
    } else {
      this.victoryKillerGuessResult.textContent = 'Did not guess';
    }
    this.victoryKillerBonusPoints.textContent = `${this.killerBonusPoints} Pt${this.killerBonusPoints === 1 ? '' : 's'}`;

    if (winningTeam === 'CITIZENS') {
      this.victoryBannerTitle.textContent = 'CITIZENS WIN!';
      this.victoryBannerTitle.className = 'victory-title citizens-win';
      this.victorySubtitle.textContent = 'The Killer has been brought to justice! The city is safe once more.';
      this.victoryWinningTeam.textContent = 'Citizens (Town)';
      this.victoryWinningTeam.style.color = 'var(--neon-cyan)';
      this.addPublicHistoryLog(`Game Over: Citizens won in Round ${this.round}!`);
    } else {
      this.victoryBannerTitle.textContent = 'KILLER WINS!';
      this.victoryBannerTitle.className = 'victory-title killer-wins';
      this.victorySubtitle.textContent = 'The Killer successfully infiltrated and overpowered the town!';
      this.victoryWinningTeam.textContent = 'Killer';
      this.victoryWinningTeam.style.color = 'var(--neon-red)';
      this.addPublicHistoryLog(`Game Over: Killer won in Round ${this.round}!`);
    }

    // Render Full Roster Table with all roles revealed
    this.victoryRosterTableBody.innerHTML = '';
    this.players.forEach(p => {
      const tr = document.createElement('tr');
      const statusText = p.isAlive
        ? '<span style="color:#779b83; font-weight:700;">Survived</span>'
        : `<span style="color:#c6283d;">Eliminated (Round ${p.eliminatedInRound || 1})</span>`;

      tr.innerHTML = `
        <td><strong>${this.escapeHtml(p.name)}</strong></td>
        <td><span class="roster-role-badge ${p.role.toLowerCase()}">${p.role}</span></td>
        <td>${statusText}</td>
      `;
      this.victoryRosterTableBody.appendChild(tr);
    });

    this.switchView(this.viewVictory);
  }

  /* ------------------------------------------------------------------------
     Public History Logger & Modal
     ------------------------------------------------------------------------ */
  addPublicHistoryLog(msg) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.publicHistory.push({ time: timeStr, text: msg });
  }

  renderHistoryModal() {
    this.historyLogList.innerHTML = '';
    if (this.publicHistory.length === 0) {
      this.historyLogList.innerHTML = '<p style="color:#a1a3ad; font-size:0.85rem;">No events recorded yet.</p>';
      return;
    }

    this.publicHistory.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      if (item.text.includes('Game started') || item.text.includes('Round')) el.classList.add('round-start');
      if (item.text.includes('eliminated')) el.classList.add('elimination');

      el.innerHTML = `
        <span class="history-time">${item.time}</span>
        <span>${this.escapeHtml(item.text)}</span>
      `;
      this.historyLogList.appendChild(el);
    });
  }

  /* ------------------------------------------------------------------------
     Quit to Setup
     ------------------------------------------------------------------------ */
  quitToSetup() {
    this.isGameActive = false;
    this.clearIntervals();
    this.renderPlayerList();
    this.updateRoleDistributionPreview();
    this.switchView(this.viewSetup);
  }

  /* ------------------------------------------------------------------------
     Utilities
     ------------------------------------------------------------------------ */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.killerKillerGame = new KillerKillerGame();
});

/* ==========================================================================
   Compact Gameplay — "?" help button + collapsible instruction text
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const COLLAPSIBLE = [
    '.handoff-subtext', '.shield-instruction',
    '.role-objective-desc', '.police-subnote',
    '.nomination-desc', '.final-defense-desc', '.voting-instruction',
    '.killer-guess-desc', '.discussion-prompt',
    '.player-greeting', '.privacy-warning', '.shield-instruction',
    '.role-objective-desc', '.secret-word-rules'
  ];
  document.querySelectorAll('.game-view').forEach(view => {
    if (view.id === 'viewSetup') return;
    COLLAPSIBLE.forEach(sel => {
      view.querySelectorAll(sel).forEach(el => el.classList.add('help-collapsible'));
    });
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'kk-help-btn';
    btn.textContent = '?';
    btn.setAttribute('aria-label', 'Show instructions');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = view.classList.toggle('help-open');
      btn.classList.toggle('help-active', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    view.appendChild(btn);
  });
});

/* ==========================================================================
   Haunted Atmosphere Lightning Scheduler (Visual Depth)
   ========================================================================== */
(function () {
  'use strict';
  const atmo = document.querySelector('.kk-atmo');
  // Extra lightning positions: left, right, bottom
  ['pos-left','pos-right','pos-bottom','pos-tl','pos-tr','pos-bl','pos-br','pos-center'].forEach(pos => {
    const f = document.createElement('div');
    f.className = 'atmo-flash ' + pos;
    atmo.appendChild(f);
  });

  let flashIdx = 0;
  function scheduleLightning() {
    setTimeout(() => {
      if (!document.hidden && atmo) {
        // Sequential traveling flash — one position at a time, like eyes blinking in turn
        const flashes = atmo.querySelectorAll('.atmo-flash');
        const f = flashes[flashIdx % flashes.length];
        flashIdx++;
        if (f) {
          f.classList.remove('strike');
          void f.offsetWidth;
          f.classList.add('strike');
        }
      }
      scheduleLightning();
    }, 1200 + Math.random() * 1800);
  }
  scheduleLightning();
})();

/* ==========================================================================
   Haunted Horror FX — dynamic blood/splatter/eyes/ash + phase-reactive states
   ========================================================================== */
(function () {
  'use strict';
  const atmo = document.querySelector('.kk-atmo');
  if (!atmo || !atmo.querySelector('.atmo-image')) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const fx = document.createElement('div');
  fx.className = 'atmo-fx';
  atmo.appendChild(fx);

  // Blood drips along the top edge (varied positions/lengths)
  const dripCount = Math.min(24, Math.floor(window.innerWidth / 60));
  for (let i = 0; i < dripCount; i++) {
    const d = document.createElement('div');
    d.className = 'blood-drip';
    const side = Math.random() < 0.5;
    d.style.left = (side ? Math.random() * 18 : 82 + Math.random() * 18) + '%';
    d.style.setProperty('--drip-len', (50 + Math.random() * 110) + 'px');
    d.style.animationDelay = (-Math.random() * 9) + 's';
    d.style.animationDuration = (6 + Math.random() * 5) + 's';
    fx.appendChild(d);
  }

  // Red eyes — two pairs in dark zones
  [[6,18],[14,55],[24,30],[34,70],[44,12],[54,45],[64,80],[74,22],[84,60],[90,38],[28,85],[48,28],[68,50],[88,72]].forEach(([x, y], i) => {
    const e = document.createElement('div');
    e.className = 'red-eyes';
    e.style.left = x + '%'; e.style.top = y + '%';
    e.style.animationDelay = (-i * 4 - Math.random() * 6) + 's';
    e.style.animationDuration = (10 + Math.random() * 8) + 's';
    fx.appendChild(e);
  });

  // Shadow figure crossing occasionally
  const fig = document.createElement('div');
  fig.className = 'shadow-figure';
  fig.style.left = '0'; fig.style.bottom = '14%';
  fig.style.animationDelay = '-6s';
  fx.appendChild(fig);
  const fig2 = fig.cloneNode(true);
  fig2.style.animationDelay = '-15s';
  fig2.style.opacity = '0.7';
  fx.appendChild(fig2);

  // Ash particles
  for (let i = 0; i < 36; i++) {
    const a = document.createElement('div');
    a.className = 'atmo-ash';
    a.style.left = Math.random() * 100 + '%';
    a.style.top = -10 - Math.random() * 30 + 'px';
    a.style.setProperty('--ash-dx', (Math.random() * 120 - 60) + 'px');
    a.style.animationDuration = (14 + Math.random() * 18) + 's';
    a.style.animationDelay = (-Math.random() * 30) + 's';
    a.style.opacity = 0.3 + Math.random() * 0.4;
    fx.appendChild(a);
  }

  // Edge flash element for killer action
  const edgeFlash = document.createElement('div');
  edgeFlash.className = 'atmo-edge-flash';
  atmo.appendChild(edgeFlash);

  function splat(xPct, yPct, big) {
    const s = document.createElement('div');
    s.className = 'blood-splat';
    s.style.left = (xPct - 4) + '%';
    s.style.top = yPct + '%';
    s.style.transform = 'scale(' + (big ? 1.6 : 1) + ')';
    fx.appendChild(s);
    setTimeout(() => s.remove(), 1800);
    if (big) {
      [[xPct - 10, yPct + 4], [xPct + 8, yPct + 8]].forEach(([sx, sy]) => {
        const s2 = document.createElement('div');
        s2.className = 'blood-splat';
        s2.style.left = sx + '%'; s2.style.top = sy + '%';
        fx.appendChild(s2);
        setTimeout(() => s2.remove(), 1800);
      });
    }
  }

  // Phase-reactive atmosphere classes
  const FX_MAP = {
    viewNightIntro: 'atmo-night',
    viewNightKiller: 'atmo-night atmo-killer',
    viewNightDoctor: 'atmo-night',
    viewNightPolice: 'atmo-night',
    viewPoliceResult: 'atmo-night',
    viewVoting: 'atmo-vote',
    viewVoteResults: '',
    viewVictory: 'atmo-victory'
  };
  const FX_CLASSES = ['atmo-night','atmo-killer','atmo-vote','atmo-victory','atmo-victory-killer','atmo-victory-town'];

  function refreshAtmosphere() {
    const active = document.querySelector('.game-view:not(.hidden)');
    if (!active) return;
    // detect victory type from visible text
    let victoryClass = '';
    if (active.id === 'viewVictory') {
      const txt = active.textContent.toLowerCase();
      victoryClass = txt.includes('killer') && !txt.includes('citizen') && !txt.includes('town')
        ? 'atmo-victory-killer' : 'atmo-victory-town';
    }
    FX_CLASSES.forEach(c => atmo.classList.remove(c));
    const map = FX_MAP[active.id] || '';
    map.split(' ').filter(Boolean).forEach(c => atmo.classList.add(c));
    if (victoryClass) atmo.classList.add(victoryClass);
    // killer action edge flash
    if (active.id === 'viewNightKiller') {
      edgeFlash.classList.remove('pulse'); void edgeFlash.offsetWidth; edgeFlash.classList.add('pulse');
    }
  }

  const obs = new MutationObserver(refreshAtmosphere);
  document.querySelectorAll('.game-view').forEach(v =>
    obs.observe(v, { attributes: true, attributeFilter: ['class'] }));
  refreshAtmosphere();

  // Splatter on actual elimination events only
  const elimObs = new MutationObserver(() => {
    document.querySelectorAll('[class*="eliminat"]').forEach(el => {
      if (el.offsetParent !== null && !el.dataset.fxSeen) {
        el.dataset.fxSeen = '1';
        splat(8, 12, true);
        splat(88, 20, false);
        splat(50, 4, false);
      }
    });
  });
  elimObs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  // Rare ambient splatter (very infrequent)
  setInterval(() => {
    if (!document.hidden && Math.random() < 0.6) {
      splat(Math.random() * 80 + 5, Math.random() < 0.5 ? 6 + Math.random() * 10 : 80 + Math.random() * 12, false);
    }
  }, 20000);
})();
