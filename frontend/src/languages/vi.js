// Vietnamese UI strings. Loaded on demand (see translations.js).
const vietnamese = {
  common: {
    loading: "Đang tải...",

    prev: "Trang trước",

    next: "Trang sau",

    send: "Gửi",

    messagePlaceholder: "Nhập tin nhắn...",

    cancel: "Hủy",

    presence: {
      online: "Đang trực tuyến",

      offline: "Hoạt động {timeAgo}",

      offlineUnknown: "Ngoại tuyến",
    },
  },

  auth: {
    signupLogoTagline: "Chậm lại một nhịp và tìm góc trò chuyện ấm áp của bạn.",

    signupTitle: "Tạo tài khoản",

    signupSubtitle:
      "Tham gia LofiTalk để trôi vào những cuộc trò chuyện nhẹ nhàng và gặp gỡ những tâm hồn đồng điệu.",

    fullName: "Họ tên / Nickname",

    email: "Email",

    password: "Mật khẩu",

    passwordHint: "Mật khẩu cần dài ít nhất 8 ký tự",

    termsPrefix: "Tôi đồng ý với",

    termsOfService: "điều khoản dịch vụ",

    privacyPolicy: "chính sách bảo mật",

    and: "và",

    createAccount: "Tạo tài khoản",

    alreadyHaveAccount: "Đã có tài khoản? ",

    signIn: "Đăng nhập",

    loginTitle: "Chào mừng trở lại",

    loginSubtitle:
      "Đăng nhập để tiếp tục những cuộc trò chuyện bình yên của bạn.",

    signInButton: "Đăng nhập",

    dontHaveAccount: "Chưa có tài khoản? ",

    createOne: "Tạo ngay",

    signupIllustrationTitle: "Tạo vòng bạn bè ấm áp",

    signupIllustrationSubtitle:
      "Chia sẻ khoảnh khắc, trao đổi cảm xúc và tận hưởng những cuộc trò chuyện nhẹ nhàng bất cứ lúc nào.",

    verificationTitle: "Kiểm tra hộp thư",

    verificationSubtitle:
      "Chúng tôi đã gửi mã 6 chữ số đến {email}. Nhập mã bên dưới để hoàn tất tạo tài khoản.",

    verificationCodeLabel: "Mã xác thực",

    verificationSubmit: "Xác thực & tiếp tục",

    verificationResendHint:
      "Chưa nhận được mã? Quay lại và gửi lại biểu mẫu để nhận mã mới.",

    verificationBack: "Quay lại biểu mẫu đăng ký",

    verificationEmailSent: "Chúng tôi vừa gửi mã xác thực tới email của bạn.",

    verificationSuccess: "Xác thực email thành công! Đang chuyển hướng...",
  },

  home: {
    welcomeTitle: "Chào mừng đến với LofiTalk",

    welcomeSubtitle:
      "Bắt đầu trao đổi ngôn ngữ, quản lý bạn bè, khám phá bạn mới và kiểm tra thông báo.",

    goFriends: "Tới trang Bạn bè",

    goNotifications: "Tới Thông báo",

    startChat: "Bắt đầu trò chuyện",

    yourFriends: "Bạn bè của bạn",

    friendRequests: "Lời mời kết bạn",

    meetTitle: "Gặp những người bạn nhẹ nhàng mới",

    meetSubtitle: "Tìm người trò chuyện hợp vibe dựa trên hồ sơ của bạn.",

    noRecommendations: "Chưa có gợi ý nào",

    checkLater: "Hãy quay lại sau để tìm thêm bạn học và bạn trò chuyện!",

    requestSent: "Đã gửi lời mời",

    cancelRequest: "Hủy lời mời",

    sendRequest: "Gửi lời mời kết bạn",

    pendingFromThem:
      "Người này đã gửi lời mời cho bạn. Hãy trả lời trong mục Thông báo.",
  },

  chatHome: {
    empty: "Chưa có cuộc trò chuyện nào",

    emptyHint:
      "Hãy bắt đầu chat từ trang cá nhân của ai đó, cuộc trò chuyện của bạn sẽ hiện ở đây.",

    noMessages: "Chưa có tin nhắn",
  },

  chatPage: {
    clearForMe: "Xóa toàn bộ đoạn chat (chỉ phía bạn)",

    clearing: "Đang xóa...",

    clearSuccess: "Đã xóa đoạn chat phía bạn",

    clearError: "Không thể xóa đoạn chat",

    blockedTitle: "Không thể mở đoạn chat",

    blockedDescription:
      "Đoạn chat này bị ẩn vì một trong hai người đã chặn nhau.",

    backToList: "Quay lại danh sách chat",
  },

  friends: {
    filters: {
      energyTitle: "Năng lượng chung (dùng với Tarot)",

      energyHint: "Mỗi lần lọc sẽ tiêu tốn 1 năng lượng.",

      applyHint:
        "Bộ lọc áp dụng cho mục gợi ý. Tối đa 3 hồ sơ phù hợp được hiển thị cho mỗi lần dùng năng lượng.",

      applyError: "Không thể tải gợi ý. Vui lòng thử lại.",

      emptyState: "Hãy thiết lập bộ lọc vibe rồi áp dụng để khám phá bạn mới.",

      reset: "Đặt lại",

      apply: "Áp dụng bộ lọc",

      genderLabel: "Giới tính",

      countryLabel: "Quốc gia đang sống",

      cityLabel: "Thành phố đang sống",

      birthCountryLabel: "Quốc gia nơi sinh",

      birthCityLabel: "Tỉnh/thành nơi sinh",

      heightLabel: "Chiều cao tối thiểu (cm)",

      heightPlaceholder: "vd: 160",

      educationLabel: "Học vấn",

      hobbyLabel: "Sở thích",

      petLabel: "Thú cung",

      anyOption: "Bất kỳ",

      energyError: "Không đủ năng lượng. Hãy nạp thêm trong Tarot.",
    },

    blockAction: "Chặn",

    blockConfirm:
      "Chặn người này? Họ sẽ không thể gửi lời mời kết bạn hoặc nhắn tin cho bạn nữa.",

    blockSuccess: "Đã chặn người dùng.",

    blockError: "Không thể chặn người dùng.",

    unblockAction: "Bỏ chặn",

    unblockSuccess: "Đã bỏ chặn.",

    unblockError: "Không thể bỏ chặn.",

    blockedTitle: "Danh sách đã chặn",

    blockedSubtitle:
      "Những người bạn chặn sẽ hiển thị tại đây và không thể liên lạc với bạn nữa.",

    blockedEmpty: "Bạn chưa chặn ai.",

    blockMenuLabel: "Tùy chọn khác",

    reportAction: "Báo cáo",

    reportTitle: "Báo cáo người dùng",

    reportTargetLabel: "Báo cáo {name}",

    reportDescription: "Hãy viết ngắn gọn lý do báo cáo (tối đa {limit} từ).",

    reportPlaceholder: "Ví dụ: Người này gửi tin nhắn không phù hợp...",

    reportWordCounter: "{count}/{limit} từ",

    reportTooLong: "Vượt quá giới hạn từ",

    reportSubmit: "Gửi báo cáo",

    reportSuccess: "Đã gửi báo cáo. Cảm ơn bạn đã phản hồi.",

    reportError: "Không thể gửi báo cáo.",
  },

  nav: {
    notifications: "Thông báo",

    theme: "Giao diện",

    language: "Ngôn ngữ",

    about: "Giới thiệu",

    version: "Phiên bản",

    developer: "Nhà phát triển",

    inspiredBy: "Lấy cảm hứng từ",

    inspiredNames: "Codesistency / Fremdchat / avocadorable / Kaytiem",
  },

  notifications: {
    title: "Thông báo",

    incoming: "Lời mời kết bạn",

    accept: "Chấp nhận",

    decline: "Từ chối",

    deleted: "Đã ẩn thông báo",

    declined: "Đã từ chối lời mời",

    statusDeclined:
      "Bạn đã từ chối lời mời này. Chúng tôi sẽ giữ lại ở đây để bạn dễ theo dõi.",

    delete: "Ẩn",

    error: "Có lỗi xảy ra. Vui lòng thử lại.",

    newConnections: "Kết nối mới",

    acceptedText: "{name} đã chấp nhận lời mời kết bạn của bạn",

    declinedSection: "Lời mời bị từ chối",

    declinedText: "{name} đã từ chối lời mời kết bạn của bạn",

    recently: "Gần đây",

    newFriend: "Bạn mới",

    adminTitle: "Thông báo từ admin",

    adminExpireHint: "Tự xóa sau {days} ngày",

    expiresOn: "Hết hạn {date}",

    fromAdmin: "Từ admin",

    datingConfession: {
      badge: "Fanpage Facebook",
      title: "Dating Confession",
      description:
        "Ghé thăm fanpage Dating Confession để chia sẻ câu chuyện của các bạn nhé!",
      cta: "Đến fanpage",
    },
  },

  sidebar: {
    home: "Trang chủ",

    friends: "Bạn bè",

    notifications: "Thông báo",

    mystic: "Huyền bí",

    tarot: "Tarot",

    games: "Trò chơi",

    matchMind: "MatchMind",

    matchMindComingSoon: "MatchMind (sắp ra mắt)",

    truthOrLiar: "Truth or Lie",

    admin: "Quản trị",

    chat: "Tin nhắn",

    fortune: {
      linkLabel: "Bánh quy may mắn",

      title: "Nghi thức bánh quy may mắn",

      subtitle: "Bấm mở bánh để nhận một lời nhắn dễ thương.",

      pageDescription:
        "Mỗi lần bấm là một lời nhắc nhở được viết riêng cho nhịp sống chậm rãi của bạn. Hít sâu, mỉm cười và để lời nhắn dẫn lối.",

      hint: "Chạm để bẻ đôi",

      openedHint:
        "Bạn đã mở bánh hôm nay rồi. Hãy quay lại vào ngày mai để nhận lời nhắn mới nhé.",

      newFortune: "Đặt lại bánh",

      fallback: "Hít sâu, mỉm cười và tin vào nhịp sống của riêng bạn.",

      shareHint:
        "Thích lời nhắn này? Hãy chia sẻ với một người bạn cũng cần nguồn năng lượng này.",

      ritualSteps: [
        "Nhẹ nhàng đặt ra một ý định hoặc câu hỏi trong đầu.",

        "Chạm vào chiếc bánh phát sáng và xem nó mở ra đầy nhiệm màu.",

        "Giữ lời nhắn bên mình và lan tỏa năng lượng bình yên ấy cho người khác.",
      ],
    },

    mobileApp: {
      linkLabel: "Ứng dụng di động",
    },
  },

  mobileAppPage: {
    heroBadge: "Ứng dụng di động",

    heroTitle: "LofiTalk luôn bên bạn",

    heroSubtitle:
      "Mang theo những cuộc trò chuyện ấm áp, năng lượng tarot và lời nhắc nhở nhẹ nhàng dù bạn ở đâu.",

    downloadButton: "Mở ứng dụng di động",

    downloadUnavailable: "Link tải sẽ có sớm",

    downloadHint:
      "Hoạt động trên iOS và Android thông qua trình khởi chạy beta của chúng tôi.",

    availabilityNote: "Hiện chỉ hỗ trợ thiết bị Android.",

    qrTitle: "Quét QR để tải nhanh",

    qrDescription:
      "Dùng camera điện thoại quét mã để mở link APK ngay lập tức.",

    featuresTitle: "Thiết kế cho những kết nối chậm rãi, mindful",

    features: [
      "Thông báo theo thời gian thực để bạn không bỏ lỡ những lời hỏi thăm nhẹ nhàng.",

      "Đồng bộ đầy đủ với hồ sơ web, năng lượng tarot và fortune cookie của bạn.",

      "Giao diện gọn nhẹ, giúp chat và ghi âm mượt mà ở mọi nơi.",
    ],

    stepsTitle: "Cách nhận bản beta",

    steps: [
      "Bấm nút phía trên để mở link ứng dụng LofiTalk.",

      "Làm theo hướng dẫn cài đặt cho thiết bị của bạn và chấp nhận hồ sơ beta nếu cần.",

      "Đăng nhập bằng cùng tài khoản bạn dùng trên web để giữ mọi thứ đồng bộ.",
    ],
  },

  matchMind: {
    title: "Mini game MatchMind",

    subtitle:
      "Rủ bạn thân trả lời 10 câu hỏi nhanh và xem hai bạn hợp ý đến đâu.",

    comingSoonTitle: "MatchMind sắp ra mắt",

    comingSoonSubtitle:
      "Người dùng Plus hoặc Admin có thể trải nghiệm game ngay bây giờ.",

    howItWorksTitle: "Cách chơi",

    liveOnly:
      "Khi trận bắt đầu, chỉ màn hình trò chơi được hiển thị để hai bạn tập trung.",

    steps: [
      "Chọn một người bạn và gửi lời mời trong 30 giây qua thông báo.",

      "Nếu họ chấp nhận kịp, cả hai sẽ vào phòng và chủ phòng có thể bắt đầu.",

      "Mỗi lượt có 4 lựa chọn và 10 giây. Điểm chung = số câu trả lời trùng nhau.",
    ],

    inviteTitle: "Mời bạn bè",

    inviteDescription:
      "Gửi lời mời trong 30 giây. Bạn của bạn sẽ nhận thông báo để chấp nhận hoặc từ chối.",

    friendOnly: "Chỉ mời được người trong danh sách bạn bè.",

    friendListLabel: "Chọn người để mời",

    selectFriendPlaceholder: "Chọn một người bạn",

    loadingFriends: "Đang tải danh sách bạn bè...",

    noFriends: "Chưa có bạn nào. Hãy thêm bạn trước đã.",

    sendInvite: "Gửi lời mời 30s",

    inviteSent: "Đã gửi lời mời cho {name}.",

    incomingInvite: "{name} mời bạn chơi MatchMind",

    incomingTitle: "Lời mời trận đấu đến",

    incomingSubtitle:
      "Chấp nhận ngay tại đây để vào phòng mà không cần rời trang.",

    acceptInvite: "Chấp nhận",

    declineInvite: "Từ chối",

    cancel: "Hủy",

    inviteCountdown: "Lời mời hết hạn sau {seconds}s",

    markAccepted: "Đánh dấu đã chấp nhận",

    markDeclined: "Đánh dấu đã từ chối",

    inviteAccepted: "{name} đã chấp nhận! Bắt đầu khi bạn sẵn sàng.",

    incomingAccepted: "Bạn đã chấp nhận lời mời từ {name}",

    inviteDeclined: "{name} đã từ chối lời mời.",

    inviteCanceled: "{name} đã hủy lời mời này.",

    inviteExpired: "Lời mời đã hết hạn. Gửi lại nhé?",

    startGame: "Bắt đầu chơi",

    startEasy: "Làm quen nhau",

    startHard: "Tìm hiểu sâu",

    selectDifficulty: "Chọn độ khó để bắt đầu",

    easyMode: "Dễ",

    hardMode: "Khó",

    gameStarting: "Đang bắt đầu",

    gameTitle: "Đang chơi MatchMind",

    questionCounter: "Câu {index}/{total}",

    sharedScore: "Điểm chung",

    waitingFriend: "Đang chờ đối phương khóa đáp án...",

    waitingResponse: "Đang chờ bạn phản hồi lời mời...",

    waitingHost: "Đang chờ chủ phòng bắt đầu trận...",

    friendLocked: "Đối phương đã khóa đáp án",

    timePerQuestion: "10s mỗi câu",

    resultsTitle: "Kết quả",

    resultsDescription:
      "Điểm chung của hai bạn dựa trên số câu trả lời trùng nhau.",

    playAgain: "Thoát game",

    gameEnded: "Đối phương đã kết thúc trận.",

    resultRemark: {
      perfect: "Hai bạn hiểu nhau như thơ, đúng kiểu tâm giao luôn đó!",

      excellent:
        "Nhịp trò chuyện hợp quá trời, nói thêm chút nữa là sparks nổ tung.",

      solid:
        "Đã có kha khá điểm chung rồi, trò chuyện thêm xíu là vào nhịp ngay.",

      warmup:
        "Vibe đang hình thành. Đổi playlist với nhau rồi làm lại vòng khác nhé.",

      retry:
        "Đôi nào cũng có màn mở đầu lóng ngóng. Xem đây như hậu trường vui và thử lại thôi.",
    },

    shareAnswers: "Chia sẻ đáp án",

    shareAnswersSending: "Đang chia sẻ...",

    shareAnswersShared: "Đã chia sẻ",

    shareAnswersStatus:
      "Bạn đã chia sẻ đáp án, chúng tôi sẽ báo cho đối phương.",

    shareAnswersToast: "Đã chia sẻ đáp án của bạn cho {name}.",

    shareAnswersReceivedTitle: "{name} vừa chia sẻ đáp án",

    shareAnswersReceivedSubtitle:
      "Đây là những lựa chọn họ đã khóa ở từng câu.",

    shareAnswersReceivedToast: "{name} vừa chia sẻ đáp án.",

    shareAnswersEmpty: "Chưa có đáp án nào được chia sẻ.",

    shareAnswersError: "Bạn cần trận đấu đang mở để chia sẻ đáp án.",

    answerLabel: {
      you: "Bạn",

      friend: "Lựa chọn của {name}",

      friendFallback: "Đối phương",

      none: "Chưa trả lời",
    },

    matchLabel: "Trùng khớp",

    missLabel: "Khác lựa chọn",
  },

  truthOrLiar: {
    title: "Truth or Lie",

    subtitle:
      "Viết 3 câu cho mỗi câu hỏi và xem bạn của bạn có đoán ra đâu là lời nói dối không.",

    badgeModes: "3 hoặc 5 câu hỏi",

    badgeCustomDeck: "Bộ câu hỏi tự viết",

    badgeLive: "Phòng mời trực tiếp",

    inviteTitle: "Mời bạn bè",

    inviteDescription:
      "Gửi lời mời trong 30 giây. Khi họ chấp nhận, bạn chia sẻ bộ câu hỏi ngay lập tức.",

    friendOnly: "Chỉ gửi được người trong danh sách bạn bè.",

    friendListLabel: "Chọn bạn",

    selectFriendPlaceholder: "Chọn một người bạn",

    loadingFriends: "Đang tải danh sách bạn bè...",

    noFriends: "Chưa có bạn nào. Hãy thêm bạn trước.",

    sendInvite: "Gửi lời mời 30s",

    cancelInvite: "Hủy",

    inviteCountdown: "Lời mời hết hạn sau {seconds}s",

    waitingResponse: "Đang chờ bạn của bạn phản hồi...",

    inviteAccepted: "{name} đã chấp nhận! Chọn chế độ chơi và viết bộ câu hỏi.",

    incomingAccepted: "Bạn đã chấp nhận lời mời từ {name}",

    inviteDeclined: "{name} đã từ chối lời mời.",

    inviteExpired: "Lời mời đã hết hạn. Gửi lại nhé?",

    inviteSent: "Đã gửi lời mời cho {name}.",

    inviteSendFailed: "Không gửi được lời mời. Thử lại nhé.",

    incomingInvite: "{name} mời bạn chơi Truth or Lie",

    incomingTitle: "Lời mời trò chơi đến",

    incomingSubtitle:
      "Chấp nhận tại đây để vào phòng ngay mà không cần rời trang.",

    acceptInvite: "Chấp nhận",

    declineInvite: "Từ chối",

    comingSoonTitle: "Truth or Lie sắp ra mắt",

    comingSoonSubtitle: "Trò chơi sẽ sớm mở cho mọi người trải nghiệm.",

    plusOnly: "Chỉ người dùng Plus hoặc Admin mới được gửi lời mời.",

    needFriend: "Hãy chọn một người bạn để gửi lời mời.",

    deckTitle: "Viết câu hỏi",

    deckSubtitle:
      "Mỗi câu hỏi cần 3 phát biểu và bạn đánh dấu đâu là lời nói dối.",

    deckIncomplete:
      "Hãy điền đầy đủ các phát biểu và đánh dấu lời nói dối trước khi bắt đầu.",

    deckReady: "Bộ câu hỏi đã sẵn sàng.",

    modeLabel: "Chế độ",

    shortMode: "3 câu hỏi",

    longMode: "5 câu hỏi",

    questionLabel: "Câu hỏi {index}",

    promptLabel: "Nội dung câu hỏi",

    promptPlaceholder: "Ví dụ: 3 điều về tuần vừa rồi của bạn",

    statementLabel: "Phát biểu {index}",

    statementPlaceholder: "Phát biểu {index}",

    lieMarkLabel: "Nói dối",

    lieMarkHint: "Đánh dấu phát biểu là lời nói dối",

    startGame: "Bắt đầu & gửi bộ câu hỏi",

    waitingHost: "Đang chờ chủ phòng bắt đầu...",

    gameStarting: "Đang bắt đầu",

    friendFallback: "Bạn bè",

    friendLabel: "Lựa chọn của {name}",

    youLabel: "Lựa chọn của bạn",

    questionCounter: "Câu {index}/{total}",

    pickLiePrompt: "Câu nào là lời nói dối?",

    waitingFriendChoice: "Đang chờ bạn bè chọn...",

    reviewTitle: "Lựa chọn",

    reviewDescriptionHost: "Lựa chọn của bạn bè được tô đậm bên dưới.",

    reviewDescriptionGuest: "Đây là những gì bạn đã chọn là lời nói dối.",

    lieTag: "Nói dối",

    truthTag: "Sự thật",

    playAgain: "Quay lại sảnh",

    exitGame: "Thoát game",

    resultsHeader: "Kết quả",

    answeredCount: "{count}/{total} câu đã trả lời",

    modeBadgeShort: "Bộ 3 câu hỏi",

    modeBadgeLong: "Bộ 5 câu hỏi",

    guestHint: "Chủ phòng sẽ gửi câu hỏi khi bắt đầu trò chơi.",

    gameEnded: "Đối phương đã thoát game.",
  },

  profile: {
    yearsOld: "tuổi",

    birthDate: "Ngày sinh",

    birthPlace: "Nơi sinh",

    education: "Học vấn",

    hobbies: "Sở thích",

    pets: "Thú cung",

    favoritePerfume: "Nước hoa yêu thích",

    height: "Chiều cao",

    connections: "{count} kết nối",

    connectionHint: "Xây vòng kết nối để mở thêm cơ hội gặp gỡ.",

    editTitle: "Không gian của bạn",

    editSubtitle: "Cập nhật thông tin để nhận được gợi ý phù hợp hơn.",

    saveButton: "Lưu thay đổi",

    saving: "Đang lưu...",

    updated: "Cập nhật hồ sơ thành công!",

    passwordTitle: "Đổi mật khẩu",

    passwordSubtitle: "Thường xuyên đổi mật khẩu để tài khoản luôn an toàn.",

    passwordCurrent: "Mật khẩu hiện tại",

    passwordNew: "Mật khẩu mới",

    passwordConfirm: "Xác nhận mật khẩu mới",

    passwordHint: "Ít nhất 8 ký tự.",

    passwordSubmit: "Cập nhật mật khẩu",

    passwordSaving: "Đang cập nhật...",

    passwordSuccess: "Đổi mật khẩu thành công!",

    passwordMismatch: "Mật khẩu mới không khớp.",

    passwordError: "Không thể đổi mật khẩu. Vui lòng thử lại.",

    message: "Nhắn tin",

    removeFriend: "Hủy kết bạn",

    addFriend: "Kết bạn",

    cancelRequest: "Hủy lời mời",

    requestSentStatus: "Đã gửi lời mời",

    respondRequest: "Kiểm tra mục Thông báo để trả lời",

    requestSentToast: "Đã gửi lời mời kết bạn!",

    requestError: "Không thể gửi lời mời.",

    requestCancelToast: "Đã hủy lời mời kết bạn.",

    requestCancelError: "Không thể hủy lời mời.",

    unfriendSuccess: "Đã hủy kết bạn.",

    unfriendError: "Không thể hủy kết bạn.",
  },

  onboarding: {
    title: "Hoàn thiện hồ sơ",

    profilePlaceholder: "Xem trước hồ sơ",

    randomAvatar: "Tạo avatar ngẫu nhiên",

    uploadPhoto: "Tải ảnh lên",

    fullName: "Họ tên / Nickname",

    bio: "Giới thiệu ngắn (không bắt buộc)",

    bioPlaceholder: "Chia sẻ vài dòng ngắn gọn về bản thân.",

    gender: "Giới tính",

    genderPlaceholder: "Chọn giới tính",

    genderOptions: {
      female: "Nữ",

      male: "Nam",

      nonBinary: "Phi nhị nguyên",

      preferNotSay: "Không muốn trả lời",
    },

    birthDate: "Ngày sinh",

    country: "Quốc gia đang sống",

    countryPlaceholder: "Bạn đang sống ở đâu?",

    city: "Thành phố đang sống",

    cityPlaceholder: "Thành phố bạn đang sống",

    cityDisabledPlaceholder: "Hãy chọn quốc gia trước",

    birthCountryLabel: "Quốc gia nơi sinh",

    birthCountryPlaceholder: "Chọn nơi bạn sinh ra",

    birthCityLabel: "Tỉnh/thành nơi sinh",

    birthCityPlaceholder: "Chọn thành phố hoặc tỉnh nơi sinh",

    countryOptions: {
      vietnam: "Việt Nam",

      germany: "Đức",

      japan: "Nhật Bản",

      australia: "Úc",
    },

    cityOptions: {
      vietnam: {
        cantho: "Cần Thơ",

        dalat: "Đà Lạt",

        danang: "Đà Nẵng",

        haiphong: "Hải Phòng",

        hanoi: "Hà Nội",

        hcmc: "TP Hồ Chí Minh",

        hue: "Huế",

        namdinh: "Nam Định",

        nghean: "Nghệ An",

        ninhbinh: "Ninh Bình",

        quynhon: "Quy Nhơn",

        thanhhoa: "Thanh Hóa",

        vinh: "Vinh",

        vungtau: "Vũng Tàu",
      },

      germany: {
        berlin: "Berlin",

        bonn: "Bonn",

        bremen: "Bremen",

        dresden: "Dresden",

        dusseldorf: "Düsseldorf",

        frankfurt: "Frankfurt",

        hanover: "Hannover",

        hamburg: "Hamburg",

        koln: "Köln",

        leipzig: "Leipzig",

        munich: "Munich",

        nurnberg: "Nürnberg",

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
      vietnam: "Việt Nam",
    },

    birthCityOptions: {
      vietnam: {
        hanoi: "Hà Nội",

        hochiminh: "Thành phố Hồ Chí Minh",

        haiphong: "Hải Phòng",

        danang: "Đà Nẵng",

        cantho: "Cần Thơ",

        thuathienhue: "Thừa Thiên Huế",

        khanhhoa: "Khánh Hòa",

        binhdinh: "Bình Định",

        nghean: "Nghệ An",

        daklak: "Đắk Lắk",

        lamdong: "Lâm Đồng",

        dongnai: "Đồng Nai",

        binhduong: "Bình Dương",

        quangninh: "Quảng Ninh",

        thanhhoa: "Thanh Hóa",

        haiduong: "Hải Dương",

        namdinh: "Nam Định",

        thainguyen: "Thái Nguyên",

        phutho: "Phú Thọ",

        kiengiang: "Kiên Giang",

        bacninh: "Bắc Ninh",

        bacgiang: "Bắc Giang",

        hanam: "Hà Nam",

        ninhbinh: "Ninh Bình",

        hatinh: "Hà Tĩnh",

        quangbinh: "Quảng Bình",

        quangtri: "Quảng Trị",

        quangngai: "Quảng Ngãi",

        binhthuan: "Bình Thuận",

        angiang: "An Giang",
      },
    },

    height: "Chiều cao",

    heightPlaceholder: "vd: 168 cm",

    education: "Học vấn",

    educationPlaceholder: "Trình độ cao nhất hoặc tình trạng hiện tại",

    educationOptions: {
      highSchool: "Tốt nghiệp cấp 3",

      university: "Đại học",

      vocational: "Học nghề",

      working: "Đã đi làm",
    },

    hobbies: "Sở thích",

    hobbiesPlaceholder: "Kể những điều bạn thích (ngăn cách bằng dấu phẩy)",

    hobbyOptions: {
      music: "Âm nhạc & concert",

      travel: "Du lịch",

      cooking: "Nấu ăn & làm bánh",

      gaming: "Chơi game",

      reading: "Đọc sách",

      fitness: "Tập gym & thể thao",

      photography: "Chụp ảnh",

      art: "Nghệ thuật & thiết kế",

      movies: "Phim & series",

      outdoors: "Leo núi & hoạt động ngoài trời",
    },

    pets: "Thú cung",

    petsPlaceholder: "Bạn có nuôi thú cưng không?",

    petOptions: {
      dog: "Chó",

      cat: "Mèo",

      hamster: "Hamster",

      bird: "Chim",

      fish: "Cá",
    },

    favoritePerfume: "Nước hoa yêu thích",

    favoritePerfumePlaceholder: "Chia sẻ mùi hương bạn thích",

    selectedLabel: "Đã chọn: {items}",

    optional: "Không bắt buộc",

    completeButton: "Hoàn tất hồ sơ",

    completing: "Đang hoàn tất...",
  },

  errorPage: {
    title: "Đã xảy ra lỗi",
    description: "Trang này gặp lỗi không mong muốn. Tải lại trang thường sẽ khắc phục được.",
    reload: "Tải lại trang",
    home: "Về trang chủ",
  },

  notFound: {
    title: "Không tìm thấy trang",
    description: "Trang bạn tìm không tồn tại hoặc đã được chuyển đi.",
    home: "Về trang chủ",
  },

  connection: {
    reconnecting: "Đang kết nối lại...",
    paused: "Đã tạm dừng cập nhật trực tiếp khi bạn vắng mặt. Di chuột để tiếp tục.",
  },

  accountDeletion: {
    title: "Xoá tài khoản",
    description:
      "Xoá vĩnh viễn tài khoản, hồ sơ, ảnh, bạn bè, tin nhắn và báo cáo của bạn. Không thể hoàn tác.",
    open: "Xoá tài khoản của tôi",
    confirmTitle: "Xoá tài khoản của bạn?",
    confirmText:
      "Toàn bộ dữ liệu sẽ bị xoá ngay và không thể khôi phục. Nhập mật khẩu để xác nhận.",
    passwordLabel: "Mật khẩu",
    confirm: "Xoá vĩnh viễn",
    deleting: "Đang xoá...",
    cancel: "Huỷ",
    success: "Tài khoản của bạn đã được xoá.",
    error: "Không xoá được tài khoản.",
  },

  suspension: {
    message: "Tài khoản này bị khoá đến {date}.",
    permanent: "Tài khoản này bị khoá vĩnh viễn.",
    reason: "Lý do: {reason}",
  },

  verification: {
    resend: "Gửi lại mã",
    resendIn: "Gửi lại mã sau {seconds} giây",
    resent: "Đã gửi mã mới đến {email}.",
  },

  adminBan: {
    suspend: "Khoá",
    lift: "Mở khoá",
    suspendedUntil: "Bị khoá đến {date}",
    suspendedPermanent: "Bị khoá vĩnh viễn",
    dialogTitle: "Khoá tài khoản {name}",
    duration: "Thời hạn",
    days1: "1 ngày",
    days7: "7 ngày",
    days30: "30 ngày",
    permanent: "Vĩnh viễn",
    reasonLabel: "Lý do (người dùng sẽ thấy)",
    confirm: "Khoá tài khoản",
    cancel: "Huỷ",
    suspendedToast: "Đã khoá tài khoản",
    liftedToast: "Đã mở khoá tài khoản",
    error: "Thao tác thất bại",
  },

  language: {
    randomAvatarToast: "Đã tạo ảnh đại diện ngẫu nhiên!",
  },

  avatarUpload: {
    button: "Tải ảnh lên",
    hint: "JPEG, PNG, WebP hoặc HEIC",
    previewTitle: "Ảnh đại diện mới",
    previewNote: "Ảnh sẽ hiển thị như thế này, được cắt vuông từ chính giữa.",
    noPreview: "Trình duyệt không xem trước được ảnh này (ví dụ ảnh HEIC). Ảnh sẽ được kiểm tra và chuyển đổi sau khi tải lên.",
    preparing: "Đang chuẩn bị ảnh...",
    save: "Dùng ảnh này",
    saving: "Đang tải lên...",
    cancel: "Huỷ",
    success: "Ảnh đại diện đã được cập nhật!",
    errors: {
      unsupportedType: "Vui lòng chọn ảnh JPEG, PNG, WebP hoặc HEIC.",
      sourceTooLarge: "Tệp quá lớn (tối đa {max} MB).",
      tooLargeUndecodable: "Ảnh HEIC này lớn hơn 5 MB. Hãy chọn ảnh JPEG/PNG hoặc ảnh nhỏ hơn.",
      FILE_TOO_LARGE: "Ảnh phải nhỏ hơn hoặc bằng 5 MB.",
      UNSUPPORTED_TYPE: "Tệp này không phải ảnh JPEG, PNG, WebP hoặc HEIC hợp lệ.",
      TOO_LARGE_DIMENSIONS: "Kích thước ảnh quá lớn. Hãy chọn ảnh nhỏ hơn.",
      UNREADABLE_IMAGE: "Ảnh bị lỗi hoặc không đọc được. Hãy thử ảnh khác.",
      RATE_LIMITED: "Bạn tải ảnh lên quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.",
      SERVER_BUSY: "Máy chủ đang bận. Vui lòng thử lại sau vài giây.",
      network: "Tải ảnh lên thất bại. Hãy kiểm tra kết nối mạng và thử lại.",
      generic: "Không tải được ảnh lên. Vui lòng thử lại.",
    },
  },

  tarot: {
    title: "Trải bài Tarot",

    subtitle:
      "Cần tích lũy đủ {required} năng lượng (+1 mỗi ngày) trước khi bốc bài.",

    energy: {
      summary: "Năng lượng: {current}/{max}",

      regenHint: "+1 năng lượng mỗi ngày. Lần nạp gần nhất: {date}",

      pendingDate: "...",
    },

    buttons: {
      draw: "Bốc bài",

      consuming: "Đang sử dụng...",

      clear: "Dọn bàn",

      clearing: "Đang dọn...",

      refill: "Nạp năng lượng",

      refilling: "Đang nạp...",
    },

    cards: {
      title: "Các lá bài đã bốc",

      tapHint: "Hãy nhập đủ câu hỏi rồi chạm vào từng lá bài để bốc.",

      placeholder: "placeholder",

      reversed: " (ngược)",

      backAlt: "Mặt sau lá bài",
    },

    questions: {
      title: "Câu hỏi của bạn",

      instructions:
        "Ghép thứ tự câu hỏi với thứ tự lá bài (từ trái sang phải).",

      label: "Câu hỏi {number}",

      placeholder: "Nhập câu hỏi {number}",

      submit: "Xem thông điệp",

      submitting: "Đang xem...",
    },

    results: {
      title: "Thông điệp dành cho bạn",

      aiTitle: "Thông điệp từ AI",

      questionPrefix: "Câu {index}:",

      cardLabel: "Lá bài",

      adviceLabel: "Lời khuyên",
    },

    errors: {
      needQuestionsBeforeDraw: "Hãy nhập đủ 3 câu hỏi trước khi bốc bài.",

      loadingEnergy: "Đang tải trạng thái năng lượng...",

      needEnergy:
        "Bạn cần {required} năng lượng để bốc bài (hiện có {current}/{required}).",

      noDeck: "Không tìm thấy bộ bài.",

      consumeFailed: "Không thể trừ năng lượng.",

      notEnoughCards: "Không đủ lá bài để bốc.",

      needSituationBeforeDraw:
        "Hãy mô tả hoàn cảnh hiện tại của bạn trước khi bốc bài.",

      needSituation: "Hãy mô tả hoàn cảnh hiện tại trước khi xin thông điệp.",

      needQuestions: "Hãy nhập đủ 3 câu hỏi.",

      needDrawnCards: "Hãy bốc đủ 3 lá bài trước.",

      refillFailed: "Không thể nạp năng lượng.",

      readingFailed: "Không thể lấy kết quả, vui lòng thử lại.",
    },
  },

  admin: {
    title: "Bảng điều khiển Admin",

    subtitle: "Xem danh sách tài khoản và điều chỉnh quyền truy cập.",

    filters: {
      searchLabel: "Tìm kiếm",

      searchPlaceholder: "Tìm theo tên...",

      typeLabel: "Lọc theo loại tài khoản",

      allTypes: "Tất cả",
    },

    users: {
      heading: "Tài khoản",

      name: "Tên",

      email: "Email",

      accountType: "Loại tài khoản",

      saveChanges: "Lưu thay đổi",

      empty: "Chưa có người dùng nào.",

      noResults: "Không có người dùng phù hợp với bộ lọc.",

      visibleCount: "Đang hiển thị {visible}/{total} tài khoản.",
    },

    accountTypes: {
      standard: "Tiêu chuẩn",

      plus: "Plus",

      admin: "Admin",
    },

    messages: {
      updated: "Đã cập nhật loại tài khoản.",

      updateFailed: "Không thể cập nhật loại tài khoản.",
    },

    usage: {
      heading: "Thống kê sử dụng",

      description: "Số lần người dùng đã kích hoạt từng tính năng.",

      tarot: "Lần xem Tarot",

      fortune: "Bánh fortune cookie đã mở",

      matchmind: "Ván MatchMind",

      truthOrLie: "Ván Truth or Lie",
    },

    notifications: {
      heading: "Gửi thông báo",

      description:
        "Gửi một thông báo ngắn cho tất cả mọi người hoặc một người dùng cụ thể. Thông báo sẽ hiện trong trang Thông báo của họ và tự xóa sau 3 ngày nếu chưa được dọn.",

      audienceLabel: "Đối tượng",

      audienceAll: "Tất cả người dùng",

      audienceSingle: "Một người dùng (theo email)",

      emailLabel: "Email người nhận",

      messageLabel: "Nội dung",

      messagePlaceholder: "Chia sẻ một cập nhật hoặc lời nhắc ngắn...",

      counterLabel: "Tự xóa sau {days} ngày • {count}/500",

      footerHint:
        "Thông báo được gửi ngay lập tức và sẽ hết hạn sau {days} ngày theo mặc định.",

      sendButton: "Gửi thông báo",

      success: "Đã gửi thông báo.",

      error: "Gửi thông báo thất bại.",

      validation: {
        messageRequired: "Cần nhập nội dung.",

        emailRequired: "Cần email khi gửi cho một người dùng.",
      },
    },

    reports: {
      heading: "Báo cáo từ người dùng",

      description: "Những báo cáo gửi từ trang Bạn bè sẽ hiển thị tại đây.",

      empty: "Chưa có báo cáo nào.",

      resolveAction: "Đánh dấu đã xử lý",

      resolveSuccess: "Đã đánh dấu báo cáo.",

      resolveError: "Không thể cập nhật báo cáo.",

      deleteAction: "Xóa báo cáo",

      deleteSuccess: "Đã xóa báo cáo.",

      deleteError: "Không thể xóa báo cáo.",

      reportedBy: "Người báo cáo: {name}",

      createdAt: "Gửi lúc {date}",

      resolvedAt: "Đã xử lý lúc {date}",

      status: {
        pending: "Đang chờ",

        resolved: "Đã xử lý",
      },

      unknownUser: "Người dùng không xác định",
    },
  },

  passwordField: {
    show: "Hiện mật khẩu",
    hide: "Ẩn mật khẩu",
    strengthLabel: "Độ mạnh mật khẩu",
    levels: {
      tooShort: "quá ngắn (tối thiểu 8 ký tự)",
      weak: "yếu",
      fair: "trung bình",
      good: "khá",
      strong: "mạnh",
    },
    hint: "nên dùng từ 12 ký tự, kết hợp chữ, số và ký hiệu",
  },

  chatStatus: {
    sending: "Đang gửi…",
    sent: "Đã gửi",
    seen: "Đã xem",
  },

  pushNotifications: {
    title: "Thông báo tin nhắn",
    description: "Nhận thông báo trên thiết bị này khi có người nhắn tin lúc bạn đã đóng LofiTalk.",
    on: "Bật",
    off: "Tắt",
    enabledToast: "Đã bật thông báo trên thiết bị này.",
    disabledToast: "Đã tắt thông báo trên thiết bị này.",
    error: "Không thay đổi được thông báo. Vui lòng thử lại.",
    denied: "Trình duyệt đang chặn thông báo của trang này. Hãy cho phép trong phần cài đặt trang web của trình duyệt, rồi tải lại trang.",
    unsupported: "Trình duyệt này không hỗ trợ thông báo.",
    iosHint: "Trên iPhone/iPad: bấm Chia sẻ → Thêm vào MH chính, mở LofiTalk từ màn hình chính rồi bật thông báo tại đây.",
  },

  a11y: {
    settings: "Cài đặt",
    logout: "Đăng xuất",
    myProfile: "Hồ sơ của tôi",
    chatOptions: "Tùy chọn cuộc trò chuyện",
    accountTypeFor: "Loại tài khoản của {name}",
    sendMessage: "Gửi tin nhắn",
    messageInput: "Tin nhắn",
  },
};

export default vietnamese;
