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
          trust: 0, score: 5, next: 'choice 3', decision: 'gate_pushy' },
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

  // ── CÂY RỪNG / PLANTS ────────────────────────────────────────────────
  'plant-intro': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: '[chỉ vào cây] Cây cẩm lai này hơn trăm năm rồi, người ngoài nhìn vào thì thấy gỗ quý, còn tụi tôi quen coi nó như một phần của rừng nên không ai nghĩ tới chuyện chặt.' },
    { speaker: '{name}',
      text: 'Nhìn vậy mà ở đây vẫn để nó yên như vậy hoài luôn à, không ai từng muốn lấy nó về sao?' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Có chứ, ai cũng từng nghĩ qua thôi, nhưng rồi hiểu ra là có những thứ nếu mình lấy đi thì thứ mất không chỉ là cái cây, mà là cả phần rừng đã giữ nó ở đây từng ấy năm.' },
  ],

  // --- CẢNH 1.2: NHÀ BÀ YA K'BEN ---
  'scene_1_2': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Bà hỏi anh có ăn được cơm bếp củi không. Tôi nói có. Đúng không?' },
    { speaker: '{name}',
      text: 'Đúng, cảm ơn bà.' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'npc-yakben',
      text: '[cười] Ngồi đây đi cháu. Tay bà bận nhưng miệng còn rảnh.' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'npc-yakben',
      text: 'Du lịch. Khách đến, chụp ảnh, đi. Chưa ai hỏi mình hiểu họ cần gì không. Cháu hiểu người Mạ cần gì không?' },
    { speaker: '{name}',
      text: 'Thật ra... không. Đó là lý do cháu đến.' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'npc-yakben',
      text: 'Dệt không khó. Khó là giữ được đường may đều và chắc.' },
    { speaker: '{name}',
      text: 'Cháu phải làm thế nào?' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'npc-yakben',
      text: 'Nhìn tay bà. Đều tay, đều sợi. Đừng vội.' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'npc-yakben',
      text: '[gật đầu] Câu đó tốt hơn cái luận văn của cháu đó. Muốn học không? Tay rảnh thì làm cùng bà đi.',
      choices: [
        { text: 'May khoảng cách xa, có đoạn lỏng có đoạn chặt',
          trust: 0, score: 0, next: 'scene_1_2_sew_loose', decision: 'sew_loose' },
        { text: 'May khoảng cách tương đối đều, vẫn có một số chỗ có khoảng cách không bằng nhau.',
          trust: 0, score: 5, next: 'scene_1_2_sew_medium', decision: 'sew_medium' },
        { text: 'Nghe theo hướng dẫn của bà Yă K\'Ben, khoảng cách may đều, sợi chỉ giữ chặt từng lớp vải',
          trust: 0, score: 10, next: 'scene_1_2_sew_good', decision: 'sew_good' },
      ],
    },
  ],

  'scene_1_2_sew_loose' : [
    { speaker: 'Bà Yă K\'Ben', portrait: 'npc-kbroi',
      text: ' (cười nhẹ): Lệch nhịp rồi. Sợi lỏng, sợi chặt.' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'npc-kbroi',
      text: ' Lần đầu ai cũng vậy. Làm lại đi.' },
  ],
  'scene_1_2_sew_medium' : [
    { speaker: 'Bà Yă K\'Ben', portrait: 'npc-kbroi',
      text: ' Nhìn khá ổn đó, nhưng vẫn còn chỗ lệch. Phải chắc tay hơn.' },
  ],
  'scene_1_2_sew_good' : [
    { speaker: 'Bà Yă K\'Ben', portrait: 'npc-kbroi',
      text: ' Được rồi. Nhịp đều, sợi giữ chặt.' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'npc-kbroi',
      text: 'Làm vậy, vải mới bền. Hoa văn mới giữ được lâu.' },
  ],


  // --- 1.3 - Nhà bà YA KBEN 2 ---
  'forest_gathering': [
    { speaker: 'Bà Yă K\'Ben', portrait: 'npc-yakben',
      text: 'Đi vào rừng, hái giúp bà ít nguyên liệu để nhuộm vải.' },
    { speaker: '{name}',
      text: 'Cháu cần lấy những gì?' },
    { speaker: 'Bà Yă K\'Ben', portrait: 'npc-yakben',
      text: 'Miễn là để nhuộm vải là được, ta không kén chọn. Tuy nhiên, nhìn kĩ rồi chọn.' },
    { speaker: '{name}',
      text: 'Mình nên hái những cái gì đây?',
      choices: [
        { text: 'Củ nghệ và Lá cây giá tỵ',
          trust: 0, score: 10, next: 'gather_success', decision: 'gather_correct' },
        { text: 'Củ nghệ và Gõ đỏ',
          trust: 0, score: 10, next: 'gather_fail', decision: 'gather_wrong_1' },
        { text: 'Lá cây giá tỵ và Giáng hương',
          trust: 0, score: 0, next: 'gather_fail', decision: 'gather_wrong_2' },
        { text: 'Gõ đỏ và Giáng hương',
          trust: 0, score: 0, next: 'gather_fail', decision: 'gather_wrong_3' },
      ],
    },
  ],

  // 1.4 - Ven Rừng ---
  'scene_1_4': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: '[giọng thấp] Bẫy. Không phải người làng đặt. Còn mới.' },
    { speaker: '{name}',
      text: 'Mình có gỡ ra được không?' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Cẩn thận. Anh giữ thân nó, tôi gỡ dây.',
      choices: [
        { text: '[MINI-GAME: Gỡ bẫy cho hươu] - Ấn phím E đúng lúc',
          trust: 0, score: 15, next: 'scene_1_4_success', decision: 'trap_cleared' },
      ],
    },
  ],

  'scene_1_4_success': [
    { speaker: 'Dẫn chuyện',
      text: 'Sau khi gỡ, con hươu dừng lại ở mép bụi. Nhìn lại. Rồi biến mất.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Nó nhớ mặt người.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: '[nói nhỏ]: Không phải tôi nói. Ông tôi nói.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Từ đầu mùa khô đến nay tôi thấy 7 cái như thế này' },
    { speaker: '{name}',
      text: 'Anh báo kiểm lâm chưa?' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Rồi và không có gì xảy ra.' },
  ],

  // 1.5 - Góc rừng yên tĩnh ---
  'scene_1_5': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Bò tót xuống gần làng ban ngày, trong rừng đang có tiếng động làm nó sợ. [nhìn về rừng sâu] Cùng hướng với vết máy móc tuần trước.' },
    { speaker: '{name}',
      text: ' Anh đang nói có người đang làm gì đó trong rừng?' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: '[không trả lời] Anh chụp được ảnh bò tót là tốt. Lưu lại đi.' },
  ],

  // 1.6 - Nhà bà Ya K'Ben ---
  'scene_1_6': [
    { speaker: '{name}',
      text: 'Cái vết sơn đỏ trên cây — anh biết từ bao giờ?' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Hai tuần trước. Tôi đi kiểm tra một mình.' },
    { speaker: '{name}',
      text: 'Anh đã báo ai chưa?' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Kiểm lâm Hùng. Quen nhà này từ hồi tôi còn nhỏ. Ông ấy bảo để xem. Hai tuần. Không có gì. [ngừng] Tôi không biết ông ấy không làm được — hay không muốn làm.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: '[lần đầu tiên nhìn thẳng, không dò xét] Tôi cần ai đó không thuộc nơi này giữ bằng chứng. Người trong làng có thể bị ép. Anh thì không. [ngừng] Anh ở lại thêm được không?',
      choices: [
        { text: '"Tôi ở lại. Và tôi muốn hiểu hết chuyện đang xảy ra."',
          trust: 10, score: 25, next: 'choice_1_6_A', decision: 'stay_resolve' },
        { text: '"Tôi cần nghĩ thêm. Đây không phải việc của luận văn nữa rồi."',
          trust: 5, score: 10, next: 'choice_1_6_B', decision: 'stay_hesitant' },
      ],
    },
  ],

  'choice_1_6_A': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Ngủ sớm đi. Sáng mai 5h mình đi.' },
  ],

  'choice_1_6_B': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Đúng. Nếu anh không chắc — đừng ở lại. Nửa vời còn tệ hơn không làm.' },
    { speaker: 'Dẫn chuyện',
      text: 'Thuận một mình nhìn rừng đêm và quyết định ở lại.' },
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

  // ── CHƯƠNG 2 — CÁC CẢNH MỚI ─────────────────────────────────────────
  // Exact dialogue text from game design document (GAME C2.docx)

  // ── Cảnh 1: Thu Thập Manh Mối ──────────────────────────────────────
  'c2s1-intro': [
    { speaker: '{name}',
      text: 'K\'Brơi, hôm nay mình đi tuyến nào? Em cần ghi vào nhật ký thực địa.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Đứng lại.' },
    { speaker: '{name}',
      text: 'Dây đo khảo sát? Ai đo gì ở đây vậy?' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Câu hỏi đúng rồi đó.' },
  ],

  'c2s1-postgame': [
    { speaker: '{name}',
      text: 'Dây đo, GPS, dấu đánh cây… tất cả đều cùng một hướng. Đây không phải ngẫu nhiên.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Con đường này… trước đây không có.' },
    { speaker: '{name}',
      text: 'Nhưng trong hồ sơ Vườn Quốc gia cũng không có dự án nào ở đây.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Không có. Chính thức là vậy.' },
  ],

  // ── Cảnh 2: Chạy Trốn / Runner ─────────────────────────────────────
  'c2s2-intro': [
    { speaker: '{name}',
      text: 'K\'Brơi, tôi cần chụp cái cọc khảo sát kia—' },
    { speaker: 'Công nhân',
      text: 'Ê! Đứng lại! Mày là ai? Chụp gì ở đây?' },
  ],

  'c2s2-postgame': [
    { speaker: '{name}',
      text: 'Họ đang làm gì ở đây mà hung hăng vậy? Rừng quốc gia mà!' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Đó là lý do họ không muốn bị chụp ảnh.' },
    { speaker: '{name}',
      text: 'Mình cần thêm bằng chứng. Nhưng bây giờ họ biết mặt rồi.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Tối mình đi lại. Trong đêm — tôi không quen. Nhưng anh muốn không?' },
    { speaker: '{name}',
      text: 'Muốn.' },
  ],

  // ── Cảnh 3: Chụp Ảnh Bằng Chứng ───────────────────────────────────
  'c2s3-intro': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Đừng lại gần. Ghi lại những gì cần thiết thôi.' },
    { speaker: '{name}',
      text: 'Em sẽ chụp. Nhưng phải nhanh.' },
  ],

  'c2s3-postgame': [
    { speaker: '{name}',
      text: 'Có rồi… nhưng chưa đủ.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Chừng này… chỉ đủ để nghi ngờ.' },
  ],

  // ── Cảnh 4: Ẩn Náu & Di Chuyển Cẩn Thận ───────────────────────────
  'c2s4-intro': [
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Đặt gót xuống trước. Cảm nhận đất. Rồi mới đặt cả bàn chân.' },
    { speaker: '{name}',
      text: 'Như này à... nhẹ hơn rồi.' },
    { speaker: 'K\'Brơi', portrait: 'npc-kbroi',
      text: 'Đứng. Đừng thở mạnh.' },
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
