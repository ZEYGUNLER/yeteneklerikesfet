export interface MapNode {
  id: string;
  emoji: string;
  label: string;
  type: 'start' | 'safe' | 'risky' | 'key' | 'gate' | 'treasure' | 'deadend';
  connections: string[];
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
}

export interface MapDefinition {
  name: string;
  subtitle: string;
  hint: string;
  nodes: MapNode[];
}

// ── WORLD 1: KAYIP ADA (Basit planlama, tuzak yok) ──
// Kurallar: En az 5 düğüm, 1 Karar Noktası (>2 bağlantı), en az 2 geçerli rota.
export const WORLD_1_MAPS: MapDefinition[] = [
  { // Round 1
    name: '🏝️ Kayıp Ada (Bölüm 1)', subtitle: 'Maceraya başla!', hint: 'Hazineye giden iki farklı yol var, birini seç.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 20, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Mercan Koyu', type: 'safe', connections: ['A', 'D', 'E'], x: 45, y: 30 },
      { id: 'C', emoji: '🌴', label: 'Eski İskele', type: 'safe', connections: ['A', 'E'], x: 45, y: 70 },
      { id: 'D', emoji: '🌴', label: 'Kayıp Kamp', type: 'safe', connections: ['B', 'F'], x: 65, y: 20 },
      { id: 'E', emoji: '🌴', label: 'Fısıldayan Palmiye', type: 'safe', connections: ['B', 'C', 'F'], x: 65, y: 50 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['D', 'E'], x: 85, y: 50 },
    ]
  },
  { // Round 2
    name: '🏝️ Kayıp Ada (Bölüm 2)', subtitle: 'Geniş Kumsal.', hint: 'Bazı yollar daha uzun olabilir.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 15, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Sessiz Sahil', type: 'safe', connections: ['A', 'D'], x: 35, y: 25 },
      { id: 'C', emoji: '🌴', label: 'Kaplumbağa Kayası', type: 'safe', connections: ['A', 'E'], x: 35, y: 75 },
      { id: 'D', emoji: '🌴', label: 'Kuş Yuvası', type: 'safe', connections: ['B', 'E', 'F'], x: 60, y: 25 },
      { id: 'E', emoji: '🌴', label: 'Güneşli Tepe', type: 'safe', connections: ['C', 'D', 'F'], x: 60, y: 75 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['D', 'E'], x: 85, y: 50 },
    ]
  },
  { // Round 3
    name: '🏝️ Kayıp Ada (Bölüm 3)', subtitle: 'Ormanın İçi.', hint: 'Birbirine bağlı orman yolları.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Yeşil Vadi', type: 'safe', connections: ['A', 'D', 'E'], x: 30, y: 30 },
      { id: 'C', emoji: '🌴', label: 'Çamurlu Patika', type: 'safe', connections: ['A', 'E', 'G'], x: 30, y: 70 },
      { id: 'D', emoji: '🌴', label: 'Büyük Çınar', type: 'safe', connections: ['B', 'F'], x: 55, y: 15 },
      { id: 'E', emoji: '🌴', label: 'Gölge Geçit', type: 'safe', connections: ['B', 'C', 'F'], x: 55, y: 50 },
      { id: 'G', emoji: '🌴', label: 'Sarmaşık Düğümü', type: 'safe', connections: ['C', 'F'], x: 55, y: 85 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['D', 'E', 'G'], x: 85, y: 50 },
    ]
  },
  { // Round 4
    name: '🏝️ Kayıp Ada (Bölüm 4)', subtitle: 'Terk Edilmiş Köy.', hint: 'Merkezden mi yoksa kıyıdan mı gideceksin?',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Yıkık Köprü', type: 'safe', connections: ['A', 'C', 'D', 'E'], x: 35, y: 50 },
      { id: 'C', emoji: '🌴', label: 'Kuzey Kulesi', type: 'safe', connections: ['B', 'F'], x: 60, y: 20 },
      { id: 'D', emoji: '🌴', label: 'Köy Meydanı', type: 'safe', connections: ['B', 'F'], x: 60, y: 50 },
      { id: 'E', emoji: '🌴', label: 'Güney Surları', type: 'safe', connections: ['B', 'F'], x: 60, y: 80 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['C', 'D', 'E'], x: 85, y: 50 },
    ]
  },
  { // Round 5
    name: '🏝️ Kayıp Ada (Bölüm 5)', subtitle: 'Nehir Ağzı.', hint: 'Köprüler birbirine çıkıyor.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Taş Geçit', type: 'safe', connections: ['A', 'D'], x: 30, y: 20 },
      { id: 'C', emoji: '🌴', label: 'Çamurlu Su', type: 'safe', connections: ['A', 'E'], x: 30, y: 80 },
      { id: 'D', emoji: '🌴', label: 'Kuru Ağaç', type: 'safe', connections: ['B', 'G', 'E'], x: 55, y: 30 },
      { id: 'E', emoji: '🌴', label: 'Yosunlu Kaya', type: 'safe', connections: ['C', 'G', 'D'], x: 55, y: 70 },
      { id: 'G', emoji: '🌴', label: 'Gizli Mağara', type: 'safe', connections: ['D', 'E', 'F'], x: 75, y: 50 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['G'], x: 90, y: 50 },
    ]
  },
  { // Round 6
    name: '🏝️ Kayıp Ada (Bölüm 6)', subtitle: 'Büyük Çember.', hint: 'Dolaşmak bazen daha güvenlidir.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Kesişim Noktası', type: 'safe', connections: ['A', 'C', 'D'], x: 30, y: 50 },
      { id: 'C', emoji: '🌴', label: 'Kuzey Yamacı', type: 'safe', connections: ['B', 'E'], x: 50, y: 20 },
      { id: 'D', emoji: '🌴', label: 'Güney Yamacı', type: 'safe', connections: ['B', 'E'], x: 50, y: 80 },
      { id: 'E', emoji: '🌴', label: 'Doğu Ucu', type: 'safe', connections: ['C', 'D', 'F'], x: 70, y: 50 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['E'], x: 90, y: 50 },
    ]
  },
  { // Round 7
    name: '🏝️ Kayıp Ada (Bölüm 7)', subtitle: 'Kayalıklar.', hint: 'Kısa yol hangisi?',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Kartal Yuvası', type: 'safe', connections: ['A', 'D', 'E'], x: 35, y: 25 },
      { id: 'C', emoji: '🌴', label: 'Rüzgarlı Tepe', type: 'safe', connections: ['A', 'E'], x: 35, y: 75 },
      { id: 'D', emoji: '🌴', label: 'Sarp Kayalık', type: 'safe', connections: ['B', 'F'], x: 60, y: 15 },
      { id: 'E', emoji: '🌴', label: 'Otlu Düzlük', type: 'safe', connections: ['B', 'C', 'F'], x: 60, y: 60 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['D', 'E'], x: 85, y: 50 },
    ]
  },
  { // Round 8
    name: '🏝️ Kayıp Ada (Bölüm 8)', subtitle: 'Ormanın Çıkışı.', hint: 'Ada macerasının sonuna geliyorsun.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Son Vadi', type: 'safe', connections: ['A', 'D', 'E'], x: 35, y: 30 },
      { id: 'C', emoji: '🌴', label: 'Çamurlu Bataklık', type: 'safe', connections: ['A', 'E', 'F'], x: 35, y: 80 },
      { id: 'D', emoji: '🌴', label: 'Yüksek Tepe', type: 'safe', connections: ['B', 'F'], x: 65, y: 20 },
      { id: 'E', emoji: '🌴', label: 'Dar Geçit', type: 'safe', connections: ['B', 'C', 'F'], x: 65, y: 50 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['D', 'E', 'C'], x: 90, y: 50 },
    ]
  },
];

// ── WORLD 2: UNUTULMUŞ TAPINAK (Anahtar ve Kapı mekanikleri) ──
// Kurallar: En az 6 düğüm, 2 Karar Noktası, En az 2 yol, Anahtar ve Kapı. Anahtar çıkmaz olmamalı.
export const WORLD_2_MAPS: MapDefinition[] = [
  { // Round 1
    name: '🗝️ Unutulmuş Tapınak (Bölüm 1)', subtitle: 'Gizli Avlu.', hint: 'Anahtarı al ve kapıya yönel.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 15, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Tapınak Girişi', type: 'safe', connections: ['A', 'D', 'E'], x: 35, y: 25 },
      { id: 'C', emoji: '🌴', label: 'Taş Koridor', type: 'safe', connections: ['A', 'E'], x: 35, y: 75 },
      { id: 'D', emoji: '🔑', label: 'Altın Anahtar', type: 'key', connections: ['B', 'G'], x: 55, y: 15 },
      { id: 'E', emoji: '🌴', label: 'Sarmaşıklı Sütun', type: 'safe', connections: ['B', 'C', 'G'], x: 55, y: 60 },
      { id: 'G', emoji: '🚪', label: 'Gümüş Kapı', type: 'gate', connections: ['D', 'E', 'F'], x: 75, y: 40 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['G'], x: 90, y: 40 },
    ]
  },
  { // Round 2
    name: '🗝️ Unutulmuş Tapınak (Bölüm 2)', subtitle: 'Sütunlar Arası.', hint: 'İki anahtar yolu var, ikisi de kapıya çıkar.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Işıklı Avlu', type: 'safe', connections: ['A', 'D', 'E'], x: 30, y: 25 },
      { id: 'C', emoji: '🌴', label: 'Karanlık Avlu', type: 'safe', connections: ['A', 'E'], x: 30, y: 75 },
      { id: 'D', emoji: '🔑', label: 'Paslı Anahtar', type: 'key', connections: ['B', 'G'], x: 55, y: 15 },
      { id: 'E', emoji: '🔑', label: 'Parlak Anahtar', type: 'key', connections: ['B', 'C', 'G'], x: 55, y: 60 },
      { id: 'G', emoji: '🚪', label: 'Devasa Kapı', type: 'gate', connections: ['D', 'E', 'F'], x: 75, y: 40 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['G'], x: 90, y: 40 },
    ]
  },
  { // Round 3
    name: '🗝️ Unutulmuş Tapınak (Bölüm 3)', subtitle: 'Anahtar Odası.', hint: 'Ortadaki odaya girip anahtarı al.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Kuzey Geçidi', type: 'safe', connections: ['A', 'D', 'E'], x: 30, y: 20 },
      { id: 'C', emoji: '🌴', label: 'Güney Geçidi', type: 'safe', connections: ['A', 'D', 'G'], x: 30, y: 80 },
      { id: 'D', emoji: '🔑', label: 'Merkez Odası', type: 'key', connections: ['B', 'C', 'E', 'G'], x: 50, y: 50 },
      { id: 'E', emoji: '🚪', label: 'Kuzey Kapısı', type: 'gate', connections: ['B', 'D', 'F'], x: 70, y: 25 },
      { id: 'G', emoji: '🚪', label: 'Güney Kapısı', type: 'gate', connections: ['C', 'D', 'F'], x: 70, y: 75 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['E', 'G'], x: 90, y: 50 },
    ]
  },
  { // Round 4
    name: '🗝️ Unutulmuş Tapınak (Bölüm 4)', subtitle: 'Kadim Heykel.', hint: 'Heykelin etrafından dolan.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Heykel Meydanı', type: 'safe', connections: ['A', 'C', 'D'], x: 30, y: 50 },
      { id: 'C', emoji: '🔑', label: 'Bronz Anahtar', type: 'key', connections: ['B', 'E'], x: 50, y: 20 },
      { id: 'D', emoji: '🌴', label: 'Gizli Merdiven', type: 'safe', connections: ['B', 'G'], x: 50, y: 80 },
      { id: 'E', emoji: '🌴', label: 'Üst Teras', type: 'safe', connections: ['C', 'G', 'F'], x: 70, y: 30 },
      { id: 'G', emoji: '🚪', label: 'Ağır Kapı', type: 'gate', connections: ['D', 'E', 'F'], x: 70, y: 70 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['E', 'G'], x: 90, y: 50 },
    ]
  },
  { // Round 5
    name: '🗝️ Unutulmuş Tapınak (Bölüm 5)', subtitle: 'Labirent Girişi.', hint: 'Yolları birleştirerek ilerle.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Yüksek Duvar', type: 'safe', connections: ['A', 'D', 'E'], x: 30, y: 25 },
      { id: 'C', emoji: '🌴', label: 'Alçak Duvar', type: 'safe', connections: ['A', 'E'], x: 30, y: 75 },
      { id: 'D', emoji: '🔑', label: 'Çelik Anahtar', type: 'key', connections: ['B', 'G'], x: 55, y: 15 },
      { id: 'E', emoji: '🌴', label: 'İç Avlu', type: 'safe', connections: ['B', 'C', 'G'], x: 55, y: 60 },
      { id: 'G', emoji: '🚪', label: 'Demir Kapı', type: 'gate', connections: ['D', 'E', 'F'], x: 75, y: 40 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['G'], x: 90, y: 40 },
    ]
  },
  { // Round 6
    name: '🗝️ Unutulmuş Tapınak (Bölüm 6)', subtitle: 'Çifte Kapı.', hint: 'Bir anahtar, iki kapıyı da açar.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🔑', label: 'Büyülü Anahtar', type: 'key', connections: ['A', 'D', 'E'], x: 30, y: 50 },
      { id: 'C', emoji: '🌴', label: 'Yıkık Yol', type: 'safe', connections: ['A', 'E'], x: 30, y: 85 },
      { id: 'D', emoji: '🚪', label: 'Kuzey Geçidi', type: 'gate', connections: ['B', 'F'], x: 60, y: 25 },
      { id: 'E', emoji: '🚪', label: 'Güney Geçidi', type: 'gate', connections: ['B', 'C', 'G'], x: 60, y: 75 },
      { id: 'G', emoji: '🌴', label: 'Sunağın Arkası', type: 'safe', connections: ['E', 'F'], x: 75, y: 75 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['D', 'G'], x: 90, y: 50 },
    ]
  },
  { // Round 7
    name: '🗝️ Unutulmuş Tapınak (Bölüm 7)', subtitle: 'Gizli Mahzen.', hint: 'Mahzene girmek için doğru anahtarı bul.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Taş Merdiven', type: 'safe', connections: ['A', 'D', 'E'], x: 35, y: 20 },
      { id: 'C', emoji: '🌴', label: 'Gölgeli Koridor', type: 'safe', connections: ['A', 'E'], x: 35, y: 70 },
      { id: 'D', emoji: '🔑', label: 'Mahzen Anahtarı', type: 'key', connections: ['B', 'G'], x: 55, y: 20 },
      { id: 'E', emoji: '🌴', label: 'Heykel Odası', type: 'safe', connections: ['B', 'C', 'G'], x: 55, y: 70 },
      { id: 'G', emoji: '🚪', label: 'Mahzen Kapısı', type: 'gate', connections: ['D', 'E', 'F'], x: 75, y: 45 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['G'], x: 90, y: 45 },
    ]
  },
  { // Round 8
    name: '🗝️ Unutulmuş Tapınak (Bölüm 8)', subtitle: 'Kralın Hazinesi.', hint: 'Son odaya ulaşmak için plan yap.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Kraliyet Holü', type: 'safe', connections: ['A', 'D', 'E'], x: 30, y: 20 },
      { id: 'C', emoji: '🌴', label: 'Hizmetçi Yolu', type: 'safe', connections: ['A', 'E'], x: 30, y: 80 },
      { id: 'D', emoji: '🔑', label: 'Kralın Anahtarı', type: 'key', connections: ['B', 'G'], x: 55, y: 20 },
      { id: 'E', emoji: '🌴', label: 'Muhafız Odası', type: 'safe', connections: ['B', 'C', 'G'], x: 55, y: 80 },
      { id: 'G', emoji: '🚪', label: 'Taht Kapısı', type: 'gate', connections: ['D', 'E', 'F'], x: 75, y: 50 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['G'], x: 90, y: 50 },
    ]
  },
];

// ── WORLD 3: EJDERHANIN HAZİNESİ (Tuzaklar ve Tehlikeler) ──
// Kurallar: En az 7 düğüm, 2 Karar Noktası, En az 2 yol, Tehlike (risky/deadend) içerir.
export const WORLD_3_MAPS: MapDefinition[] = [
  { // Round 1
    name: '🐉 Ejderhanın Hazinesi (Bölüm 1)', subtitle: 'Ejder Geçidi.', hint: 'Volkandan uzak dur!',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌋', label: 'Ateş Çukuru', type: 'risky', connections: ['A', 'E'], x: 35, y: 20 },
      { id: 'C', emoji: '🌴', label: 'Güvenli Kaya', type: 'safe', connections: ['A', 'D', 'E'], x: 35, y: 80 },
      { id: 'D', emoji: '🌴', label: 'Sarkıt Mağarası', type: 'safe', connections: ['C', 'F'], x: 60, y: 80 },
      { id: 'E', emoji: '🌴', label: 'Obsidiyen Yol', type: 'safe', connections: ['B', 'C', 'G'], x: 60, y: 40 },
      { id: 'G', emoji: '🌴', label: 'Kül Zemin', type: 'safe', connections: ['E', 'F'], x: 75, y: 40 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['D', 'G'], x: 90, y: 60 },
    ]
  },
  { // Round 2
    name: '🐉 Ejderhanın Hazinesi (Bölüm 2)', subtitle: 'Lav Köprüsü.', hint: 'Köprülerin bazıları kırık!',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Sağlam Köprü', type: 'safe', connections: ['A', 'D', 'E'], x: 30, y: 25 },
      { id: 'C', emoji: '🌴', label: 'Taş Sütun', type: 'safe', connections: ['A', 'E'], x: 30, y: 75 },
      { id: 'D', emoji: '🪨', label: 'Kırık Köprü', type: 'deadend', connections: ['B'], x: 50, y: 15 },
      { id: 'E', emoji: '🌴', label: 'Isınan Kayalar', type: 'safe', connections: ['B', 'C', 'G'], x: 50, y: 60 },
      { id: 'G', emoji: '🌴', label: 'Volkanik Zemin', type: 'safe', connections: ['E', 'F', 'H'], x: 70, y: 60 },
      { id: 'H', emoji: '🌴', label: 'Dar Geçit', type: 'safe', connections: ['G', 'F'], x: 80, y: 25 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['G', 'H'], x: 90, y: 50 },
    ]
  },
  { // Round 3
    name: '🐉 Ejderhanın Hazinesi (Bölüm 3)', subtitle: 'Sisli Uçurum.', hint: 'Timsahlara yem olmadan anahtarı al.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🐊', label: 'Timsah Havuzu', type: 'risky', connections: ['A', 'E'], x: 30, y: 20 },
      { id: 'C', emoji: '🌴', label: 'Güvenli Kenar', type: 'safe', connections: ['A', 'D', 'E'], x: 30, y: 80 },
      { id: 'D', emoji: '🔑', label: 'Kristal Anahtar', type: 'key', connections: ['C', 'E', 'G'], x: 55, y: 80 },
      { id: 'E', emoji: '🌴', label: 'Uçurum Kenarı', type: 'safe', connections: ['B', 'C', 'D', 'G'], x: 55, y: 40 },
      { id: 'G', emoji: '🚪', label: 'Ateş Kapısı', type: 'gate', connections: ['D', 'E', 'F'], x: 75, y: 60 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['G'], x: 90, y: 60 },
    ]
  },
  { // Round 4
    name: '🐉 Ejderhanın Hazinesi (Bölüm 4)', subtitle: 'Tuzaklı Odalar.', hint: 'Çıkmaz sokaklar zaman kaybettirir.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Kuzey Odası', type: 'safe', connections: ['A', 'D', 'E'], x: 30, y: 20 },
      { id: 'C', emoji: '🌴', label: 'Güney Odası', type: 'safe', connections: ['A', 'E'], x: 30, y: 80 },
      { id: 'D', emoji: '🪨', label: 'Kilitli Zindan', type: 'deadend', connections: ['B'], x: 50, y: 10 },
      { id: 'E', emoji: '🌴', label: 'Geniş Avlu', type: 'safe', connections: ['B', 'C', 'G', 'H'], x: 50, y: 50 },
      { id: 'H', emoji: '🌴', label: 'Gizli Yol', type: 'safe', connections: ['E', 'F'], x: 75, y: 80 },
      { id: 'G', emoji: '🌴', label: 'Büyük Salon', type: 'safe', connections: ['E', 'F'], x: 75, y: 30 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['G', 'H'], x: 90, y: 50 },
    ]
  },
  { // Round 5
    name: '🐉 Ejderhanın Hazinesi (Bölüm 5)', subtitle: 'Kadim Hazine Salonu.', hint: 'Kısa yol tuzaklıdır!',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌋', label: 'Sıcak Lav', type: 'risky', connections: ['A', 'G'], x: 40, y: 50 },
      { id: 'C', emoji: '🌴', label: 'Yan Duvar', type: 'safe', connections: ['A', 'D'], x: 30, y: 85 },
      { id: 'D', emoji: '🌴', label: 'Sütun Arkası', type: 'safe', connections: ['C', 'E'], x: 50, y: 85 },
      { id: 'E', emoji: '🌴', label: 'Karanlık Köşe', type: 'safe', connections: ['D', 'F', 'H'], x: 70, y: 85 },
      { id: 'H', emoji: '🌴', label: 'Hazine Merdiveni', type: 'safe', connections: ['E', 'F'], x: 80, y: 70 },
      { id: 'G', emoji: '🌴', label: 'Kırık Heykel', type: 'safe', connections: ['B', 'F'], x: 70, y: 30 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['E', 'G', 'H'], x: 90, y: 50 },
    ]
  },
  { // Round 6
    name: '🐉 Ejderhanın Hazinesi (Bölüm 6)', subtitle: 'Ölümcül Labirent.', hint: 'Doğru kapı ve doğru anahtar.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Üst Geçit', type: 'safe', connections: ['A', 'D', 'E'], x: 30, y: 20 },
      { id: 'C', emoji: '🌴', label: 'Alt Geçit', type: 'safe', connections: ['A', 'E'], x: 30, y: 80 },
      { id: 'D', emoji: '🔑', label: 'Yakut Anahtar', type: 'key', connections: ['B', 'G', 'H'], x: 50, y: 20 },
      { id: 'E', emoji: '🐊', label: 'Timsah Yatağı', type: 'risky', connections: ['B', 'C', 'G'], x: 55, y: 60 },
      { id: 'H', emoji: '🌴', label: 'Gizli Sütun', type: 'safe', connections: ['D', 'G'], x: 65, y: 15 },
      { id: 'G', emoji: '🚪', label: 'Ateşli Kapı', type: 'gate', connections: ['D', 'E', 'H', 'F'], x: 75, y: 40 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['G'], x: 90, y: 40 },
    ]
  },
  { // Round 7
    name: '🐉 Ejderhanın Hazinesi (Bölüm 7)', subtitle: 'Kül Mağarası.', hint: 'İçeride çok fazla yol ayrımı var.',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Kül Tepesi', type: 'safe', connections: ['A', 'D', 'E'], x: 30, y: 25 },
      { id: 'C', emoji: '🌴', label: 'Çamur Havuzu', type: 'safe', connections: ['A', 'E'], x: 30, y: 75 },
      { id: 'D', emoji: '🪨', label: 'Göçük', type: 'deadend', connections: ['B'], x: 50, y: 10 },
      { id: 'E', emoji: '🌴', label: 'Mağara Merkezi', type: 'safe', connections: ['B', 'C', 'G', 'H'], x: 50, y: 50 },
      { id: 'G', emoji: '🌴', label: 'Aydınlık Tünel', type: 'safe', connections: ['E', 'F'], x: 75, y: 25 },
      { id: 'H', emoji: '🌴', label: 'Gizli Tünel', type: 'safe', connections: ['E', 'F'], x: 75, y: 75 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['G', 'H'], x: 90, y: 50 },
    ]
  },
  { // Round 8
    name: '🐉 Ejderhanın Hazinesi (Bölüm 8)', subtitle: 'Obsidiyen Kapı.', hint: 'Büyük Kaşif, tüm zorlukları aşabilir!',
    nodes: [
      { id: 'A', emoji: '🧒', label: 'Başlangıç', type: 'start', connections: ['B', 'C'], x: 10, y: 50 },
      { id: 'B', emoji: '🌴', label: 'Son Geçit', type: 'safe', connections: ['A', 'D', 'E'], x: 25, y: 25 },
      { id: 'C', emoji: '🌴', label: 'Korku Yolu', type: 'safe', connections: ['A', 'E', 'H'], x: 25, y: 80 },
      { id: 'H', emoji: '🌋', label: 'Patlayan Dağ', type: 'risky', connections: ['C'], x: 45, y: 85 },
      { id: 'D', emoji: '🔑', label: 'Ejder Anahtarı', type: 'key', connections: ['B', 'G'], x: 45, y: 15 },
      { id: 'E', emoji: '🌴', label: 'Güvenli Çukur', type: 'safe', connections: ['B', 'C', 'G'], x: 50, y: 50 },
      { id: 'G', emoji: '🚪', label: 'Obsidiyen Kapı', type: 'gate', connections: ['D', 'E', 'F', 'I'], x: 70, y: 40 },
      { id: 'I', emoji: '🌴', label: 'Alt Teras', type: 'safe', connections: ['G', 'F'], x: 80, y: 70 },
      { id: 'F', emoji: '🎁', label: 'Hazine', type: 'treasure', connections: ['G', 'I'], x: 90, y: 50 },
    ]
  },
];

export function getMapForRound(worldIndex: number, roundIndex: number): MapDefinition {
  const maps = worldIndex === 1 ? WORLD_1_MAPS : worldIndex === 2 ? WORLD_2_MAPS : WORLD_3_MAPS;
  const index = Math.max(0, Math.min(maps.length - 1, roundIndex - 1));
  return maps[index];
}
