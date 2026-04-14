export interface PlantChoice {
  text: string;
  wrong?: string; // consequence text if wrong
}

export interface Plant {
  id: string;
  name: string;
  scientific: string;
  description: string;
  color: number;          // foliage tint for procedural drawing
  leafShape: 'wide' | 'narrow' | 'round';
  choices: PlantChoice[];
  correct: number;        // index into choices[]
  fact: string;           // educational fact shown after correct answer
}

export const PLANTS: Plant[] = [
  {
    id: 'bep',
    name: 'Rau Bép',
    scientific: 'Gnetum gnemon',
    description: 'Cây leo thân gỗ, lá bầu dục bóng mượt, xanh đậm. Mọc phổ biến ven suối trong rừng Cát Tiên.',
    color: 0x2a7a2a,
    leafShape: 'wide',
    choices: [
      { text: '🌿 Dùng làm rau ăn (lá non nấu canh, xào)' },
      { text: '💊 Sắc uống chữa sốt rét', wrong: 'Rau bép không có công dụng thuốc sốt rét — dùng sai gây vô ích, mất thời gian quý báu!' },
      { text: '🪵 Vót cọc làm bẫy thú', wrong: 'Cây leo mềm, không đủ cứng để làm cọc. Và đặt bẫy là vi phạm pháp luật!' },
    ],
    correct: 0,
    fact: 'Rau bép là nguồn dinh dưỡng thiết yếu của người Mạ qua nhiều thế hệ. Lá non chứa protein và canxi cao.',
  },
  {
    id: 'can-dai',
    name: 'Cần Dại',
    scientific: 'Oenanthe javanica',
    description: 'Cây thảo mọc ven suối, lá xẻ nhỏ như cần tây, mùi thơm dịu đặc trưng.',
    color: 0x5ab85a,
    leafShape: 'narrow',
    choices: [
      { text: '🌿 Ăn sống như rau thơm kèm cơm', wrong: 'Không sai, nhưng không phải công dụng quan trọng nhất!' },
      { text: '💊 Chữa sốt, hạ nhiệt, giảm thấp khớp' },
      { text: '🎨 Nhuộm màu vải truyền thống', wrong: 'Cần dại không có sắc tố nhuộm vải. Nhầm loài rồi!' },
    ],
    correct: 1,
    fact: 'Người Mạ dùng cần dại như kháng sinh tự nhiên để hạ sốt cho trẻ em và người già khi chưa có bệnh viện.',
  },
  {
    id: 'mat-ca',
    name: 'Mặt Cắt',
    scientific: 'Barringtonia acutangula',
    description: 'Cây gỗ trung bình, hoa đỏ buông thành chùm dài, hạt góc cạnh hình đa diện đặc biệt.',
    color: 0x8b4513,
    leafShape: 'round',
    choices: [
      { text: '🌸 Hái hoa ăn như rau', wrong: 'Hoa mặt cắt có độc! Ăn vào gây buồn nôn, khó thở.' },
      { text: '💊 Chiết xuất hạt diệt ký sinh trùng đường ruột' },
      { text: '🪵 Lấy gỗ đóng bàn ghế', wrong: 'Gỗ mặt cắt mềm, không bền — không phù hợp làm đồ nội thất.' },
    ],
    correct: 1,
    fact: 'Người Mạ dùng hạt mặt cắt nghiền thành bột chữa giun sán — một dạng thuốc tẩy giun tự nhiên hiệu quả.',
  },
];
