import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const INVITE_DURATION = 30;
const STORAGE_KEY = "matchmind-game-state";

const MatchMindGameContext = createContext(null);

const QUESTION_BANK = {
  easy: [
    {
      id: "easy-1",
      prompt: "Bạn muốn người kia gọi bạn bằng kiểu nào?",
      options: [
        "Tên + ơi",
        "Gọi kiểu đáng yêu",
        "Gọi nhẹ tên 😳",
        "Biệt danh tự đặt",
      ],
    },
    {
      id: "easy-2",
      prompt: "Đi chơi lần đầu bạn thích làm gì nhất?",
      options: [
        "Đi dạo phố",
        "Cafe chuyện trò",
        "Đi xem triển lãm",
        "Chơi game nhẹ",
      ],
    },
    {
      id: "easy-3",
      prompt: "Kiểu tin nhắn bạn muốn nhận từ người kia?",
      options: [
        "Tin bất ngờ ấm áp",
        "Tin chia sẻ chuyện ngày",
        "Tin trêu cute",
        "Tin nhắn hỏi thăm",
      ],
    },
    {
      id: "easy-4",
      prompt: "Bạn ấn tượng nhất điều gì khi gặp lần đầu?",
      options: [
        "Ánh mắt đầu tiên",
        "Cách họ cười",
        "Phong thái tự nhiên",
        "Không khí khi nói chuyện",
      ],
    },
    {
      id: "easy-5",
      prompt: "Bạn thích vibe buổi sáng hay buổi tối khi đi chơi chung?",
      options: [
        "Sáng nhẹ nhàng",
        "Tối lãng mạn",
        "Tối chill",
        "Sáng năng lượng",
      ],
    },
    {
      id: "easy-6",
      prompt: "Khi chụp ảnh chung, bạn chọn pose nào?",
      options: [
        "Pose nhí nhố",
        "Pose nhìn nhau",
        "Pose nghiêng đầu",
        "Pose tự nhiên",
      ],
    },
    {
      id: "easy-7",
      prompt: "Đi ăn chung bạn sẽ chọn món gì?",
      options: ["Quán local", "Đồ Hàn", "Ăn vặt đường phố", "Đồ Nhật"],
    },
    {
      id: "easy-8",
      prompt: "Bạn thích người kia chủ động mức nào?",
      options: [
        "Chủ động cute bất ngờ",
        "Chủ động nhiều",
        "Hơi chủ động",
        "Chủ động vừa",
      ],
    },
    {
      id: "easy-9",
      prompt: "Khi cả hai cùng lười, bạn thích làm gì?",
      options: [
        "Nằm xem phim",
        "Kể chuyện linh tinh",
        "Nghe nhạc nằm cạnh",
        "Ăn vặt + chill",
      ],
    },
    {
      id: "easy-10",
      prompt: "Bạn thích loại nhạc nghe chung?",
      options: ["Indie", "Pop nhẹ", "R&B", "Lofi"],
    },
    {
      id: "easy-11",
      prompt: "Bạn muốn người kia bất ngờ điều gì?",
      options: [
        "Gửi ảnh cute",
        "Rủ đi chơi nhẹ",
        "Tin nhắn tỏ ý quan tâm",
        "Mua snack",
      ],
    },
    {
      id: "easy-12",
      prompt: "Bạn để ý điều gì đầu tiên ở người kia?",
      options: ["Cách họ cư xử", "Giọng nói", "Nụ cười", "Cách họ nhìn mình"],
    },
    {
      id: "easy-13",
      prompt: "Bạn thích đi đâu trong buổi hẹn nhẹ?",
      options: ["Hiệu sách", "Cafe yên tĩnh", "Công viên", "Phố đi bộ"],
    },
    {
      id: "easy-14",
      prompt: "Khi cả hai chọn xem phim, bạn chọn thể loại gì?",
      options: ["Tâm lý", "Romantic", "Comedy", "Hành động"],
    },
    {
      id: "easy-15",
      prompt: "Bạn thích kiểu nắm tay nào?",
      options: ["Nắm hờ", "Đan tay", "Nắm bất ngờ sau lưng", "Nắm mạnh chắc"],
    },
    {
      id: "easy-16",
      prompt: "Khi đi dạo, bạn thích nhịp độ thế nào?",
      options: ["Đi vừa", "Đi nhanh vui", "Đi chậm", "Đi vừa nói chuyện"],
    },
    {
      id: "easy-17",
      prompt: "Bạn thích nói chuyện về chủ đề gì?",
      options: ["Ước mơ", "Cuộc sống", "Chuyện ngẫu nhiên", "Tình yêu"],
    },
    {
      id: "easy-18",
      prompt: "Kiểu outfit bạn muốn người kia mặc khi gặp?",
      options: ["Basic", "Sporty", "Vintage nhẹ", "Casual cute"],
    },
    {
      id: "easy-19",
      prompt: "Bạn thích người kia cười kiểu nào?",
      options: ["Cười ngại", "Cười to vô tư", "Cười mím môi", "Cười tít mắt"],
    },
    {
      id: "easy-20",
      prompt: "Bạn muốn thử trend couple nào?",
      options: [
        "Clip trend TikTok",
        "Tạo album kỷ niệm",
        "Matching đồ",
        "Chụp film",
      ],
    },
    {
      id: "easy-21",
      prompt: "Đi chơi xa, điều bạn quan tâm nhất là gì?",
      options: ["Ảnh đẹp", "Địa điểm yên bình", "Lịch trình hợp", "Tiết kiệm"],
    },
    {
      id: "easy-22",
      prompt: "Bạn thích người kia trêu đùa kiểu gì?",
      options: ["Không trêu nhiều", "Cà khịa vui", "Trêu nhẹ", "Trêu kiểu yêu"],
    },
    {
      id: "easy-23",
      prompt: "Bạn muốn được khen điều gì?",
      options: ["Ngoại hình", "Mùi hương", "Tính cách", "Năng lượng dễ thương"],
    },
    {
      id: "easy-24",
      prompt: "Bạn muốn cả hai chơi game gì cùng nhau?",
      options: ["UNO", "Đố vui nhanh", "Mini game app", "Truth or Dare"],
    },
    {
      id: "easy-25",
      prompt: "Bạn nghĩ dấu hiệu cho thấy hợp vibe là gì?",
      options: [
        "Không gượng",
        "Cảm giác thân thuộc",
        "Nói chuyện hợp vibe",
        "Gu hợp",
      ],
    },
    {
      id: "easy-26",
      prompt: "Bạn thích kiểu hẹn cà phê nào?",
      options: ["Cafe sách", "View đẹp", "Cafe ngoài trời", "Yên tĩnh"],
    },
    {
      id: "easy-27",
      prompt: "Bạn muốn thử một thử thách couple gì?",
      options: [
        "24h không nhắn",
        "Nói thật 10 phút",
        "Trao đổi playlist",
        "Chụp 10 ảnh bất kỳ",
      ],
    },
    {
      id: "easy-28",
      prompt: "Bạn mong muốn buổi hẹn diễn ra như thế nào?",
      options: ["Chill + tâm sự", "Tự nhiên", "Lãng mạn nhẹ", "Nhiều nói cười"],
    },
    {
      id: "easy-29",
      prompt: "Bạn muốn người kia share playlist gì?",
      options: ["Vui", "Nhạc riêng họ thích", "Buồn", "Chill"],
    },
    {
      id: "easy-30",
      prompt: "Bạn tò mò điều gì nhất về cuộc sống của người kia?",
      options: ["Công việc", "Bạn bè", "Thói quen", "Một ngày của họ"],
    },
    {
      id: "easy-31",
      prompt: "Bạn thích kiểu im lặng nào khi ở cạnh nhau?",
      options: [
        "Im nhưng vẫn ấm",
        "Im lặng nghe nhạc",
        "Im ngồi cạnh",
        "Im lặng thoải mái",
      ],
    },
    {
      id: "easy-32",
      prompt: "Bạn muốn người kia rủ đi chơi bằng câu nào?",
      options: [
        "Đi ăn không?",
        "Đi dạo hong?",
        "Đi chơi nhẹ hơm?",
        "Cafe chút?",
      ],
    },
    {
      id: "easy-33",
      prompt: "Bạn chọn hình thức thể hiện tình cảm cute nào?",
      options: ["Xoa đầu", "Ôm nhẹ", "Nhìn nhau cười", "Nắm tay"],
    },
    {
      id: "easy-34",
      prompt: "Bạn muốn người kia giữ bí mật gì cho bạn?",
      options: [
        "Suy nghĩ thật",
        "Crush cũ",
        "Chuyện nhỏ riêng tư",
        "Thói quen khó nói",
      ],
    },
    {
      id: "easy-35",
      prompt: "Bạn thích loại trà sữa hay nước uống nào khi đi cùng?",
      options: ["Sữa tươi đường đen", "Trà sữa", "Hồng trà", "Matcha"],
    },
    {
      id: "easy-36",
      prompt: "Bạn muốn cùng người kia thử trải nghiệm mới gì?",
      options: ["Thử bộ môn mới", "Đi workshop", "Đạp xe cùng", "Học nấu ăn"],
    },
    {
      id: "easy-37",
      prompt: "Bạn thấy điều gì đáng yêu nhất ở người kia?",
      options: ["Hơi ngại ngùng", "Cách cười", "Giọng nói", "Cách quan tâm"],
    },
    {
      id: "easy-38",
      prompt: "Bạn thích kiểu ghi nhớ ngày kỷ niệm kiểu nào?",
      options: [
        "Kỷ niệm ngày đầu gặp",
        "Lưu tin nhắn",
        "Chụp nhiều ảnh",
        "Album chung",
      ],
    },
    {
      id: "easy-39",
      prompt: "Bạn muốn cả hai tạo kỷ niệm gì trước?",
      options: [
        "Ăn món yêu thích",
        "Ảnh cùng nhau",
        "Đi dạo tối",
        "Đi xem phim",
      ],
    },
    {
      id: "easy-40",
      prompt: "Bạn thích ai mở lời trước trong các khoảnh khắc cute?",
      options: [
        "Tự nhiên xảy ra",
        "Người kia mở lời",
        "Bạn mở lời",
        "Ai cũng được",
      ],
    },
    {
      id: "easy-41",
      prompt: "Phong cách thời trang bạn yêu thích nhất là gì?",
      options: [
        "Trẻ trung, năng động, tươi mới và tràn đầy năng lượng",
        "Đường phố, cá tính, một chút bụi bặm và phóng khoáng",
        "Trưởng thành, lịch lãm, chỉn chu và chững chạc",
        "Tối giản, tinh tế, nhẹ nhàng nhưng vẫn thời thượng",
      ],
    },

    {
      id: "easy-42",
      prompt: "Vào những dịp đặc biệt, bạn muốn nhận món quà như thế nào?",
      options: [
        "Đồ handmade, đơn giản nhưng chứa đầy tâm ý",
        "Đồ thời trang (quần áo, giày dép…), được đẹp hơn là vui rồi",
        "Một món quà thiết thực, dùng được ngay, không để tủ",
        "Một trải nghiệm đáng nhớ, buổi hẹn, chuyến đi hoặc điều gì đó thật khác biệt",
      ],
    },

    {
      id: "easy-43",
      prompt: "Bạn thường thể hiện sự quan tâm với người ấy theo cách nào?",
      options: [
        "Duy trì kết nối mỗi ngày, nhắn tin, gọi video đều đặn",
        "Gửi cảm xúc bằng âm nhạc, hát, thu âm hoặc quay video gửi người ấy",
        "Những món quà nhỏ đầy ý nghĩa, mua đồ ăn, tặng vật dụng xinh xinh",
        "Luôn có mặt khi cần, không ngại đường xa để đưa đón hoặc ở bên cạnh",
      ],
    },
  ],
  hard: [
    {
      id: "hard-1",
      prompt: "Điều gì khiến bạn cảm thấy thật sự kết nối sâu với một người?",
      options: [
        "Khi hai người nói chuyện rất tự nhiên, không hề gượng gạo",
        "Khi họ tạo cho bạn cảm giác an toàn và được là chính mình",
        "Khi bạn có thể chia sẻ cảm xúc sâu mà không sợ bị đánh giá",
        "Khi bạn cảm nhận rõ hai người có cùng tần số, hợp vibe lạ kỳ",
      ],
    },
    {
      id: "hard-2",
      prompt: "Mong muốn lâu dài nhất của bạn trong mối quan hệ?",
      options: [
        "Cùng sống chung",
        "Đi nhiều nơi cùng nhau",
        "Ổn định trước",
        "Cùng làm dự án",
      ],
    },
    {
      id: "hard-3",
      prompt: "Cách bạn xử lý khi cả hai hiểu lầm nhau?",
      options: [
        "Nghỉ 10 phút rồi nói",
        "Viết tin nhắn dài",
        "Gặp nhau nói thẳng",
        "Nói rõ ngay",
      ],
    },
    {
      id: "hard-4",
      prompt: "Bạn cần điều gì để cảm thấy được yêu?",
      options: ["Quan tâm nhỏ", "Lời nói ấm", "Chạm nhẹ", "Dành thời gian"],
    },
    {
      id: "hard-5",
      prompt: "Bạn mong người kia hiểu điều gì về bạn nhất?",
      options: ["Thói quen tình cảm", "Giới hạn", "Gu yêu", "Nỗi sợ"],
    },
    {
      id: "hard-6",
      prompt: "Giới hạn trong tình yêu bạn đặt ra là gì?",
      options: [
        "Tôn trọng riêng tư",
        "Không ghen quá",
        "Không kiểm soát",
        "Không xúc phạm",
      ],
    },
    {
      id: "hard-7",
      prompt: "Điều khiến bạn tin tưởng một người?",
      options: [
        "Không nói dối",
        "Lời hứa giữ đúng",
        "Không mập mờ",
        "Minh bạch",
      ],
    },
    {
      id: "hard-8",
      prompt: "Bạn muốn xây dựng tương lai chung như thế nào?",
      options: [
        "Cùng sống chung",
        "Cùng làm dự án",
        "Ổn định trước",
        "Đi nhiều nơi cùng nhau",
      ],
    },
    {
      id: "hard-9",
      prompt: "Bạn nghĩ điều khó nhất khi yêu bạn là gì?",
      options: ["Ít nói", "Nhạy cảm", "Tính khó đoán", "Ngại mở lòng"],
    },
    {
      id: "hard-10",
      prompt: "Bạn cần gì để mềm lòng sau khi giận?",
      options: [
        "Được để yên",
        "Được xin lỗi chân thành",
        "Được giải thích rõ",
        "Được ôm",
      ],
    },
    {
      id: "hard-11",
      prompt: "Bạn sợ điều gì nhất trong mối quan hệ?",
      options: [
        "Bị bỏ rơi",
        "Không còn yêu",
        "Xa cách cảm xúc",
        "Mâu thuẫn kéo dài",
      ],
    },
    {
      id: "hard-12",
      prompt: "Giá trị sống nào bạn muốn cả hai chia sẻ?",
      options: ["Lạc quan", "Tôn trọng", "Tự do", "Chân thành"],
    },
    {
      id: "hard-13",
      prompt: "Bạn coi trọng điều gì trong giao tiếp cặp đôi?",
      options: ["Lắng nghe", "Không công kích", "Ấm áp", "Thẳng thắn"],
    },
    {
      id: "hard-14",
      prompt: "Bạn muốn vai trò của mình trong tình yêu như thế nào?",
      options: ["Cân bằng", "Chủ động", "Dịu dàng", "Lúc mạnh lúc mềm"],
    },
    {
      id: "hard-15",
      prompt: "Bạn nghĩ điều gì làm tình cảm bền lâu?",
      options: ["Tôn trọng", "Quan tâm đều", "Chia sẻ", "Không giấu chuyện"],
    },
    {
      id: "hard-16",
      prompt: "Bạn muốn đối phương thể hiện sự chân thành ra sao?",
      options: [
        "Không gian dối",
        "Lời nói thật",
        "Không mập mờ",
        "Hành động thật",
      ],
    },
    {
      id: "hard-17",
      prompt: "Bạn kỳ vọng điều gì ở một mối quan hệ lành mạnh?",
      options: [
        "Tôn trọng giới hạn",
        "Giao tiếp tốt",
        "Tin tưởng",
        "Không ép buộc",
      ],
    },
    {
      id: "hard-18",
      prompt: "Bạn muốn học gì từ người kia?",
      options: [
        "Chấp nhận khác biệt",
        "Kiên nhẫn",
        "Thấu hiểu",
        "Cách yêu đúng với nhau",
      ],
    },
    {
      id: "hard-19",
      prompt: "Điều khiến bạn cảm thấy tự hào về người mình thích?",
      options: ["Họ tốt bụng", "Họ chân thật", "Họ có mục tiêu", "Họ nỗ lực"],
    },
    {
      id: "hard-20",
      prompt: "Bạn muốn giải quyết mâu thuẫn theo cách nào lâu dài?",
      options: ["Nói rõ", "Tìm điểm chung", "Thỏa hiệp", "Không công kích"],
    },
    {
      id: "hard-21",
      prompt: "Bạn nghĩ điều gì tạo nên sự tin cậy?",
      options: ["Không nói dối", "Minh bạch", "Chia sẻ đều", "Không kiểm soát"],
    },
    {
      id: "hard-22",
      prompt: "Bạn quan niệm thế nào về sự hy sinh khi yêu?",
      options: [
        "Không gượng ép",
        "Không mất mình",
        "Vì nhau vừa đủ",
        "Cùng nhường",
      ],
    },
    {
      id: "hard-23",
      prompt: "Bạn muốn cách yêu của cả hai giống điều gì?",
      options: ["Ổn định", "Thẳng thắn", "Lãng mạn", "Chậm mà chắc"],
    },
    {
      id: "hard-24",
      prompt: "Trong lúc yếu lòng, bạn cần điều gì nhất?",
      options: ["Ở cạnh", "Ôm", "Lời động viên", "Hành động nhỏ"],
    },
    {
      id: "hard-25",
      prompt: "Bạn nghĩ hai người hợp nhau khi chia sẻ điều gì?",
      options: ["Nỗi sợ", "Niềm vui nhỏ", "Cảm xúc", "Suy nghĩ"],
    },
    {
      id: "hard-26",
      prompt: "Bạn muốn cả hai cùng cải thiện điều gì?",
      options: [
        "Bớt nóng",
        "Tin nhau hơn",
        "Giao tiếp tốt hơn",
        "Quan tâm nhiều hơn",
      ],
    },
    {
      id: "hard-27",
      prompt: "Bạn mong muốn được người kia hiểu phần nào sâu nhất?",
      options: ["Giới hạn", "Thói quen tình cảm", "Nỗi sợ", "Gu yêu"],
    },
    {
      id: "hard-28",
      prompt: "Bạn có niềm tin thế nào vào tình cảm hiện tại?",
      options: [
        "Tin hoàn toàn",
        "Tin chắc 70%",
        "Tin 80%",
        "Tin nhưng vẫn quan sát",
      ],
    },
    {
      id: "hard-29",
      prompt: "Điều khiến bạn thay đổi khi yêu là gì?",
      options: [
        "Kiên nhẫn hơn",
        "Mềm hơn",
        "Chia sẻ nhiều hơn",
        "Lạc quan hơn",
      ],
    },
    {
      id: "hard-30",
      prompt: "Bạn muốn người kia đồng hành với bạn trong chuyện gì?",
      options: ["Cuộc sống", "Công việc", "Mơ ước", "Sở thích"],
    },
    {
      id: "hard-31",
      prompt: "Bạn thấy điều gì quan trọng hơn: lãng mạn hay ổn định?",
      options: [
        "Ít cãi nhau",
        "Ít drama",
        "Tôn trọng nhau",
        "Nhịp yêu đều đặn",
      ],
    },
    {
      id: "hard-32",
      prompt: "Bạn muốn người kia làm gì để bạn cảm thấy an tâm?",
      options: [
        "Nói rõ ràng",
        "Không lạnh nhạt",
        "Hành động nhất quán",
        "Không mập mờ",
      ],
    },
    {
      id: "hard-33",
      prompt: "Điều khiến bạn dễ rung động nhất?",
      options: ["Ánh mắt", "Sự tinh tế", "Nụ cười", "Giọng nói"],
    },
    {
      id: "hard-34",
      prompt: "Bạn nghĩ điều gì là thử thách lớn nhất của hai người?",
      options: ["Khác tính", "Ít thời gian", "Khác mục tiêu", "Xa cách"],
    },
    {
      id: "hard-35",
      prompt: "Bạn muốn mối quan hệ tiến triển theo tốc độ nào?",
      options: ["Chậm", "Nhanh", "Vừa", "Tự nhiên"],
    },
    {
      id: "hard-36",
      prompt: "Bạn muốn chia sẻ bí mật nào khi đã đủ tin tưởng?",
      options: [
        "Chuyện tuổi thơ",
        "Mơ ước thầm kín",
        "Tình cảm quá khứ",
        "Nỗi sợ",
      ],
    },
    {
      id: "hard-37",
      prompt: "Bạn cần điều gì để cảm thấy bình yên?",
      options: ["Ở cạnh", "Nói ít", "Ôm nhẹ", "Đi dạo"],
    },
    {
      id: "hard-38",
      prompt: "Bạn muốn học cách yêu theo hướng nào?",
      options: ["Thể hiện cảm xúc", "Lắng nghe", "Kiên nhẫn", "Không so sánh"],
    },
    {
      id: "hard-39",
      prompt: "Điều nào bạn xem là ranh giới quan trọng?",
      options: [
        "Không đe dọa",
        "Không xúc phạm",
        "Không kiểm tra điện thoại",
        "Không lôi chuyện cũ",
      ],
    },
    {
      id: "hard-40",
      prompt: "Bạn mong hai người trở thành phiên bản như thế nào của nhau?",
      options: [
        "Cùng sống chung",
        "Ổn định trước",
        "Cùng làm dự án",
        "Đi nhiều nơi cùng nhau",
      ],
    },
    {
      id: "hard-41",
      prompt:
        "Nếu bạn và người ấy cùng muốn đi ra ngoài, bạn sẽ muốn hai người đi đâu?",
      options: [
        "Đi ăn uống ở ngoài (nhà hàng, bar, tiệm cà phê, bánh ngọt,...)",
        "Đi xem phim chung",
        "Đi mua sắm, dạo các cửa hàng",
        "Đi chơi thể thao (gym, leo núi, bowling,...)",
      ],
    },

    {
      id: "hard-42",
      prompt:
        "Nếu bạn và người ấy cùng ở nhà với nhau, bạn muốn hai người làm gì cùng nhau?",
      options: [
        "Nằm ôm nhau ngủ nướng hoặc xem phim",
        "Cùng nhau nấu một món ăn hoặc nướng bánh",
        "Cùng nhau dọn dẹp lại nhà cửa",
        "Chơi một trò chơi thú vị và tâm sự về những ngày qua",
      ],
    },

    {
      id: "hard-43",
      prompt: "Nếu người kia trông có vẻ không vui, bạn sẽ làm gì?",
      options: [
        "Nhẹ nhàng hỏi xem người ấy đang buồn chuyện gì và lắng nghe thật sự",
        "Ôm hoặc nắm tay để trấn an, cho họ cảm giác an toàn",
        "Làm điều gì dễ thương để đổi mood: pha nước, mang snack, bật bài nhạc họ thích",
        "Ngồi cạnh im lặng, để họ biết bạn luôn ở đó khi họ muốn chia sẻ",
      ],
    },

    {
      id: "hard-44",
      prompt:
        "Hai bạn chuẩn bị cho buổi hẹn đầu tiên, điều gì bạn muốn chuẩn bị cho bản thân?",
      options: [
        "Trang phục chỉn chu và gây thiện cảm để cảm thấy tự tin nhất khi gặp nhau",
        "Một món quà nhỏ tinh tế để tạo bất ngờ dễ thương trong lần gặp đầu",
        "Nghĩ sẵn vài câu chuyện thú vị để cuộc trò chuyện tự nhiên và vui hơn",
        "Chuẩn bị tâm lý thoải mái và tích cực để tận hưởng buổi hẹn một cách nhẹ nhàng",
      ],
    },

    {
      id: "hard-45",
      prompt:
        "Trong buổi hẹn đầu tiên, bạn muốn thể hiện điều gì nhất ở bản thân?",
      options: [
        "Sự chân thành và nghiêm túc trong cách bạn quan tâm",
        "Tính cách dễ thương, vui vẻ khiến đối phương thoải mái",
        "Sự tự tin nhưng nhẹ nhàng, không cố gắng gây ấn tượng quá mức",
        "Sự lắng nghe và tôn trọng cảm xúc, pace của người kia",
      ],
    },
    {
      id: "hard-46",
      prompt:
        "Bạn và người ấy đang tranh luận về một chủ đề nào đó, và bạn biết chắc mình đúng. Bạn sẽ làm gì?",
      options: [
        "Trình bày lý lẽ một cách thông minh, rõ ràng và thuyết phục nhất có thể",
        "Chấp nhận quan điểm của người ấy để giữ hòa khí, dù bạn không thật sự đồng tình",
        "Bỏ qua chủ đề và ngầm thỏa thuận rằng hai người sẽ không nhắc lại chuyện này nữa",
        "Giải thích quan điểm của mình bằng thái độ nhẹ nhàng, rồi cùng nhìn vấn đề theo nhiều góc độ",
      ],
    },

    {
      id: "hard-47",
      prompt:
        "Tối nay thời tiết xấu và người ấy đi làm về muộn hơn mọi ngày. Bạn sẽ làm gì?",
      options: [
        "Chuẩn bị một bữa tối ấm áp do bạn tự nấu để họ về là có ngay đồ ăn ngon",
        "Đội mưa đến đón người ấy và cùng nhau mua món ăn nhẹ hoặc về nhà nấu gì đó giản dị",
        "Đặt bàn ở một nhà hàng xịn rồi gọi taxi đến công ty đón người ấy để có một buổi tối sang – chill",
        "Nhắn tin ngọt ngào dặn dò họ cẩn thận, rồi âm thầm chuẩn bị không gian thật ấm để họ về là được bao bọc bởi sự quan tâm của bạn",
      ],
    },
    {
      id: "hard-48",
      prompt:
        "Hai bạn có một ngày ở nhà bên nhau nhưng người ấy lại mải mê làm việc họ thích, còn bạn thì không hứng thú. Bạn sẽ làm gì?",
      options: [
        "Ngồi cạnh và chia sẻ thời gian với người ấy như một cách tôn trọng sở thích của họ",
        "Khẽ thể hiện một chút để người ấy hiểu bạn muốn cả hai làm điều gì đó cùng nhau",
        "Dành thời gian cho sở thích riêng của mình để cả hai đều thoải mái",
        "Rời khỏi không gian đó để làm điều bạn thích rồi quay lại khi cả hai sẵn sàng dành thời gian cho nhau",
      ],
    },

    {
      id: "hard-49",
      prompt:
        "Người ấy thích một món đồ nhưng giá vượt quá khả năng của họ và cũng cao hơn mức chi tiêu thường ngày của bạn. Bạn sẽ làm gì?",
      options: [
        "Âm thầm để dành tiền và tặng họ vào một dịp thật đặc biệt",
        "Tự học cách làm hoặc tạo ra một phiên bản tương tự mang dấu ấn riêng của bạn",
        "Mua ngay món đó cho người ấy và chấp nhận tiết kiệm trong vài tuần tới",
        "Chọn một món quà tinh tế, ý nghĩa, nhưng vừa túi tiền để vẫn thể hiện sự quan tâm",
      ],
    },
  ],
};

const QUESTIONS_PER_GAME = 10;

const hashSeed = (value = "") => {
  const input = value.toString();
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = Math.imul(31, hash) + input.charCodeAt(i);
    hash |= 0; // force 32-bit
  }
  return hash >>> 0;
};

const mulberry32 = (seed = 0) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let result = Math.imul(t ^ (t >>> 15), 1 | t);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const generateQuestionSet = (difficulty = "easy", seed) => {
  const pool = QUESTION_BANK[difficulty] || QUESTION_BANK.easy;
  if (!pool?.length) return [];

  const working = [...pool];
  const random =
    seed !== undefined && seed !== null
      ? mulberry32(hashSeed(`${difficulty}|${seed}`))
      : () => Math.random();

  for (let i = working.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [working[i], working[j]] = [working[j], working[i]];
  }

  return working.slice(0, Math.min(QUESTIONS_PER_GAME, working.length));
};

const defaultState = {
  stage: "lobby",
  difficulty: "easy",
  selectedFriend: null,
  inviteRemaining: INVITE_DURATION,
  inviteExpiresAt: null,
  inviteId: null,
  sessionId: null,
  roundIndex: 0,
  currentAnswers: { yours: null, friend: null },
  history: [],
  questions: generateQuestionSet("easy"),
};

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getInitialState = () => {
  if (typeof window === "undefined") return defaultState;
  const saved = safeParse(localStorage.getItem(STORAGE_KEY));
  if (!saved) return defaultState;

  const now = Date.now();
  const inviteExpiresAt =
    typeof saved.inviteExpiresAt === "number" ? saved.inviteExpiresAt : null;
  const inviteRemaining = inviteExpiresAt
    ? Math.max(0, Math.ceil((inviteExpiresAt - now) / 1000))
    : INVITE_DURATION;
  const stage =
    saved.stage === "inviting" && inviteRemaining <= 0
      ? "expired"
      : saved.stage || defaultState.stage;
  const savedDifficulty = saved.difficulty || defaultState.difficulty;
  const savedQuestions =
    Array.isArray(saved.questions) && saved.questions.length
      ? saved.questions
      : generateQuestionSet(savedDifficulty);

  return {
    ...defaultState,
    ...saved,
    stage,
    inviteExpiresAt,
    inviteRemaining,
    difficulty: savedDifficulty,
    questions: savedQuestions,
    history: Array.isArray(saved.history)
      ? saved.history
      : defaultState.history,
    currentAnswers: saved.currentAnswers || defaultState.currentAnswers,
  };
};

const useMatchMindGameInternal = () => {
  const initialState = useRef(getInitialState()).current;
  const [stage, setStage] = useState(initialState.stage); // lobby | inviting | accepted | declined | expired | playing | results
  const [difficulty, setDifficulty] = useState(initialState.difficulty);
  const [selectedFriend, setSelectedFriend] = useState(
    initialState.selectedFriend
  );
  const [inviteRemaining, setInviteRemaining] = useState(
    initialState.inviteRemaining
  );
  const [inviteExpiresAt, setInviteExpiresAt] = useState(
    initialState.inviteExpiresAt
  );
  const [inviteId, setInviteId] = useState(initialState.inviteId);
  const [sessionId, setSessionId] = useState(initialState.sessionId);
  const [roundIndex, setRoundIndex] = useState(initialState.roundIndex);
  const [currentAnswers, setCurrentAnswers] = useState(
    initialState.currentAnswers
  );
  const [history, setHistory] = useState(initialState.history);
  const [questions, setQuestions] = useState(
    initialState.questions?.length
      ? initialState.questions
      : generateQuestionSet(initialState.difficulty)
  );
  const [isHostSession, setIsHostSession] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("matchmind-is-host") === "true";
  });
  const [sharedAnswers, setSharedAnswers] = useState(null);
  const [hasSharedAnswers, setHasSharedAnswers] = useState(false);

  const resolvingRef = useRef(false);
  const previousRoundRef = useRef(initialState.roundIndex);

  const currentQuestion = questions[roundIndex] || null;
  const activeSession = sessionId || inviteId;

  const resetToLobby = useCallback(() => {
    setStage("lobby");
    setDifficulty("easy");
    setInviteRemaining(INVITE_DURATION);
    setInviteExpiresAt(null);
    setInviteId(null);
    setSessionId(null);
    setRoundIndex(0);
    setCurrentAnswers({ yours: null, friend: null });
    setHistory([]);
    setQuestions(generateQuestionSet("easy"));
    previousRoundRef.current = 0;
    resolvingRef.current = false;
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const sendInvite = useCallback(
    ({ inviteId: providedInviteId, expiresAt } = {}) => {
      if (!selectedFriend) return false;
      setStage("inviting");
      const expiresMs =
        typeof expiresAt === "number"
          ? expiresAt
          : expiresAt instanceof Date
          ? expiresAt.getTime()
          : Date.now() + INVITE_DURATION * 1000;
      setInviteExpiresAt(expiresMs);
      const secondsLeft = Math.max(
        0,
        Math.ceil((expiresMs - Date.now()) / 1000)
      );
      setInviteRemaining(secondsLeft || INVITE_DURATION);
      setInviteId(providedInviteId || null);
      setHistory([]);
      resolvingRef.current = false;
      return true;
    },
    [selectedFriend]
  );

  const acceptInvite = useCallback(() => {
    if (stage !== "inviting") return;
    setStage("accepted");
  }, [stage]);

  const declineInvite = useCallback(() => {
    if (stage !== "inviting") return;
    setStage("declined");
  }, [stage]);

  const markAcceptedByFriend = useCallback(() => {
    if (stage === "inviting" || stage === "lobby") {
      setStage("accepted");
    }
  }, [stage]);

  const markDeclinedByFriend = useCallback(() => {
    if (stage === "inviting" || stage === "accepted" || stage === "lobby") {
      setStage("declined");
    }
  }, [stage]);

  const markInviteExpired = useCallback(() => {
    if (stage === "inviting") {
      setStage("expired");
    }
  }, [stage]);

  const startGame = useCallback(
    (mode = "easy") => {
      const nextMode = QUESTION_BANK[mode] ? mode : "easy";
      setDifficulty(nextMode);
      setStage("playing");
      const sessionKey = inviteId || sessionId || `local-${Date.now()}`;
      setSessionId((prev) => prev || sessionKey);
      setQuestions(generateQuestionSet(nextMode, sessionKey));
      setRoundIndex(0);
      setCurrentAnswers({ yours: null, friend: null });
      setHistory([]);
      previousRoundRef.current = 0;
      resolvingRef.current = false;
    },
    [inviteId, sessionId]
  );

  const startGameFromRemote = useCallback(
    (session, mode = "easy") => {
      const nextMode = QUESTION_BANK[mode] ? mode : "easy";
      setDifficulty(nextMode);
      const sessionKey =
        session || inviteId || sessionId || `remote-${Date.now()}`;
      if (sessionKey) setSessionId(sessionKey);
      setStage("playing");
      setQuestions(generateQuestionSet(nextMode, sessionKey));
      setRoundIndex(0);
      setCurrentAnswers({ yours: null, friend: null });
      setHistory([]);
      previousRoundRef.current = 0;
      resolvingRef.current = false;
    },
    [inviteId, sessionId]
  );

  const exitGame = useCallback(() => {
    resetToLobby();
  }, [resetToLobby]);

  const chooseAnswer = useCallback(
    (option) => {
      if (stage !== "playing") return;
      setCurrentAnswers((prev) =>
        prev.yours ? prev : { ...prev, yours: option }
      );
    },
    [stage]
  );

  const setFriendAnswer = useCallback(
    (option) => {
      if (stage !== "playing") return;
      setCurrentAnswers((prev) =>
        prev.friend ? prev : { ...prev, friend: option }
      );
    },
    [stage]
  );

  const resolveRound = useCallback(
    (reason = "timeout") => {
      if (resolvingRef.current || stage !== "playing") return;
      const question = questions[roundIndex];
      if (!question) return;

      resolvingRef.current = true;

      const yourAnswer = currentAnswers.yours;
      const friendAnswer = currentAnswers.friend;

      setHistory((prev) => [
        ...prev,
        {
          id: question.id,
          question: question.prompt,
          yourAnswer,
          friendAnswer,
          matched: Boolean(
            yourAnswer && friendAnswer && yourAnswer === friendAnswer
          ),
          reason,
        },
      ]);

      if (roundIndex + 1 >= questions.length) {
        setStage("results");
        return;
      }

      setRoundIndex((prev) => prev + 1);
    },
    [questions, roundIndex, currentAnswers, stage]
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const payload = {
      stage,
      difficulty,
      questions,
      selectedFriend,
      inviteRemaining,
      inviteExpiresAt,
      inviteId,
      sessionId,
      roundIndex,
      currentAnswers,
      history,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    stage,
    difficulty,
    questions,
    selectedFriend,
    inviteRemaining,
    inviteExpiresAt,
    inviteId,
    sessionId,
    roundIndex,
    currentAnswers,
    history,
  ]);

  useEffect(() => {
    if (stage !== "inviting" || !inviteExpiresAt) return;

    const intervalId = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((inviteExpiresAt - Date.now()) / 1000)
      );
      setInviteRemaining(remaining);

      if (remaining <= 0) {
        setStage("expired");
      }
    }, 250);

    return () => clearInterval(intervalId);
  }, [stage, inviteExpiresAt]);

  useEffect(() => {
    if (stage !== "playing") return;

    const isNewRound = previousRoundRef.current !== roundIndex;
    if (isNewRound) {
      previousRoundRef.current = roundIndex;
      setCurrentAnswers({ yours: null, friend: null });
      resolvingRef.current = false;
    } else {
      resolvingRef.current = false;
    }
  }, [stage, roundIndex]);

  useEffect(() => {
    if (stage !== "playing") return;
    if (currentAnswers.yours && currentAnswers.friend) {
      const advanceId = setTimeout(() => resolveRound("both-answered"), 600);
      return () => clearTimeout(advanceId);
    }
  }, [stage, currentAnswers.yours, currentAnswers.friend, resolveRound]);

  useEffect(() => {
    if (stage === "results" || stage === "lobby") {
      resolvingRef.current = false;
    }
  }, [stage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("matchmind-is-host", isHostSession ? "true" : "false");
  }, [isHostSession]);

  useEffect(() => {
    if (stage === "playing" || stage === "lobby" || stage === "inviting") {
      setSharedAnswers(null);
      setHasSharedAnswers(false);
    }
  }, [stage]);

  useEffect(() => {
    if (!activeSession) {
      setSharedAnswers(null);
      setHasSharedAnswers(false);
    }
  }, [activeSession]);

  useEffect(() => {
    if (stage === "expired" || stage === "lobby" || stage === "declined") {
      setIsHostSession(false);
    }
  }, [stage]);

  const matches = history.filter((item) => item.matched).length;
  const liveScore =
    matches +
    (stage === "playing" &&
    currentAnswers.yours &&
    currentAnswers.friend &&
    currentAnswers.yours === currentAnswers.friend
      ? 1
      : 0);

  return {
    stage,
    selectedFriend,
    setSelectedFriend,
    inviteRemaining,
    sendInvite,
    inviteId,
    setInviteId,
    acceptInvite,
    declineInvite,
    startGame,
    startGameFromRemote,
    exitGame,
    cancelInvite: resetToLobby,
    currentQuestion,
    roundIndex,
    questions,
    currentAnswers,
    chooseAnswer,
    setFriendAnswer,
    history,
    matches,
    liveScore,
    sessionId,
    activeSession,
    markAcceptedByFriend,
    markDeclinedByFriend,
    markInviteExpired,
    difficulty,
    isHostSession,
    setIsHostSession,
    sharedAnswers,
    setSharedAnswers,
    hasSharedAnswers,
    setHasSharedAnswers,
  };
};

export const MatchMindGameProvider = ({ children }) => {
  const value = useMatchMindGameInternal();
  return (
    <MatchMindGameContext.Provider value={value}>
      {children}
    </MatchMindGameContext.Provider>
  );
};

// The hook lives next to its provider on purpose (dev-only fast-refresh rule).
// eslint-disable-next-line react-refresh/only-export-components
export const useMatchMindGame = () => {
  const context = useContext(MatchMindGameContext);
  if (!context) {
    throw new Error("useMatchMindGame must be used within MatchMindGameProvider");
  }
  return context;
};
