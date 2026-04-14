export interface Choice {
  text: string;
  trust?: number;
  score?: number;
  next?: string;        // dialog key to jump to
  decision?: string;    // slug recorded in GameState
}

export interface Line {
  speaker: string;      // '{name}' is replaced with player name
  portrait?: string;    // texture key for portrait sprite
  text: string;         // dialog text ('{name}' replaced)
  choices?: Choice[];
}

export type Dialog = Line[];

// ──────────────────────────────────────────────────────────────────────────
//  ALL DIALOGS — Vietnamese
// ──────────────────────────────────────────────────────────────────────────
export const DIALOGS: Record<string, Dialog> = {

  // ── CỔNG VÀO / GATE ──────────────────────────────────────────────────
  'gate-kbroi': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Dừng lại. Đây là vùng lõi Vườn Quốc gia. Không phải ai muốn vào cũng vào được.' },
    { speaker: '{name}',
      text: 'Xin chào. Tôi là sinh viên năm 3. Tôi có giấy giới thiệu từ Khoa Du lịch, muốn nghiên cứu tri thức bản địa người Mạ. Tôi đến đây để làm luận văn nghiên cứu của tôi.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Luận văn. Phỏng vấn. Rồi anh về thành phố viết, đăng, xong. Người Mạ không thiếu người đến hỏi. Họ hỏi, ghi, đi. Không ai ở lại.',
      choices: [
        { text: 'Giấy tờ của tôi hợp lệ — anh không có lý do từ chối',
          trust: 0, score: 0, next: 'choice 1', decision: 'gate_patient' },
        { text: 'Anh nói đúng. Tôi không hứa mình sẽ khác. Nhưng cho tôi ở lại học — không phỏng vấn, chỉ học."',
          trust: 7, score: 15, next: 'choice 2', decision: 'gate_eager' },
        { text: 'Được rồi. Tôi tự tìm đường." [bật GPS]',
          trust: 0, score: 0, next: 'choice 3', decision: 'gate_pushy' },
      ],
    },
  ],

  'choice 1' : [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Tôi không từ chối. Tôi chỉ nói sự thật.' },
  ],
  'choice 2' : [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Anh biết bơi không?' },
  ],
  'choice 3' : [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'GPS không có tín hiệu trong đó. Anh sẽ lạc trong 20 phút.' },
  ],


  // 'gate-patient': [
  //   { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
  //     text: 'Hmm... Biết im lặng — điều đó hiếm thấy ở người thành phố.' },
  //   { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
  //     text: 'Được rồi. Ba luật: không bẻ cây vô cớ, không làm ồn, không chạm vào thú hoang khi chưa hỏi tôi. Rõ chưa?' },
  //   { speaker: '{name}',
  //     text: 'Rõ ạ. Cảm ơn anh K\'Brơi.' },
  //   { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
  //     text: 'Đừng cảm ơn vội. Rừng tự có cách đánh giá người. Theo tôi.' },
  // ],

  // 'gate-eager': [
  //   { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
  //     text: 'Ai cũng nói vậy. Nhưng ít người thực sự học được gì khi ra đây.' },
  //   { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
  //     text: 'Vào đi. Đừng đi khỏi tầm nhìn của tôi.' },
  // ],

  // 'gate-pushy': [
  //   { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
  //     text: '...' },
  //   { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
  //     text: 'Giấy phép không thay thế được sự tôn trọng. Vào đi. Nhưng tôi sẽ theo dõi từng bước.' },
  // ],

  // ── CÂY RỪNG / PLANTS ────────────────────────────────────────────────
  'plant-intro': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: '[chỉ vào cây] Cây cẩm lai. Hơn 150 năm. Người Mạ không chặt cây này. Không bao giờ.' },
    { speaker: '{name}',
      text: 'Vì sao? Gỗ đẹp lắm mà.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Vì nó không thuộc về mình...' },
  ],

  'plant-success': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Đúng rồi. Không tệ cho người lần đầu vào rừng.' },
  ],

  'plant-fail': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Sai. Đây là lý do người lạ không tự vào rừng được — dùng sai cây có thể gây độc hoặc vô dụng.' },
  ],

  // ── BẪY / TRAP ───────────────────────────────────────────────────────
  'trap-found': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Dừng lại!' },
    { speaker: '{name}',
      text: 'Chuyện gì vậy?' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Bẫy. Ai đó đặt bẫy trái phép trong vùng lõi. Con hươu đang bị kẹt kìa.' },
    { speaker: '{name}',
      text: 'Phải giúp nó ngay! Làm sao bây giờ?' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Không được chạy ào đến. Nó sẽ hoảng loạn, giãy đạp mà tự thương nặng hơn. Cần tiếp cận từ từ.' },
  ],

  'trap-saved': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Tốt. Anh/chị làm đúng rồi.' },
    { speaker: '{name}',
      text: 'Con hươu nhỏ quá... Ai lại nhẫn tâm đặt bẫy ở đây?' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Bẫy này không phải của kẻ săn trộm thông thường. Trông chuyên nghiệp hơn nhiều.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: '(Lầm bầm) Phải điều tra thêm...' },
  ],

  // ── AMA K'NƠI ────────────────────────────────────────────────────────
  'amaknoi-first': [
    { speaker: 'Ama K\'Nơi', portrait: 'npc-amaknoi',
      text: 'K\'Brơi dẫn khách về. Ngồi xuống đây con, ngồi.' },
    { speaker: '{name}',
      text: 'Thưa Ama, con đến để học về tri thức bản địa của người Mạ.' },
    { speaker: 'Ama K\'Nơi', portrait: 'npc-amaknoi',
      text: 'Tri thức không học trong sách được. Phải sống với rừng qua nhiều thế hệ mới có.' },
    { speaker: 'Ama K\'Nơi', portrait: 'npc-amaknoi',
      text: 'Con biết cây bép không? Cây can dại? Cây mặt cắt?' },
    { speaker: '{name}',
      text: 'Dạ... con chưa biết ạ.' },
    { speaker: 'Ama K\'Nơi', portrait: 'npc-amaknoi',
      text: 'Tốt. Biết mình không biết — đó là bước đầu tiên. Đi với K\'Brơi vào rừng. Học từ cái cây, không phải từ sách.' },
  ],

  // ── BÀ YĂ K'BEN ──────────────────────────────────────────────────────
  'yakben-first': [
    { speaker: 'Bà Yă K\'Ben', portrait: 'npc-yakben',
      text: 'Khách thành phố ghé thăm à? Ngồi đây, ngồi. Già đang dệt.' },
    { speaker: '{name}',
      text: 'Bà ơi, màu vải đẹp quá! Bà nhuộm bằng gì vậy?' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'npc-yakben',
      text: 'Cây rừng hết. Cây mặt cắt cho màu đỏ sẫm. Cây cẩm lai cho vàng. Vỏ cây chay cho nâu đen.' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'npc-yakben',
      text: 'Nếu rừng mất... già này không còn gì để dệt. Kỹ thuật nghìn năm này sẽ theo già về với đất thôi.' },
  ],

  // ── BẰNG CHỨNG / EVIDENCE ────────────────────────────────────────────
  'evidence-found': [
    { speaker: '{name}',
      text: 'K\'Brơi... những cái cọc này là gì vậy? Cọc khảo sát?' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: '...' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Khảo sát địa chất. Nhưng khu này thuộc vùng bảo vệ nghiêm — không ai có quyền vào.' },
    { speaker: '{name}',
      text: 'Ai vào đây được? Làm sao qua được trạm kiểm lâm?' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: '...',
      choices: [
        { text: '[Lấy điện thoại, chụp ảnh bằng chứng]',
          score: 150, trust: 20, next: 'evidence-photo', decision: 'collect_evidence' },
        { text: '[Để đó, tiếp tục đi về làng]',
          score: -30, trust: -10, next: 'evidence-skip', decision: 'skip_evidence' },
      ],
    },
  ],

  'evidence-photo': [
    { speaker: '{name}',
      text: '[Chụp ảnh tỉ mỉ từng cọc khảo sát] Cần ghi lại hết bằng chứng này.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Tốt. Có bằng chứng mới tố cáo được.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Tôi cần nói với anh/chị một điều... Tôi biết người liên quan đến việc này. Nhưng không phải ở đây.' },
  ],

  'evidence-skip': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Đi qua bằng chứng như vậy... Không có bằng chứng thì nói ai nghe?' },
  ],

  // ── CHƯƠNG 2 ──────────────────────────────────────────────────────────
  'ch2-intro': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Anh/chị đã chứng minh mình khác người bình thường. Vậy tôi sẽ chia sẻ điều này.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Dự án thủy điện đang lên kế hoạch xây đập ngay phía bắc khu lõi. Nếu xây xong, nước sẽ nhấn chìm toàn bộ làng Mạ và rừng nguyên sinh này.' },
    { speaker: '{name}',
      text: 'Thủy điện? Trong vườn quốc gia? Điều đó... hợp pháp không?' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Không. Nhưng nếu báo cáo đánh giá tác động môi trường bị làm giả...' },
    { speaker: '{name}',
      text: 'Chúng ta cần bằng chứng. Càng nhiều càng tốt.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Đúng. Đi với tôi. Phải thu thập trước khi họ xóa dấu vết.' },
  ],

  'ch2-lan': [
    { speaker: 'Lan', portrait: 'npc-lan',
      text: 'Anh/chị là sinh viên mà K\'Brơi nhắc đến phải không? Tôi là Lan, kiểm lâm khu A.' },
    { speaker: 'Lan', portrait: 'npc-lan',
      text: 'Tôi cũng đang điều tra những hoạt động khảo sát bất thường này. Cần ít nhất 4 bằng chứng rõ ràng mới tố cáo được.' },
    { speaker: '{name}',
      text: 'Chúng tôi đã có một số rồi. Sẽ tìm thêm.' },
    { speaker: 'Lan', portrait: 'npc-lan',
      text: 'Cẩn thận. Người phía sau dự án này có quan hệ rộng. Đừng để họ biết anh/chị đang thu thập bằng chứng.' },
  ],

  'ch2-hung': [
    { speaker: 'Hùng', portrait: 'npc-hung',
      text: 'Anh/chị... đang làm gì ở đây vậy?' },
    { speaker: '{name}',
      text: 'Tôi đang điều tra. Anh là kiểm lâm viên — anh có biết về những cọc khảo sát trong khu lõi không?' },
    { speaker: 'Hùng', portrait: 'npc-hung',
      text: '... Tôi... tôi không biết gì cả.' },
    { speaker: '{name}',
      text: 'Anh Hùng... K\'Brơi kể về anh. Anh quen gia đình cậu ấy từ lâu. Nếu anh biết gì, nói thật đi.',
      choices: [
        { text: '[Kiên nhẫn chờ, không ép] "Anh có thể tin tôi"',
          trust: 10, score: 80, next: 'hung-confess', decision: 'hung_trust' },
        { text: '[Đối chất thẳng] "Anh nhận tiền từ họ rồi phải không?"',
          trust: -5, score: 50, next: 'hung-cornered', decision: 'hung_confront' },
      ],
    },
  ],

  'hung-confess': [
    { speaker: 'Hùng', portrait: 'npc-hung',
      text: '(Thở dài) Tôi... tôi đã ký tên vào báo cáo giả. Họ nói chỉ cần chữ ký thôi. Nhưng tôi biết điều đó sai.' },
    { speaker: 'Hùng', portrait: 'npc-hung',
      text: 'Tôi có thể cung cấp bản sao báo cáo thật. Đó là bằng chứng mạnh nhất anh/chị có thể có.' },
  ],

  'hung-cornered': [
    { speaker: 'Hùng', portrait: 'npc-hung',
      text: '...' },
    { speaker: 'Hùng', portrait: 'npc-hung',
      text: 'Tôi không nhận tiền. Tôi bị ép. Gia đình tôi... thôi, không nói thêm nữa. Hãy cẩn thận.' },
  ],

  'ch2-thang': [
    { speaker: 'Nguyễn Văn Thắng', portrait: 'npc-thang',
      text: 'Ồ! Sinh viên du lịch phải không? Tôi là Thắng, giám đốc dự án năng lượng khu vực.' },
    { speaker: 'Nguyễn Văn Thắng', portrait: 'npc-thang',
      text: 'Dự án thủy điện sẽ mang điện đến 50.000 hộ dân vùng sâu vùng xa. Đó là ánh sáng văn minh cho người nghèo.' },
    { speaker: '{name}',
      text: 'Nhưng thưa ông — điều đó có nghĩa làng người Mạ và rừng nguyên sinh sẽ bị nhấn chìm?' },
    { speaker: 'Nguyễn Văn Thắng', portrait: 'npc-thang',
      text: 'Sự phát triển bao giờ cũng có cái giá. 200 hecta rừng đổi lấy điện cho hàng vạn người — đó là đánh đổi xứng đáng.',
      choices: [
        { text: '"Ông nói đúng. Phát triển kinh tế là quan trọng nhất"',
          trust: -25, score: 0, next: 'thang-agree', decision: 'agree_thang' },
        { text: '"Hệ sinh thái nuôi sống cả vùng. Phá đi thì hậu quả dài hạn ra sao?"',
          trust: 10, score: 100, next: 'thang-push', decision: 'question_thang' },
        { text: '"Tôi có bằng chứng về hoạt động khảo sát trái phép trong vùng lõi"',
          trust: 15, score: 180, next: 'thang-expose', decision: 'confront_thang' },
      ],
    },
  ],

  'thang-agree': [
    { speaker: 'Nguyễn Văn Thắng', portrait: 'npc-thang',
      text: 'Đúng vậy! Tư duy đúng đắn. Sau khi tốt nghiệp, ghé tìm tôi — công ty cần người như thế.' },
  ],

  'thang-push': [
    { speaker: 'Nguyễn Văn Thắng', portrait: 'npc-thang',
      text: 'Hừm. Lý thuyết hay lắm. Người nghèo không sống được bằng "hệ sinh thái". Cháu còn trẻ, chưa hiểu thực tế.' },
  ],

  'thang-expose': [
    { speaker: 'Nguyễn Văn Thắng', portrait: 'npc-thang',
      text: '...' },
    { speaker: 'Nguyễn Văn Thắng', portrait: 'npc-thang',
      text: 'Cháu cẩn thận với những gì cháu nghĩ mình biết.' },
    { speaker: '{name}',
      text: '[Nhìn thẳng] Tôi biết đủ rồi.' },
  ],

  // ── KẾT THÚC / ENDINGS ───────────────────────────────────────────────
  'ending-good': [
    { speaker: 'Lan', portrait: 'npc-lan',
      text: 'Nhờ bằng chứng anh/chị thu thập, chúng tôi đủ cơ sở tố cáo chính thức. Dự án thủy điện bị đình chỉ điều tra.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Rừng vẫn còn đó. Làng Mạ vẫn còn đó. Đó là điều quan trọng nhất.' },
    { speaker: '{name}',
      text: 'Luận văn của tôi bây giờ không chỉ là học thuật nữa. Nó là câu chuyện thật.' },
    { speaker: 'Ama K\'Nơi', portrait: 'npc-amaknoi',
      text: 'Rừng không kết thúc ở một chiến thắng. Nó cần người có tâm đứng bên nó mỗi ngày. Cảm ơn con.' },
  ],

  'ending-neutral': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Dự án bị làm chậm lại. Nhưng chưa kết thúc. Cuộc chiến vẫn còn.' },
    { speaker: '{name}',
      text: 'Tôi sẽ trở lại. Lần này không phải để viết luận văn.' },
  ],

  'ending-bad': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Dự án được thông qua. Họ sẽ bắt đầu xây vào mùa khô.' },
    { speaker: '{name}',
      text: '...' },
    { speaker: 'Ama K\'Nơi', portrait: 'npc-amaknoi',
      text: 'Đây không phải lần đầu rừng bị đe dọa. Và cũng sẽ không phải lần cuối. Quan trọng là con đã học được gì.' },
  ],
};

/** Replace {name} placeholder in text. */
export function formatText(text: string, playerName: string): string {
  return text.replace(/\{name\}/g, playerName);
}
