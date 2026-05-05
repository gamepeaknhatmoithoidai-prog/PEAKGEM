export interface Choice {
  text: string;
  trust?: number;
  score?: number;
  next?: string;
  decision?: string;
}

export interface Line {
  speaker: string;
  portrait?: string;
  text: string;
  choices?: Choice[];
  multiSelect?: boolean;
  selectCount?: number;
}

export type Dialog = Line[];

// ──────────────────────────────────────────────────────────────────────────
//  ALL DIALOGS — Vietnamese
// ──────────────────────────────────────────────────────────────────────────
export const DIALOGS: Record<string, Dialog> = {

  // ══════════════════════════════════════════════════════════════════════
  // CHƯƠNG 1 — HỌC TIẾNG CỦA RỪNG
  // ══════════════════════════════════════════════════════════════════════

  // ── CẢNH 1.1: CỔNG RỪNG ──────────────────────────────────────────────
  'gate-kbroi': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Dừng lại. Đây là vùng lõi Vườn Quốc gia. Anh là ai?' },
    { speaker: '{name}',
      text: 'Tôi là sinh viên năm 3, ngành Quản trị Du lịch. Có giấy giới thiệu từ Khoa đây. Tôi đến để nghiên cứu tri thức bản địa người Mạ — làm luận văn tốt nghiệp.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Luận văn. Phỏng vấn. Rồi về thành phố viết, đăng, xong.\n\nNgười Mạ không thiếu người đến hỏi. Họ hỏi, ghi, rời đi. Không ai ở lại.',
      choices: [
        { text: 'Giấy tờ của tôi hợp lệ. Anh không có lý do từ chối.',
          trust: 0, score: 0, next: 'gate-choice-A', decision: 'gate_pushy' },
        { text: 'Anh nói đúng. Tôi không hứa mình sẽ khác. Nhưng cho tôi ở lại học — không phỏng vấn, chỉ học.',
          trust: 7, score: 15, next: 'gate-choice-B', decision: 'gate_humble' },
        { text: '[Bật GPS] Được rồi, tôi tự tìm đường vào.',
          trust: 0, score: 5, next: 'gate-choice-C', decision: 'gate_stubborn' },
      ],
    },
  ],

  'gate-choice-A': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Tôi không từ chối. Tôi chỉ nói sự thật.\n\n[im lặng, rồi bước sang một bên]' },
  ],
  'gate-choice-B': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: '...\n\n[nhìn {name} một lúc, rồi quay lưng đi vào]\n\nĐi theo.' },
  ],
  'gate-choice-C': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'GPS không có tín hiệu trong đó. Anh sẽ lạc trong vòng 20 phút.' },
    { speaker: '{name}',
      text: '...' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: '[thở dài]\nĐi theo tôi.' },
  ],

  // Dẫn chuyện trước mini-game phân loại rác
  'trash-narrative': [
    { speaker: 'Dẫn chuyện',
      text: '{name} nhìn xuống chân mình. Một túi rác du khách để lại bị gió thổi tung, vương vãi ngay trước cổng rừng.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: '[nhìn đống rác, giọng phẳng]\nMuốn vào rừng — phải biết tôn trọng nó trước.' },
  ],

  // Phản ứng K'Brơi sau mini-game phân loại rác
  'kbroi-after-trash-good': [
    { speaker: 'Dẫn chuyện', text: '[ ✅ Phân loại sạch sẽ ]' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: '[khẽ gật đầu. Không nói thêm gì. Tiếp tục đi.]' },
  ],
  'kbroi-after-trash-ok': [
    { speaker: 'Dẫn chuyện', text: '[ ~ Còn sót vài món ]' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Còn sót. Nhưng được rồi.' },
  ],
  'kbroi-after-trash-poor': [
    { speaker: 'Dẫn chuyện', text: '[ ❌ Làm chưa xong ]' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Rừng không cần người làm nửa vời.' },
  ],

  // ── CẢNH 1.2: NHÀ BÀ YĂ K'BEN — Giới thiệu dệt thổ cẩm ─────────────
  'scene_1_2': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Bà hỏi anh có ăn được cơm bếp củi không. Tôi trả lời là có. Đúng không?' },
    { speaker: '{name}',
      text: 'Đúng. Cảm ơn bà.' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: '[cười] Ngồi đây đi cháu. Tay bà bận nhưng miệng còn rảnh.' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: 'Khách du lịch hay ghé đây lắm. Họ đến, chụp ảnh tấm thổ cẩm, rồi đi. Chưa ai hỏi bà hiểu người Mạ cần gì không.\n\nCháu hiểu người Mạ cần gì không?' },
    { speaker: '{name}',
      text: 'Thật ra... không. Đó là lý do cháu đến đây.' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: '[gật đầu, giọng ấm hơn] Câu đó thật thà hơn cái luận văn của cháu rồi đó. Tay rảnh không? Làm cùng bà đi.' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: 'Dệt không khó. Khó là giữ nhịp tay đều và sợi chắc. Nhìn tay bà đây. Đừng vội.' },
  ],

  // Phản hồi sau mini-game dệt
  'scene_1_2_sew_loose': [
    { speaker: 'Dẫn chuyện', text: '[ ❌ Chưa quen — sợi lệch, không đều ]' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: '[cười nhẹ] Lệch nhịp rồi. Lần đầu ai cũng vậy. Làm lại đi.' },
  ],
  'scene_1_2_sew_medium': [
    { speaker: 'Dẫn chuyện', text: '[ ~ Khá — tương đối đều, còn đôi chỗ lệch ]' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: 'Nhìn khá ổn đó, nhưng vẫn còn chỗ lệch. Phải chắc tay hơn.' },
  ],
  'scene_1_2_sew_good': [
    { speaker: 'Dẫn chuyện', text: '[ ✅ Đẹp — chắc tay, thẳng hàng ]' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: 'Được rồi. Nhịp đều, sợi giữ chặt.' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: 'Làm vậy, vải mới bền. Hoa văn mới giữ được qua nhiều đời.' },
  ],

  // ── CẢNH 1.3: HÁI NGUYÊN LIỆU NHUỘM VẢI ─────────────────────────────
  'forest_gathering': [
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: 'Đi vào rừng hái giúp bà ít nguyên liệu để nhuộm vải đi. Nhìn kỹ rồi hãy lấy.' },
    { speaker: '{name}',
      text: 'Cháu cần lấy loại nào ạ?' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: 'Bà không kén. Nhưng phải đúng cây nhuộm được. Nhìn kỹ — không phải cây nào cũng dùng được đâu.' },
    { speaker: '{name}',
      text: '[nhìn quanh] Mình nên lấy cái nào đây...',
      multiSelect: true,
      selectCount: 2,
      choices: [
        { text: 'Củ nghệ rừng', score: 1 },
        { text: 'Cây chàm',     score: 1 },
        { text: 'Cây gõ đỏ',   score: 0 },
        { text: 'Giáng hương',  score: 0 },
      ],
    },
  ],

  'forest_gathering_result_good': [
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: '[gật đầu] Đúng rồi. Củ nghệ cho màu vàng, cây chàm cho màu xanh-đen — hai màu chính của thổ cẩm Mạ.' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: 'Màu không mua được ở chợ. Màu từ rừng mới giữ được bền.' },
  ],
  'forest_gathering_result_bad': [
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: '[lắc đầu nhẹ] Cây này gỗ quý đó cháu. Để nó yên. Bà cần cây nhuộm vải, không phải cây lấy gỗ.' },
  ],

  // ── CẢNH 1.4: CỨU CON HƯƠU ───────────────────────────────────────────
  'call_help': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: '[giọng thấp, ra hiệu dừng] Có con hươu bị bẫy đằng kia. Đi theo tôi.' },
  ],

  'scene_1_4': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Bẫy. Không phải của người làng. Còn mới.' },
    { speaker: '{name}',
      text: 'Mình gỡ ra được không?' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Không được chạy ào đến. Nó sẽ hoảng loạn, giãy đạp rồi tự thương nặng hơn. Anh giữ thân nó — từ từ, nhẹ nhàng. Tôi gỡ dây.' },
  ],

  'scene_1_4_success': [
    { speaker: 'Dẫn chuyện',
      text: 'Sau khi được thả, con hươu không chạy ngay. Nó dừng lại ở mép bụi — quay nhìn lại. Rồi biến vào rừng.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Ông tôi nói: nó nhớ mặt người.' },
    { speaker: '{name}',
      text: 'Ai đặt bẫy ở đây vậy?' },
  ],

  'after_secure': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Từ đầu mùa khô đến nay tôi thấy 7 cái như thế này.' },
    { speaker: '{name}',
      text: 'Anh báo kiểm lâm chưa?' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Rồi nhưng không có gì xảy ra.' },
    { speaker: 'Dẫn chuyện',
      text: 'K\'Brơi nhét cái bẫy vào gùi. Đi tiếp — không thêm một lời.' },
  ],

  // ── CẢNH 1.5: NHẬN DIỆN CON VẬT & KẾT CHƯƠNG 1 ──────────────────────
  'guess_image': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: '[chỉ về phía bụi cây xa] Có gì đó đằng kia từ sáng. Anh chụp ảnh được không?' },
    { speaker: 'Dẫn chuyện', portrait: 'bo-tot',
      text: '[Nhìn vào ảnh vừa chụp — đây là con gì?]',
      choices: [
        { text: 'Trâu rừng',    score: 0 },
        { text: 'Bò tót',       score: 15 },
        { text: 'Heo rừng lớn', score: 0 },
        { text: 'Gấu chó',      score: 0 },
      ],
    },
  ],

  'scene_1_5': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Bò tót xuống gần làng ban ngày... Trong rừng đang có tiếng động làm nó sợ.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: '[nhìn về phía rừng sâu] Cùng hướng với vết máy móc tôi thấy tuần trước.' },
    { speaker: '{name}',
      text: 'Anh đang nói có người đang làm gì đó trong rừng?' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Hai tuần trước tôi đi kiểm tra một mình. Không chỉ một vết — cả một đường dài, từ phía suối vào đến gần vùng sinh sản bò tót.' },
    { speaker: '{name}',
      text: 'Anh báo ai chưa?' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Kiểm lâm Hùng. Người quen nhà tôi từ hồi còn nhỏ. Ông ấy bảo để xem.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: '[giọng phẳng lại] Hai tuần. Không có gì.' },
    { speaker: '{name}',
      text: 'Anh nghĩ ông ấy...?' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Tôi không biết ông ấy không làm được — hay không muốn làm.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Tôi cần người giữ bằng chứng, người mà không thuộc nơi này, không bị ép được. Người trong làng có thể bị áp lực. Anh thì không.' },
    { speaker: '{name}',
      text: '',
      choices: [
        { text: 'Tôi ở lại. Và tôi muốn hiểu hết chuyện đang xảy ra.',
          score: 25, next: 'c1-choice-stay', decision: 'ch1_stay' },
        { text: 'Tôi cần nghĩ thêm. Đây không phải việc của luận văn nữa rồi.',
          score: 10, next: 'c1-choice-unsure', decision: 'ch1_unsure' },
      ],
    },
  ],

  'c1-choice-stay': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Ngủ sớm đi. Sáng mai 5 giờ mình đi.' },
  ],

  'c1-choice-unsure': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Đúng. Nếu anh không chắc — đừng ở lại. Nửa vời còn tệ hơn không làm gì.' },
    { speaker: 'Dẫn chuyện',
      text: '{name} một mình nhìn rừng đêm. Rồi quyết định ở lại.' },
  ],

  // Cây Tung — khoảnh khắc chiêm nghiệm trên đường đi
  'plant-intro': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: '[chỉ vào cây] Cây Tung này hơn trăm năm. Người ngoài nhìn vào thấy gỗ quý. Tụi tôi quen coi nó như một phần của rừng — không ai nghĩ tới chuyện chặt.' },
    { speaker: '{name}',
      text: 'Hơn trăm năm mà không ai lấy?' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Ai cũng từng nghĩ qua. Nhưng rồi hiểu — có những thứ nếu lấy đi, thứ mất không chỉ là cái cây. Mà là cả phần rừng đã giữ nó ở đây từng ấy năm.' },
  ],

  // ── AMA K'NƠI — gặp lần đầu ──────────────────────────────────────────
  'amaknoi-first': [
    { speaker: 'Ama K\'Nơi', portrait: 'char-amaknoi',
      text: 'K\'Brơi dẫn khách về. Ngồi xuống đây con, ngồi.' },
    { speaker: '{name}',
      text: 'Thưa Ama, con đến để học về tri thức bản địa của người Mạ.' },
    { speaker: 'Ama K\'Nơi', portrait: 'char-amaknoi',
      text: 'Tri thức không học trong sách được. Phải sống với rừng qua nhiều đời mới có.\n\nCon biết cây bép không? Cây cần dại? Cây mặt cắt?' },
    { speaker: '{name}',
      text: 'Dạ... con chưa biết ạ.' },
    { speaker: 'Ama K\'Nơi', portrait: 'char-amaknoi',
      text: 'Tốt. Biết mình không biết — đó là bước đầu tiên.\n\nĐi với K\'Brơi vào rừng. Học từ cái cây, không phải từ sách.' },
  ],

  // ── BÀ YĂ K'BEN — gặp lần đầu ───────────────────────────────────────
  'yakben-first': [
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: 'Khách thành phố ghé thăm à? Ngồi đây, ngồi. Già đang dệt.' },
    { speaker: '{name}',
      text: 'Bà ơi, màu vải đẹp quá! Bà nhuộm bằng gì vậy?' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: 'Cây rừng hết. Cây chàm cho màu xanh-đen. Củ nghệ rừng cho màu vàng. Vỏ cây chay cho màu nâu.' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'char-yakben',
      text: 'Nếu rừng mất... già này không còn gì để nhuộm. Kỹ thuật nghìn năm này sẽ theo già về với đất thôi.' },
  ],

  // ── BẰNG CHỨNG / EVIDENCE ─────────────────────────────────────────────
  'evidence-found': [
    { speaker: '{name}',
      text: 'K\'Brơi... những cái cọc này là gì? Cọc khảo sát?' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Khảo sát địa chất. Khu này thuộc vùng bảo vệ nghiêm — không ai có quyền vào khảo sát mà không có giấy phép đặc biệt.' },
    { speaker: '{name}',
      text: 'Ai làm được chuyện này? Làm sao qua được trạm kiểm lâm?' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: '...',
      choices: [
        { text: '[Lấy điện thoại, chụp ảnh bằng chứng]',
          score: 150, trust: 20, next: 'evidence-photo', decision: 'collect_evidence' },
        { text: '[Để đó, tiếp tục đi]',
          score: -30, trust: -10, next: 'evidence-skip', decision: 'skip_evidence' },
      ],
    },
  ],

  'evidence-photo': [
    { speaker: '{name}',
      text: '[chụp tỉ mỉ từng cọc, từng dấu đánh cây] Cần ghi lại hết.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Tốt. Có bằng chứng mới tố cáo được.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Tôi cần nói với anh một điều... Tôi biết người có liên quan đến việc này. Nhưng không phải ở đây.' },
  ],

  'evidence-skip': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Đi qua bằng chứng như vậy... Không có bằng chứng, nói ai người ta tin?' },
  ],

  // ══════════════════════════════════════════════════════════════════════
  // CHƯƠNG 2 — CÁI GIÁ CỦA HÀNH ĐỘNG
  // ══════════════════════════════════════════════════════════════════════

  // ── CẢNH 2.1: THU THẬP MANH MỐI ──────────────────────────────────────
  'c2s1-intro': [
    { speaker: '{name}',
      text: 'K\'Brơi, hôm nay mình đi tuyến nào? Tôi cần ghi vào nhật ký thực địa.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Đứng lại.' },
    { speaker: '{name}',
      text: '...Dây đo khảo sát? Ai đo gì ở đây vậy?' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Câu hỏi đúng rồi đó.' },
  ],

  'c2s1-postgame': [
    { speaker: '{name}',
      text: 'Dây đo, GPS, dấu đánh cây — tất cả cùng một hướng. Đây không phải ngẫu nhiên.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Con đường này... trước đây không có.' },
    { speaker: '{name}',
      text: 'Nhưng trong hồ sơ Vườn Quốc gia cũng không có dự án nào ở đây.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Không có. Chính thức là vậy.' },
  ],

  // ── CẢNH 2.2: CHẠY TRỐN ───────────────────────────────────────────────
  'c2s2-intro': [
    { speaker: '{name}',
      text: 'K\'Brơi, tôi cần chụp cái cọc khảo sát kia—' },
    { speaker: 'Công nhân',
      text: 'Ê! Đứng lại! Mày là ai? Chụp gì ở đây?' },
  ],

  'c2s2-postgame': [
    { speaker: '{name}',
      text: 'Họ hung hăng vậy... Đây là rừng quốc gia, họ đang làm gì mà sợ bị chụp ảnh?' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Đó chính là lý do.' },
    { speaker: '{name}',
      text: 'Mình cần thêm bằng chứng. Nhưng bây giờ họ biết mặt rồi.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Tối mình đi lại. Trong đêm — tôi không quen chỗ đó ban đêm. Nhưng anh muốn không?' },
    { speaker: '{name}',
      text: 'Muốn.' },
  ],

  // ── CẢNH 2.3: CHỤP ẢNH BẰNG CHỨNG BAN ĐÊM ───────────────────────────
  'c2s3-intro': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Đừng lại gần. Chụp những gì cần thiết, rồi đi.' },
    { speaker: '{name}',
      text: 'Tôi sẽ chụp. Nhưng phải nhanh.' },
  ],

  'c2s3-postgame': [
    { speaker: '{name}',
      text: 'Có rồi... nhưng chưa đủ.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Chừng này chỉ đủ để nghi ngờ. Chưa đủ để tố cáo.' },
  ],

  // ── CẢNH 2.4: DI CHUYỂN ẨN NÁU ───────────────────────────────────────
  'c2s4-intro': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Đặt gót xuống trước. Cảm nhận đất. Rồi mới đặt cả bàn chân.' },
    { speaker: '{name}',
      text: '[thử] Như này à... nhẹ hơn rồi.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Đứng. Đừng thở mạnh.' },
  ],

  // ── Giữ lại cho C2Scene4Stealth.ts ───────────────────────────────────
  'ch2-intro': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Anh đã chứng minh mình khác người bình thường. Vậy tôi sẽ chia sẻ điều này.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Dự án thủy điện đang lên kế hoạch xây đập ngay phía bắc khu lõi. Nếu xây xong, nước sẽ nhấn chìm toàn bộ làng Mạ và rừng nguyên sinh này.' },
    { speaker: '{name}',
      text: 'Thủy điện? Trong vườn quốc gia? Điều đó... hợp pháp không?' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Không. Nhưng nếu báo cáo đánh giá tác động môi trường bị làm giả...' },
    { speaker: '{name}',
      text: 'Chúng ta cần bằng chứng. Càng nhiều càng tốt.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Đúng. Đi với tôi. Phải thu thập trước khi họ xóa dấu vết.' },
  ],

  'ch2-lan': [
    { speaker: 'Lan', portrait: 'char-lan',
      text: 'Anh là sinh viên mà K\'Brơi nhắc đến phải không? Tôi là Lan, kiểm lâm khu A.' },
    { speaker: 'Lan', portrait: 'char-lan',
      text: 'Tôi cũng đang điều tra những hoạt động khảo sát bất thường này. Cần ít nhất 4 bằng chứng rõ ràng mới tố cáo được.' },
    { speaker: '{name}',
      text: 'Chúng tôi đã có một số rồi. Sẽ tìm thêm.' },
    { speaker: 'Lan', portrait: 'char-lan',
      text: 'Cẩn thận. Người phía sau dự án này có quan hệ rộng. Đừng để họ biết anh đang thu thập bằng chứng.' },
  ],

  'ch2-hung': [
    { speaker: 'Hùng', portrait: 'char-hung',
      text: 'Anh... đang làm gì ở đây vậy?' },
    { speaker: '{name}',
      text: 'Tôi đang điều tra. Anh là kiểm lâm viên — anh có biết về những cọc khảo sát trong khu lõi không?' },
    { speaker: 'Hùng', portrait: 'char-hung',
      text: '... Tôi... tôi không biết gì cả.' },
    { speaker: '{name}',
      text: 'Anh Hùng... K\'Brơi kể về anh. Anh quen gia đình cậu ấy từ lâu. Nếu anh biết gì, nói thật đi.',
      choices: [
        { text: '[Kiên nhẫn chờ] "Anh có thể tin tôi"',
          trust: 10, score: 80, next: 'hung-confess', decision: 'hung_trust' },
        { text: '[Đối chất thẳng] "Anh nhận tiền từ họ rồi phải không?"',
          trust: -5, score: 50, next: 'hung-cornered', decision: 'hung_confront' },
      ],
    },
  ],

  'ch2-thang': [
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: 'Ồ! Sinh viên du lịch phải không? Tôi là Thắng, giám đốc dự án năng lượng khu vực.' },
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: 'Dự án thủy điện sẽ mang điện đến 50.000 hộ dân vùng sâu vùng xa. Đó là ánh sáng văn minh cho người nghèo.' },
    { speaker: '{name}',
      text: 'Nhưng thưa ông — điều đó có nghĩa làng người Mạ và rừng nguyên sinh sẽ bị nhấn chìm?' },
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
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

  'hung-confess': [
    { speaker: 'Hùng', portrait: 'char-hung',
      text: '[thở dài]\nTôi đã ký tên vào báo cáo giả. Họ nói chỉ cần chữ ký thôi.\n\nNhưng tôi biết điều đó sai.' },
    { speaker: 'Hùng', portrait: 'char-hung',
      text: 'Tôi có thể cung cấp bản sao báo cáo thật. Đó là bằng chứng mạnh nhất anh có thể có.' },
  ],

  'hung-cornered': [
    { speaker: 'Hùng', portrait: 'char-hung',
      text: '[im lặng dài]\nTôi không nhận tiền. Tôi bị ép.\n\nGia đình tôi... thôi, không nói thêm nữa.' },
    { speaker: 'Hùng', portrait: 'char-hung',
      text: 'Hãy cẩn thận. Cả hai.' },
  ],

  'thang-agree': [
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: 'Đúng vậy. Tư duy đúng đắn. Sau khi tốt nghiệp, ghé tìm tôi — công ty cần người như cậu.' },
  ],

  'thang-push': [
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: 'Lý thuyết hay lắm. Nhưng người nghèo không sống được bằng "hệ sinh thái".\n\nCậu còn trẻ — chưa hiểu thực tế.' },
  ],

  'thang-expose': [
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: '...' },
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: 'Cậu cẩn thận với những gì cậu nghĩ mình biết.' },
    { speaker: '{name}',
      text: '[nhìn thẳng]\nTôi biết đủ rồi.' },
  ],

  // ── CẢNH 2.5: HIÊN NHÀ AMA K'NƠI — BUỔI SÁNG ────────────────────────
  'c2s5-intro': [
    { speaker: 'Ama K\'Nơi', portrait: 'char-amaknoi',
      text: 'Ngồi xuống đã. Rừng sáng nay kể gì với hai đứa bây?' },
  ],

  'c2s5-post-tea': [
    { speaker: '{name}',
      text: 'Ama... chúng con thấy dấu khảo sát, cọc đo đạc, cây bị đánh dấu hàng loạt. Và video phá rừng ở Tà Lài. Con nghĩ đây là chuẩn bị cho dự án thủy điện.' },
    { speaker: 'Ama K\'Nơi', portrait: 'char-amaknoi',
      text: 'K\'Brơi. Mày biết rồi phải không? Biết từ trước khi nó đến đây.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Con biết từ tháng trước.' },
    { speaker: 'Ama K\'Nơi', portrait: 'char-amaknoi',
      text: 'Sao không nói với ông?' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Vì người làm chuyện này... con quen.' },
    { speaker: 'Ama K\'Nơi', portrait: 'char-amaknoi',
      text: '[lặng lẽ đặt chén trà xuống]' },
  ],

  // ── CẢNH 2.6: PHƠI BÀY — SỰ THẬT VỀ HÙNG ───────────────────────────
  'c2s6-pre-flashlight': [
    { speaker: 'Dẫn chuyện',
      text: 'K\'Brơi kể lại điều cậu đã thấy — một tháng trước, trong rừng đêm...' },
  ],

  'c2s6-post-flashlight': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Người làm sai lệch báo cáo hiện trạng rừng cho đội của ông Thắng...\n\nLà anh Hùng.' },
    { speaker: '{name}',
      text: 'Hùng — kiểm lâm viên Hùng? Người hay ghé qua nhà ông không?' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Đúng. Cha con và anh Hùng từng học chung. Anh ấy quen gia đình con từ nhỏ.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Anh Hùng có con nhỏ. Vợ đang bệnh. Ông Thắng trả nhiều tiền.\n\n[giọng trầm xuống]\nCon không biết phải làm gì.' },
    { speaker: 'Ama K\'Nơi', portrait: 'char-amaknoi',
      text: 'Rừng không phán xét con người. Rừng chỉ ghi nhớ. Ghi nhớ tất cả.' },
  ],

  // ── CẢNH 2.7: ÔNG THẮNG XUẤT HIỆN ───────────────────────────────────
  'c2s7-thang': [
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: 'Cậu là sinh viên du lịch — người K\'Brơi đề cập phải không? Tôi là Thắng. Giám đốc điều hành phân khu.' },
    { speaker: '{name}',
      text: 'Ông đang... phát triển khu vực này theo hướng nào ạ?' },
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: 'Thủy điện. Cung cấp điện và việc làm cho hàng chục nghìn hộ dân vùng sâu. Đây là bước tiến văn minh mà khu vực này đang cần.' },
    { speaker: '{name}',
      text: 'Còn rừng? Còn người Mạ đang sống ở đây?' },
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: 'Cậu còn trẻ thật. Tiến bộ và bảo tồn không phải lúc nào cũng chống nhau. Tái định cư có hỗ trợ. Rừng phòng hộ vẫn giữ. Còn những khu bị tác động — đó là cái giá của văn minh.\n\n200 héc-ta rừng đổi lấy điện cho hàng vạn người — đó là đánh đổi xứng đáng.' },
    { speaker: 'Dẫn chuyện',
      text: '{name} nhìn ông Thắng.\n\nKhông thấy ánh mắt kẻ xấu. Chỉ thấy ánh mắt người hoàn toàn tin vào điều mình đang nói.' },
    { speaker: '{name}',
      text: '',
      choices: [
        { text: '"Ông nói đúng. Phát triển kinh tế là quan trọng nhất."',
          trust: -25, score: 0, next: 'thang-agree', decision: 'agree_thang' },
        { text: '"Hệ sinh thái nuôi sống cả vùng. Phá đi — hậu quả lâu dài ra sao?"',
          trust: 10, score: 100, next: 'thang-push', decision: 'question_thang' },
        { text: '"Tôi có bằng chứng về hoạt động khảo sát trái phép trong vùng lõi."',
          trust: 15, score: 180, next: 'thang-expose', decision: 'confront_thang' },
      ],
    },
  ],

  // ── CẢNH 2.8: BỊ MUA CHUỘC ───────────────────────────────────────────
  'c2s8-bribe': [
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: 'Thuận. Tôi biết cậu chụp ảnh trong rừng hôm qua.' },
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: 'Nghe này. Cậu muốn nghiên cứu phát triển bền vững? Tôi tài trợ luận văn. Đủ kinh phí cho cậu đi thực địa quốc tế.' },
    { speaker: '{name}',
      text: 'Đổi lại là...?' },
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: 'Đổi lại là cậu không lan truyền thông tin chưa kiểm chứng.\n\nGây hoang mang dư luận là tội nặng. Cậu còn trẻ — đừng để một quyết định dại dột phá nát tương lai.',
      choices: [
        { text: 'Được thôi, tôi đồng ý.',
          score: 10, trust: -25, next: 'bribe-accept', decision: 'bribe_accept' },
        { text: 'Ông nhầm người rồi.',
          score: 50, trust: -5, next: 'bribe-refuse', decision: 'bribe_refuse' },
        { text: 'Nếu dự án hợp lệ — ông sợ gì ở thông tin đó?',
          score: 100, trust: 10, next: 'bribe-question', decision: 'bribe_question' },
      ],
    },
  ],

  'bribe-accept': [
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: 'Quyết định khôn ngoan.' },
    { speaker: 'Dẫn chuyện',
      text: '{name} gật đầu.\n\nBên ngoài cửa sổ, rừng vẫn đứng đó — không biết gì về thỏa thuận vừa xong.' },
  ],

  'bribe-refuse': [
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: '[giọng lạnh hơn] Cậu sẽ hối hận.' },
    { speaker: '{name}',
      text: '[quay đi] Có thể.' },
  ],

  'bribe-question': [
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: '...\n\n[ngừng lâu]\n\nCậu thông minh hơn tôi nghĩ.' },
    { speaker: 'Nguyễn Văn Thắng', portrait: 'char-thang',
      text: 'Nhưng thông minh thôi chưa đủ để thắng ở đây, cậu ạ.' },
  ],

  // ── CẢNH 2.9: LAN XUẤT HIỆN ──────────────────────────────────────────
  'c2s9-lan': [
    { speaker: 'Lan', portrait: 'char-lan',
      text: 'Tôi là Lan — kiểm lâm viên. Tôi biết những gì anh và K\'Brơi đã làm hai ngày qua. Muốn giúp — nhưng mình cần hệ thống hóa lại.' },
    { speaker: '{name}',
      text: 'Chị biết về dự án này từ trước à?' },
    { speaker: 'Lan', portrait: 'char-lan',
      text: 'Biết. Nhưng tôi thiếu bằng chứng thực địa — đúng cái anh đang có. Còn anh thiếu dữ liệu khoa học — đúng cái tôi có.\n\nMình cần nhau.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Tôi tin chị Lan.' },
    { speaker: 'Dẫn chuyện',
      text: 'Lan trao cho {name} một USB và bản báo cáo sinh thái dày. Rồi biến mất — đi làm phần của mình.' },
  ],

  'c2s9-lan-warned': [
    { speaker: 'Lan', portrait: 'char-lan',
      text: 'Tôi là Lan — kiểm lâm viên. Tôi biết những gì anh và K\'Brơi đã làm hai ngày qua. Muốn giúp — nhưng mình cần hệ thống hóa lại.' },
    { speaker: '{name}',
      text: 'Chị biết về dự án này từ trước à?' },
    { speaker: 'Lan', portrait: 'char-lan',
      text: 'Biết. Nhưng tôi thiếu bằng chứng thực địa — đúng cái anh đang có. Còn anh thiếu dữ liệu khoa học — đúng cái tôi có. Mình cần nhau.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Tôi tin chị Lan.' },
    { speaker: 'Lan', portrait: 'char-lan',
      text: 'À — nếu anh đã nói gì với ông Thắng tối qua... tôi không cần biết. Nhưng từ giờ hãy cẩn thận hơn.' },
    { speaker: 'Dẫn chuyện',
      text: 'Lan trao cho {name} một USB và bản báo cáo sinh thái dày. Rồi biến mất — đi làm phần của mình.' },
  ],

  // ── CẢNH 2.10: HÙNG THÚ NHẬN — ĐỈNH ĐIỂM CẢM XÚC ───────────────────
  'c2s10-hung': [
    { speaker: 'Hùng', portrait: 'char-hung',
      text: 'Thuận... tôi biết cậu đã biết rồi.' },
    { speaker: '{name}',
      text: '...' },
    { speaker: 'Hùng', portrait: 'char-hung',
      text: 'Tôi không muốn làm chuyện này. Nhưng vợ tôi bệnh nặng. Tiền chữa trị tôi không có.\n\nÔng Thắng đưa ra số tiền đủ để lo cho cô ấy hai năm. Tôi không đủ mạnh để từ chối.' },
    { speaker: 'Hùng', portrait: 'char-hung',
      text: 'Tôi biết cha K\'Brơi. Anh ấy là người tốt. Cậu bé cũng vậy.\n\n[giọng vỡ ra]\nTôi không biết làm gì nữa, Thuận.' },
    { speaker: 'Dẫn chuyện',
      text: 'K\'Brơi đứng sau cánh cửa. Cậu nghe hết. Và không bước vào.' },
    { speaker: '{name}',
      text: '',
      choices: [
        { text: '[Kiên nhẫn] "Anh có thể tin tôi. Nói hết đi — tôi không ép anh làm gì cả."',
          trust: 10, score: 80, next: 'hung-confess', decision: 'hung_trust' },
        { text: '[Thẳng thắn] "Anh biết mình đã sai. Thì giờ làm điều đúng đi."',
          trust: -5, score: 50, next: 'hung-cornered', decision: 'hung_confront' },
      ],
    },
  ],

  // ── CẢNH 2.11: TIỄN BIỆT & KẾT CHƯƠNG ───────────────────────────────
  'c2s11-farewell': [
    { speaker: 'Ama K\'Nơi', portrait: 'char-amaknoi',
      text: 'Con à. Ông hỏi một câu thôi.\n\nCon về thành phố — con mang theo gì?' },
    { speaker: '{name}',
      text: 'Con... con mang theo sự thật, Ama.' },
    { speaker: 'Ama K\'Nơi', portrait: 'char-amaknoi',
      text: 'Thì mang cho đúng chỗ.' },
    { speaker: 'Dẫn chuyện',
      text: 'K\'Brơi đứng sau Ama K\'Nơi. Không nói gì.\n\nChỉ nhìn {name} — lần đầu tiên ánh mắt không còn cảnh giác.' },
  ],

  // ══════════════════════════════════════════════════════════════════════
  // CÁC KẾT THÚC
  // ══════════════════════════════════════════════════════════════════════

  // 🔴 Kết thúc Đỏ — Phơi bày sự thật
  'ending-good': [
    { speaker: 'Lan', portrait: 'char-lan',
      text: 'Nhờ bằng chứng anh thu thập được, chúng tôi đủ cơ sở tố cáo chính thức. Dự án thủy điện bị đình chỉ điều tra.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Rừng vẫn còn đó. Làng Mạ vẫn còn đó.\n\nĐó là điều quan trọng nhất.' },
    { speaker: '{name}',
      text: 'Luận văn của tôi bây giờ không còn là học thuật nữa. Nó là câu chuyện thật.' },
    { speaker: 'Ama K\'Nơi', portrait: 'char-amaknoi',
      text: 'Rừng không kết thúc ở một chiến thắng. Nó cần người có tâm đứng bên nó mỗi ngày.\n\nCảm ơn con.' },
  ],

  // 🟡 Kết thúc Vàng — Thỏa hiệp
  'ending-neutral': [
    { speaker: 'Lan', portrait: 'char-lan',
      text: 'Ông Thắng đồng ý để chuyên gia độc lập thẩm định lại. Dự án bị thu hẹp 60%. Làng người Mạ được bảo vệ.' },
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Tôi không chắc đây là đủ. Nhưng rừng vẫn còn đứng.' },
    { speaker: '{name}',
      text: 'Tôi sẽ trở lại. Lần này không phải để viết luận văn.' },
    { speaker: 'Dẫn chuyện',
      text: 'Không có câu trả lời hoàn hảo. Đôi khi bảo tồn là nghệ thuật của điều có thể làm được.' },
  ],

  // ⚫ Kết thúc Đen — Im lặng
  'ending-bad': [
    { speaker: 'K\'Brơi', portrait: 'char-kbroi',
      text: 'Dự án được thông qua. Họ sẽ bắt đầu xây vào mùa khô.' },
    { speaker: '{name}',
      text: '...' },
    { speaker: 'Ama K\'Nơi', portrait: 'char-amaknoi',
      text: 'Đây không phải lần đầu rừng bị đe dọa. Và cũng sẽ không phải lần cuối.\n\nQuan trọng là con đã học được gì.' },
    { speaker: 'Dẫn chuyện',
      text: 'Im lặng cũng là một lựa chọn. Và là một trách nhiệm.' },
  ],
};

/** Thay thế placeholder {name} bằng tên người chơi */
export function formatText(text: string, playerName: string): string {
  return text.replace(/\{name\}/g, playerName);
}
