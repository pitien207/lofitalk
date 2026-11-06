// English UI strings. Loaded on demand (see translations.js).
const english = {
  common: {
    loading: "Loading...",

    prev: "Previous",

    next: "Next",

    send: "Send",

    messagePlaceholder: "Type a message...",

    cancel: "Cancel",

    presence: {
      online: "Online now",

      offline: "Last seen {timeAgo}",

      offlineUnknown: "Offline",
    },
  },

  auth: {
    signupLogoTagline: "Slow down and find your cozy space to chat.",

    signupTitle: "Create an Account",

    signupSubtitle:
      "Join LofiTalk to drift into calm conversations and meet kindred spirits.",

    fullName: "Full Name / Nickname",

    email: "Email",

    password: "Password",

    passwordHint: "Password must be at least 8 characters long",

    termsPrefix: "I agree to the",

    termsOfService: "terms of service",

    privacyPolicy: "privacy policy",

    and: "and",

    createAccount: "Create Account",

    alreadyHaveAccount: "Already have an account? ",

    signIn: "Sign in",

    loginTitle: "Welcome Back",

    loginSubtitle: "Sign in to reconnect with your calm chat spaces.",

    signInButton: "Sign In",

    dontHaveAccount: "Don't have an account? ",

    createOne: "Create one",

    signupIllustrationTitle: "Create your cozy circle",

    signupIllustrationSubtitle:
      "Share moments, swap feelings, and enjoy laid-back conversations anytime.",

    verificationTitle: "Check your inbox",

    verificationSubtitle:
      "We sent a 6-digit code to {email}. Enter it below to finish creating your account.",

    verificationCodeLabel: "Verification code",

    verificationSubmit: "Verify & Continue",

    verificationResendHint:
      "Need a new code? Go back and submit the form again to resend.",

    verificationBack: "Back to sign up form",

    verificationEmailSent: "We just emailed you a verification code.",

    verificationSuccess: "Email verified successfully! Redirecting...",
  },

  home: {
    welcomeTitle: "Welcome to LofiTalk",

    welcomeSubtitle:
      "Jump into your language exchange. Manage your friends, discover new partners, and check notifications.",

    goFriends: "Go to Friends",

    goNotifications: "Notifications",

    startChat: "Start a Chat",

    yourFriends: "Your Friends",

    friendRequests: "Friend Requests",

    meetTitle: "Meet new mellow friends",

    meetSubtitle: "Find people who match your calm vibe based on your profile",

    noRecommendations: "No recommendations available",

    checkLater: "Check back later for new language partners!",

    requestSent: "Request Sent",

    cancelRequest: "Cancel Request",

    sendRequest: "Send Friend Request",

    pendingFromThem:
      "This user already sent you a request. Please respond in Notifications.",
  },

  chatHome: {
    empty: "No conversations yet",

    emptyHint:
      "Start a chat from someone's profile and your conversations will show up here.",

    noMessages: "No messages yet",
  },

  chatPage: {
    clearForMe: "Delete chat for me",

    clearing: "Deleting...",

    clearSuccess: "Messages cleared on your side",

    clearError: "Could not clear the messages",

    blockedTitle: "Chat unavailable",

    blockedDescription:
      "This chat is hidden because one of you blocked the other.",

    backToList: "Back to chats",
  },

  friends: {
    filters: {
      energyTitle: "Shared energy (with Tarot)",

      energyHint: "Each filter attempt consumes 1 energy.",

      applyHint:
        "Filters apply to recommendations. Up to 3 matching profiles are shown per energy.",

      applyError: "Couldn't load recommendations. Please try again.",

      emptyState:
        "Set your vibe filters and apply them to discover new friends.",

      reset: "Reset",

      apply: "Apply filters",

      genderLabel: "Gender",

      countryLabel: "Living Country",

      cityLabel: "Living City",

      birthCountryLabel: "Birth country",

      birthCityLabel: "Birth city / province",

      heightLabel: "Minimum height (cm)",

      heightPlaceholder: "e.g. 160",

      educationLabel: "Education",

      hobbyLabel: "Hobby",

      petLabel: "Pet",

      anyOption: "Any",

      energyError: "Not enough energy. Please refill in Tarot.",
    },

    blockAction: "Block",

    blockConfirm:
      "Block this user? They won't be able to send you friend requests or messages.",

    blockSuccess: "User blocked.",

    blockError: "Unable to block user.",

    unblockAction: "Unblock",

    unblockSuccess: "User unblocked.",

    unblockError: "Unable to unblock user.",

    blockedTitle: "Blocked users",

    blockedSubtitle:
      "Friends you block show up here and can no longer contact you.",

    blockedEmpty: "You haven't blocked anyone yet.",

    blockMenuLabel: "More actions",

    reportAction: "Report",

    reportTitle: "Report user",

    reportTargetLabel: "Reporting {name}",

    reportDescription:
      "Share a short note about this report. Keep it under {limit} words.",

    reportPlaceholder: "Describe what happened...",

    reportWordCounter: "{count}/{limit} words",

    reportTooLong: "Too many words",

    reportSubmit: "Send report",

    reportSuccess: "Report submitted. Thank you for the feedback.",

    reportError: "Unable to submit report.",
  },

  nav: {
    notifications: "Notifications",

    theme: "Theme",

    language: "Language",

    about: "About",

    version: "Version",

    developer: "Developer",

    inspiredBy: "Inspired by",

    inspiredNames: "Codesistency / Fremdchat / avocadorable / Kaytiem",
  },

  notifications: {
    title: "Notifications",

    incoming: "Friend Requests",

    accept: "Accept",

    decline: "Decline",

    deleted: "Notification cleared",

    declined: "Request declined",

    statusDeclined:
      "You declined this request. We'll keep it here for your records.",

    delete: "Clear",

    error: "Something went wrong. Please try again.",

    newConnections: "New Connections",

    acceptedText: "{name} accepted your friend request",

    declinedSection: "Declined Requests",

    declinedText: "{name} declined your friend request",

    recently: "Recently",

    newFriend: "New Friend",

    adminTitle: "Admin notifications",

    adminExpireHint: "Auto-clears after {days} days",

    expiresOn: "expires {date}",

    fromAdmin: "From admin",

    datingConfession: {
      badge: "Facebook shoutout",
      title: "Dating Confession",
      description:
        "Tap to follow Dating Confession on Facebook for cozy confessions and updates.",
      cta: "Open fanpage",
    },
  },

  sidebar: {
    home: "Home",

    friends: "Friends",

    notifications: "Notifications",

    mystic: "Mystic",

    tarot: "Tarot",

    games: "Games",

    matchMind: "MatchMind",

    matchMindComingSoon: "MatchMind (coming soon)",

    truthOrLiar: "Truth or Lie",

    admin: "Admin",

    chat: "Messages",

    fortune: {
      linkLabel: "Fortune Cookie",

      title: "Fortune cookie ritual",

      subtitle: "Crack it open for a tiny note of encouragement.",

      pageDescription:
        "Each click shuffles a gentle reminder written with cozy care. Slow down, breathe in, and let the message guide your next move.",

      hint: "Tap to crack it open",

      openedHint:
        "You already opened today's cookie. Come back tomorrow for another mindful note.",

      newFortune: "Reset cookie",

      fallback: "Slow down, breathe in, and trust your pace.",

      shareHint:
        "Love this note? Share it with a friend who needs the same vibe.",

      ritualSteps: [
        "Set a soft intention or question in your mind.",

        "Tap the glowing cookie and watch it crack with light.",

        "Keep the note close and pass the calm energy forward.",
      ],
    },

    mobileApp: {
      linkLabel: "Mobile App",
    },
  },

  mobileAppPage: {
    heroBadge: "Mobile companion",

    heroTitle: "LofiTalk, always within reach",

    heroSubtitle:
      "Stay connected with your cozy conversations, tarot refills, and gentle reminders wherever you are.",

    downloadButton: "Open mobile app",

    downloadUnavailable: "Download link coming soon",

    downloadHint: "Works on iOS and Android via our beta launcher.",

    availabilityNote: "Currently available on Android devices only.",

    qrTitle: "Scan the QR for direct download",

    qrDescription:
      "Point your camera at this code to open the APK link instantly.",

    featuresTitle: "Designed for slow, mindful connections",

    features: [
      "Real-time push notifications so you never miss a calm check-in.",

      "Full sync with your web profile, tarot energy, and fortune cookies.",

      "Lightweight interface that keeps chats and voice notes smooth everywhere.",
    ],

    stepsTitle: "How to get the beta build",

    steps: [
      "Tap the button above to open the LofiTalk mobile link.",

      "Follow the installation prompts for your platform and allow the beta profile.",

      "Sign in with the same account you use on the web to keep everything in sync.",
    ],
  },

  matchMind: {
    title: "MatchMind mini game",

    subtitle:
      "Invite a friend for 10 quick questions and see how in-sync you are.",

    comingSoonTitle: "MatchMind is coming soon",

    comingSoonSubtitle: "Plus or Admin users can access the game right now.",

    howItWorksTitle: "How it works",

    liveOnly: "When the game starts, only the game view stays visible.",

    steps: [
      "Pick a friend and send a 30-second invite via notification.",

      "If they accept in time, you both enter the room and the host can start.",

      "Each round has 4 options and 10 seconds. Shared score = matching answers.",
    ],

    inviteTitle: "Invite a friend",

    inviteDescription:
      "Send a 30-second invite. Your friend sees a notification to accept or decline.",

    friendOnly: "You can only invite friends from your list.",

    friendListLabel: "Choose someone to invite",

    selectFriendPlaceholder: "Select a friend",

    loadingFriends: "Loading your friends...",

    noFriends: "No friends yet. Add someone first.",

    sendInvite: "Send 30s invite",

    inviteSent: "Invite sent to {name}.",

    incomingInvite: "{name} invited you to MatchMind",

    incomingTitle: "Incoming game invites",

    incomingSubtitle: "Accept here to jump in without leaving the page.",

    acceptInvite: "Accept",

    declineInvite: "Decline",

    cancel: "Cancel",

    inviteCountdown: "Invite expires in {seconds}s",

    markAccepted: "Mark as accepted",

    markDeclined: "Mark as declined",

    inviteAccepted: "{name} accepted! Start when you're ready.",

    incomingAccepted: "You accepted the invite from {name}",

    inviteDeclined: "{name} declined the invite.",

    inviteCanceled: "{name} canceled this invite.",

    inviteExpired: "Invite expired. Send another?",

    startGame: "Start game",

    startEasy: "Start (Easy)",

    startHard: "Start (Hard)",

    selectDifficulty: "Choose a difficulty to begin",

    easyMode: "Easy",

    hardMode: "Hard",

    gameStarting: "Game starting",

    gameTitle: "Playing MatchMind",

    questionCounter: "Question {index} of {total}",

    sharedScore: "Shared score",

    waitingFriend: "Waiting for your friend to lock an answer...",

    waitingResponse: "Waiting for your friend to respond to the invite...",

    waitingHost: "Waiting for host to start the game...",

    friendLocked: "Friend locked their answer",

    timePerQuestion: "10s per question",

    resultsTitle: "Results",

    resultsDescription: "Your shared score is based on matching answers.",

    playAgain: "Exit game",

    gameEnded: "Game ended by the other player.",

    resultRemark: {
      perfect:
        "You two read each other like poetry—celebrate that flawless mind-sync!",

      excellent:
        "That rhythm is undeniable. Keep the banter flowing; sparks are imminent.",

      solid:
        "Plenty of overlap already; a few more chats and you’ll be unstoppable.",

      warmup: "The vibe is forming. Swap a playlist or two and try again soon.",

      retry:
        "Every duo starts somewhere. Treat this as a blooper reel and dive back in.",
    },

    shareAnswers: "Share answers",

    shareAnswersSending: "Sharing...",

    shareAnswersShared: "Shared",

    shareAnswersStatus: "Shared! We'll ping your friend.",

    shareAnswersToast: "Shared your answers with {name}.",

    shareAnswersReceivedTitle: "{name} shared their answers",

    shareAnswersReceivedSubtitle: "Here's what they picked for each question.",

    shareAnswersReceivedToast: "{name} just shared their answers.",

    shareAnswersEmpty: "No answers shared yet.",

    shareAnswersError: "Need an active game to share answers.",

    answerLabel: {
      you: "You",

      friend: "{name}'s pick",

      friendFallback: "Friend",

      none: "No answer",
    },

    matchLabel: "Matched",

    missLabel: "Different picks",
  },

  truthOrLiar: {
    title: "Truth or Lie",

    subtitle:
      "Write three statements per question and see if your friend spots the lie.",

    badgeModes: "3 or 5 questions",

    badgeCustomDeck: "Host-written deck",

    badgeLive: "Live invite room",

    inviteTitle: "Invite a friend",

    inviteDescription:
      "Send a 30-second invite. After they accept, share your custom deck instantly.",

    friendOnly: "Invites only work with people in your friends list.",

    friendListLabel: "Choose a friend",

    selectFriendPlaceholder: "Select a friend",

    loadingFriends: "Loading friends...",

    noFriends: "No friends yet. Add someone first.",

    sendInvite: "Send 30s invite",

    cancelInvite: "Cancel",

    inviteCountdown: "Invite expires in {seconds}s",

    waitingResponse: "Waiting for your friend to respond...",

    inviteAccepted: "{name} accepted! Choose a mode and write your deck.",

    incomingAccepted: "You accepted the invite from {name}",

    inviteDeclined: "{name} declined the invite.",

    inviteExpired: "Invite expired. Send another?",

    inviteSent: "Invite sent to {name}.",

    inviteSendFailed: "Couldn't start the invite. Try again.",

    incomingInvite: "{name} invited you to Truth or Lie",

    incomingTitle: "Incoming game invites",

    incomingSubtitle: "Accept here to hop in without leaving the page.",

    acceptInvite: "Accept",

    declineInvite: "Decline",

    comingSoonTitle: "Truth or Lie is coming soon",

    comingSoonSubtitle: "Stay tunedâ€”this game will be available shortly.",

    plusOnly: "Only Plus or Admin can host invites.",

    needFriend: "Pick a friend to send the invite.",

    deckTitle: "Write your questions",

    deckSubtitle:
      "Each question needs three statements. Mark which one is the lie.",

    deckIncomplete: "Fill all questions and mark the lie before starting.",

    deckReady: "Deck is ready to send.",

    modeLabel: "Mode",

    shortMode: "3 questions",

    longMode: "5 questions",

    questionLabel: "Question {index}",

    promptLabel: "Question prompt",

    promptPlaceholder: "E.g. three facts about your week",

    statementLabel: "Statement {index}",

    statementPlaceholder: "Statement {index}",

    lieMarkLabel: "Lie",

    lieMarkHint: "Mark the lie",

    startGame: "Start & send deck",

    waitingHost: "Waiting for host to start the game...",

    gameStarting: "Game starting",

    friendFallback: "Friend",

    friendLabel: "{name}'s pick",

    youLabel: "Your pick",

    questionCounter: "Question {index} of {total}",

    pickLiePrompt: "Which statement is the lie?",

    waitingFriendChoice: "Waiting for your friend to choose...",

    reviewTitle: "Selections",

    reviewDescriptionHost: "Your friend's picks are highlighted below.",

    reviewDescriptionGuest: "Here's what you chose as the lie.",

    lieTag: "Lie",

    truthTag: "Truth",

    playAgain: "Back to lobby",

    exitGame: "Exit game",

    resultsHeader: "Results",

    answeredCount: "{count}/{total} answered",

    modeBadgeShort: "3-question deck",

    modeBadgeLong: "5-question deck",

    guestHint: "The host will send their statements once they start the game.",

    gameEnded: "Game ended by the other player.",
  },

  profile: {
    yearsOld: "years old",

    birthDate: "Birth date",

    birthPlace: "Birthplace",

    education: "Education",

    hobbies: "Hobbies",

    pets: "Pets",

    favoritePerfume: "Favorite perfume",

    height: "Height",

    connections: "{count} connections",

    connectionHint: "Building your circle helps unlock more matches.",

    editTitle: "Your home space",

    editSubtitle: "Update your details to get better matches.",

    saveButton: "Save changes",

    saving: "Saving...",

    updated: "Profile updated successfully!",

    passwordTitle: "Change password",

    passwordSubtitle: "Keep your account secure by updating it regularly.",

    passwordCurrent: "Current password",

    passwordNew: "New password",

    passwordConfirm: "Confirm new password",

    passwordHint: "Use at least 8 characters.",

    passwordSubmit: "Update password",

    passwordSaving: "Updating...",

    passwordSuccess: "Password updated successfully!",

    passwordMismatch: "New passwords do not match.",

    passwordError: "Unable to update password. Please try again.",

    message: "Message",

    removeFriend: "Remove friend",

    addFriend: "Add friend",

    cancelRequest: "Cancel request",

    requestSentStatus: "Request sent",

    respondRequest: "Check notifications to respond",

    requestSentToast: "Friend request sent!",

    requestError: "Unable to send request.",

    requestCancelToast: "Friend request cancelled.",

    requestCancelError: "Unable to cancel request.",

    unfriendSuccess: "Friend removed.",

    unfriendError: "Unable to remove friend.",
  },

  onboarding: {
    title: "Complete Your Profile",

    profilePlaceholder: "Profile Preview",

    randomAvatar: "Generate Random Avatar",

    uploadPhoto: "Upload Photo",

    fullName: "Full Name / Nickname",

    bio: "Short Bio (optional)",

    bioPlaceholder: "Share a quick intro about yourself.",

    gender: "Gender",

    genderPlaceholder: "Select your gender",

    genderOptions: {
      female: "Female",

      male: "Male",

      nonBinary: "Non-binary",

      preferNotSay: "Prefer not to say",
    },

    birthDate: "Date of Birth",

    country: "Country",

    countryPlaceholder: "Where are you living?",

    city: "City",

    cityPlaceholder: "City you live in",

    cityDisabledPlaceholder: "Select a country first",

    birthCountryLabel: "Birth country",

    birthCountryPlaceholder: "Select where you were born",

    birthCityLabel: "Birth city / province",

    birthCityPlaceholder: "Select your birth city",

    countryOptions: {
      vietnam: "Vietnam",

      germany: "Germany",

      japan: "Japan",

      australia: "Australia",
    },

    cityOptions: {
      vietnam: {
        cantho: "Can Tho",

        dalat: "Da Lat",

        danang: "Da Nang",

        haiphong: "Hai Phong",

        hanoi: "Hanoi",

        hcmc: "Ho Chi Minh City",

        hue: "Hue",

        namdinh: "Nam Dinh",

        nghean: "Nghe An",

        ninhbinh: "Ninh Binh",

        quynhon: "Quy Nhon",

        thanhhoa: "Thanh Hoa",

        vinh: "Vinh",

        vungtau: "Vung Tau",
      },

      germany: {
        berlin: "Berlin",

        bonn: "Bonn",

        bremen: "Bremen",

        dresden: "Dresden",

        dusseldorf: "Dusseldorf",

        frankfurt: "Frankfurt",

        hanover: "Hanover",

        hamburg: "Hamburg",

        koln: "Cologne",

        leipzig: "Leipzig",

        munich: "Munich",

        nurnberg: "Nuremberg",

        stuttgart: "Stuttgart",

        essen: "Essen",

        dortmund: "Dortmund",

        bochum: "Bochum",

        karlsruhe: "Karlsruhe",

        aachen: "Aachen",

        freiburg: "Freiburg",

        regensburg: "Regensburg",
      },

      japan: {
        fukuoka: "Fukuoka",

        hiroshima: "Hiroshima",

        kobe: "Kobe",

        kyoto: "Kyoto",

        nagoya: "Nagoya",

        osaka: "Osaka",

        sapporo: "Sapporo",

        sendai: "Sendai",

        tokyo: "Tokyo",

        yokohama: "Yokohama",
      },

      australia: {
        adelaide: "Adelaide",

        brisbane: "Brisbane",

        canberra: "Canberra",

        goldcoast: "Gold Coast",

        melbourne: "Melbourne",

        perth: "Perth",

        sydney: "Sydney",
      },
    },

    birthCountryOptions: {
      vietnam: "Vietnam",
    },

    birthCityOptions: {
      vietnam: {
        hanoi: "Hanoi",

        hochiminh: "Ho Chi Minh City",

        haiphong: "Hai Phong",

        danang: "Da Nang",

        cantho: "Can Tho",

        thuathienhue: "Thua Thien Hue",

        khanhhoa: "Khanh Hoa",

        binhdinh: "Binh Dinh",

        nghean: "Nghe An",

        daklak: "Dak Lak",

        lamdong: "Lam Dong",

        dongnai: "Dong Nai",

        binhduong: "Binh Duong",

        quangninh: "Quang Ninh",

        thanhhoa: "Thanh Hoa",

        haiduong: "Hai Duong",

        namdinh: "Nam Dinh",

        thainguyen: "Thai Nguyen",

        phutho: "Phu Tho",

        kiengiang: "Kien Giang",

        bacninh: "Bac Ninh",

        bacgiang: "Bac Giang",

        hanam: "Ha Nam",

        ninhbinh: "Ninh Binh",

        hatinh: "Ha Tinh",

        quangbinh: "Quang Binh",

        quangtri: "Quang Tri",

        quangngai: "Quang Ngai",

        binhthuan: "Binh Thuan",

        angiang: "An Giang",
      },
    },

    height: "Height",

    heightPlaceholder: "e.g. 170 cm",

    education: "Education",

    educationPlaceholder: "Highest level or current status",

    educationOptions: {
      highSchool: "High school graduate",

      university: "University",

      vocational: "Vocational training",

      working: "Working professional",
    },

    hobbies: "Hobbies",

    hobbiesPlaceholder: "What excites you? (comma separated)",

    hobbyOptions: {
      music: "Music & concerts",

      travel: "Traveling",

      cooking: "Cooking & baking",

      gaming: "Video games",

      reading: "Reading",

      fitness: "Fitness & gym",

      photography: "Photography",

      art: "Art & design",

      movies: "Movies & series",

      outdoors: "Hiking & outdoors",
    },

    pets: "Pets",

    petsPlaceholder: "Tell us about your pets",

    petOptions: {
      dog: "Dog",

      cat: "Cat",

      hamster: "Hamster",

      bird: "Bird",

      fish: "Fish",
    },

    favoritePerfume: "Favorite perfume",

    favoritePerfumePlaceholder: "Share a scent you love",

    selectedLabel: "Selected: {items}",

    optional: "Optional",

    completeButton: "Complete Onboarding",

    completing: "Onboarding...",
  },

  errorPage: {
    title: "Something went wrong",
    description: "This page hit an unexpected error. Reloading usually fixes it.",
    reload: "Reload page",
    home: "Go to home",
  },

  notFound: {
    title: "Page not found",
    description: "The page you are looking for does not exist or has moved.",
    home: "Back to home",
  },

  connection: {
    reconnecting: "Reconnecting...",
    paused: "Live updates paused while you are away. Move the mouse to resume.",
  },

  accountDeletion: {
    title: "Delete account",
    description:
      "Permanently delete your account, profile, photo, friends, chats and reports. This cannot be undone.",
    open: "Delete my account",
    confirmTitle: "Delete your account?",
    confirmText:
      "All your data will be removed immediately and cannot be recovered. Enter your password to confirm.",
    passwordLabel: "Password",
    confirm: "Delete permanently",
    deleting: "Deleting...",
    cancel: "Cancel",
    success: "Your account has been deleted.",
    error: "Could not delete the account.",
  },

  suspension: {
    message: "This account is suspended until {date}.",
    permanent: "This account is permanently suspended.",
    reason: "Reason: {reason}",
  },

  verification: {
    resend: "Resend code",
    resendIn: "Resend code in {seconds}s",
    resent: "A new code has been sent to {email}.",
  },

  adminBan: {
    suspend: "Suspend",
    lift: "Lift suspension",
    suspendedUntil: "Suspended until {date}",
    suspendedPermanent: "Suspended permanently",
    dialogTitle: "Suspend {name}",
    duration: "Duration",
    days1: "1 day",
    days7: "7 days",
    days30: "30 days",
    permanent: "Permanent",
    reasonLabel: "Reason (shown to the user)",
    confirm: "Suspend account",
    cancel: "Cancel",
    suspendedToast: "Account suspended",
    liftedToast: "Suspension lifted",
    error: "Action failed",
  },

  language: {
    randomAvatarToast: "Random profile picture generated!",
  },

  avatarUpload: {
    button: "Upload photo",
    hint: "JPEG, PNG, WebP or HEIC",
    previewTitle: "New profile picture",
    previewNote: "This is how your photo will look. It is cropped to a square from the center.",
    noPreview: "This browser can't preview this photo (e.g. HEIC). It will be checked and converted after upload.",
    preparing: "Preparing photo...",
    save: "Use this photo",
    saving: "Uploading...",
    cancel: "Cancel",
    success: "Profile picture updated!",
    errors: {
      unsupportedType: "Please choose a JPEG, PNG, WebP or HEIC image.",
      sourceTooLarge: "This file is too large ({max} MB max).",
      tooLargeUndecodable: "This HEIC photo is larger than 5 MB. Please choose a JPEG/PNG or a smaller photo.",
      FILE_TOO_LARGE: "The image must be 5 MB or smaller.",
      UNSUPPORTED_TYPE: "This file is not a valid JPEG, PNG, WebP or HEIC image.",
      TOO_LARGE_DIMENSIONS: "The photo dimensions are too large. Please choose a smaller photo.",
      UNREADABLE_IMAGE: "The image is damaged or can't be read. Please try another photo.",
      RATE_LIMITED: "Too many uploads. Please wait a few minutes and try again.",
      SERVER_BUSY: "The server is busy. Please try again in a few seconds.",
      network: "Upload failed. Please check your connection and try again.",
      generic: "Could not upload the photo. Please try again.",
    },
  },

  tarot: {
    title: "Tarot Reading",

    subtitle: "Accumulate {required} energy (+1 per day) before drawing cards.",

    energy: {
      summary: "Energy: {current}/{max}",

      regenHint: "+1 energy per day. Last refill: {date}",

      pendingDate: "...",
    },

    buttons: {
      draw: "Draw Cards",

      consuming: "Consuming...",

      clear: "Clear Table",

      clearing: "Clearing...",

      refill: "Refill Energy",

      refilling: "Refilling...",
    },

    cards: {
      title: "Drawn Cards",

      tapHint: "Tap each card to draw it after entering your questions.",

      placeholder: "placeholder",

      reversed: " (reversed)",

      backAlt: "Card back",
    },

    questions: {
      title: "Your Questions",

      instructions: "Match questions with card order (left to right).",

      label: "Question {number}",

      placeholder: "Enter question {number}",

      submit: "Get Reading",

      submitting: "Reading...",
    },

    results: {
      title: "Messages for You",

      aiTitle: "AI Message",

      questionPrefix: "Q{index}:",

      cardLabel: "Card",

      adviceLabel: "Advice",
    },

    errors: {
      needQuestionsBeforeDraw: "Please enter all 3 questions before drawing.",

      loadingEnergy: "Loading energy status...",

      needEnergy:
        "You need {required} energy to draw (current {current}/{required}).",

      noDeck: "Deck not found.",

      consumeFailed: "Unable to consume energy.",

      notEnoughCards: "Not enough cards to draw.",

      needSituationBeforeDraw:
        "Please describe your current situation before drawing cards.",

      needSituation:
        "Please describe your current situation before requesting a reading.",

      needQuestions: "Please enter all 3 questions.",

      needDrawnCards: "Please draw all 3 cards first.",

      refillFailed: "Unable to refill energy.",

      readingFailed: "Unable to get the reading, please try again.",
    },
  },

  admin: {
    title: "Admin Console",

    subtitle: "Review user accounts and adjust privileges.",

    filters: {
      searchLabel: "Search",

      searchPlaceholder: "Search by name...",

      typeLabel: "Filter by type",

      allTypes: "All types",
    },

    users: {
      heading: "Accounts",

      name: "Name",

      email: "Email",

      accountType: "Account type",

      saveChanges: "Save change",

      empty: "No users to display.",

      noResults: "No users match your filters.",

      visibleCount: "Showing {visible} of {total} matches.",
    },

    accountTypes: {
      standard: "Standard",

      plus: "Plus",

      admin: "Admin",
    },

    messages: {
      updated: "Account type updated.",

      updateFailed: "Unable to update account type.",
    },

    usage: {
      heading: "Feature usage",

      description:
        "Live counters for how often each feature has been completed.",

      tarot: "Tarot readings",

      fortune: "Fortune cookies opened",

      matchmind: "MatchMind sessions",

      truthOrLie: "Truth or Lie sessions",
    },

    notifications: {
      heading: "Send notifications",

      description:
        "Send a short notice to everyone or a specific user. Notifications will appear in their Notifications page and auto-delete after 3 days if they are not cleared.",

      audienceLabel: "Audience",

      audienceAll: "All users",

      audienceSingle: "Specific user by email",

      emailLabel: "Recipient email",

      messageLabel: "Message",

      messagePlaceholder: "Share a short update or reminder...",

      counterLabel: "Auto-removes after {days} days â€¢ {count}/500",

      footerHint:
        "Notifications are posted immediately and will expire after {days} days by default.",

      sendButton: "Send notification",

      success: "Notification sent",

      error: "Failed to send notification",

      validation: {
        messageRequired: "Message is required",

        emailRequired: "Email is required for a single user",
      },
    },

    reports: {
      heading: "User reports",

      description: "Reports submitted from the friends page appear here.",

      empty: "No reports yet.",

      resolveAction: "Mark resolved",

      resolveSuccess: "Report marked as resolved.",

      resolveError: "Unable to resolve report.",

      deleteAction: "Delete report",

      deleteSuccess: "Report deleted.",

      deleteError: "Unable to delete report.",

      reportedBy: "Reported by {name}",

      createdAt: "Filed {date}",

      resolvedAt: "Resolved {date}",

      status: {
        pending: "Pending",

        resolved: "Resolved",
      },

      unknownUser: "Unknown user",
    },
  },

  passwordField: {
    show: "Show password",
    hide: "Hide password",
    strengthLabel: "Password strength",
    levels: {
      tooShort: "too short (min. 8 characters)",
      weak: "weak",
      fair: "fair",
      good: "good",
      strong: "strong",
    },
    hint: "use 12+ characters and mix letters, numbers and symbols",
  },

  chatStatus: {
    sending: "Sending…",
    sent: "Sent",
    seen: "Seen",
  },

  pushNotifications: {
    title: "Message notifications",
    description: "Get a notification on this device when someone messages you while LofiTalk is closed.",
    on: "On",
    off: "Off",
    enabledToast: "Notifications are on for this device.",
    disabledToast: "Notifications are off for this device.",
    error: "Could not change notifications. Please try again.",
    denied: "Notifications are blocked for this site. Allow them in your browser's site settings, then reload the page.",
    unsupported: "This browser does not support notifications.",
    iosHint: "On iPhone/iPad: tap Share → Add to Home Screen, open LofiTalk from the home screen, then turn notifications on here.",
  },

  a11y: {
    settings: "Settings",
    logout: "Log out",
    myProfile: "My profile",
    chatOptions: "Chat options",
    accountTypeFor: "Account type for {name}",
    sendMessage: "Send message",
    messageInput: "Message",
  },
};

export default english;
