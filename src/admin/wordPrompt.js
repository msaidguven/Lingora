// admin/wordPrompt.js
// Kelime ekleme için kullanılan AI promptu. WordManagement.jsx bu dosyadan import eder.
// Seviye admin panelinde seçilir; prompt o seviyeye göre üretilir.

export const WORD_LEVELS = ["A1", "A2", "B1", "B2", "C1"];

export const buildWordPrompt = (level = "A1") => `Aşağıdaki kelimeleri analiz et. SADECE JSON array döndür, başka hiçbir şey yazma.

Her kelime için:
- 5 adet örnek cümle üret (examples array'i içinde)

EN ÖNEMLİ KURAL - SEVİYE KURALI (diğer bütün kurallardan önce gelir):
Cümlenin seviyesi kelimenin seviyesiyle AYNI olmalı. Kelime A1 ise 5 cümlenin 5'i de A1 seviyesinde olmalı; A2 ise A2, B1 ise B1 vb. Cümle, kelimenin seviyesinden ZOR olamaz.
Seviye sadece hedef kelimeye göre değil, cümlenin TAMAMINA göre belirlenir: hedef kelime dışındaki her kelime, zaman ve yapı da o seviyede (veya daha kolay) olmalı.
Seviyelere göre sınırlar:
- A1: Kısa cümle (en fazla 8-10 kelime), tek yüklem, yan cümle yok. Sadece am/is/are, geniş zaman (present simple), şimdiki zaman (present continuous), can/can't, there is/there are; geçmiş zaman olarak yalnızca was/were. Hedef kelime dışındaki kelimeler en temel günlük kelimeler olsun (aile, ev, okul, yemek, renk, sayı, zaman, hobi, vücut, hava). Deyim, mecaz, phrasal verb (get up, look at gibi çok temel olanlar hariç), "would/should/have been/if" gibi yapılar YOK. Bağlamlar somut ve günlük olsun (ev, okul, aile, yemek, alışveriş, hobi); iş, teknoloji, siyaset gibi soyut bağlamlar yok.
- A2: En fazla 12 kelime civarı. A1'e ek olarak: geçmiş zaman (simple past), going to, basit will, karşılaştırma (bigger, more beautiful), "and/but/because/when" ile bağlanmış en fazla iki kısa cümlecik, çok yaygın phrasal verb'ler.
- B1: A2'ye ek olarak: present perfect, birinci tip if (if + present, will), who/which/that ile yan cümle, should/must/have to, yaygın phrasal verb ve kalıplar.
- B2 ve C1: Seviyeye uygun her yapı serbest; doğal ve gerçekçi cümleler.
Kendi kendini kontrol et: Her cümleyi yazdıktan sonra sor: "Bu seviyedeki bir öğrenci, hedef kelime dışında bu cümlede tanımadığı bir kelime ya da yapı görür mü?" Görürse cümleyi basitleştir.
Çeşitlilik kuralları seviye kuralının önüne GEÇEMEZ: Aşağıdaki çeşitlilik maddelerinden biri seviyeye uymayan bir zaman, yapı, deyim veya bağlam gerektiriyorsa o maddeyi atla ya da seviyeye uygun en basit haliyle uygula.

ÖNEMLİ - ÇEŞİTLİLİK KURALI:
5 cümle birbirinin varyasyonu OLMAMALI. Her biri farklı bir kullanım alanını göstermeli. Cümleleri üretirken şu kontrol listesini uygula (hepsi seviye kuralına uyarak):
1. Cümle yapısı çeşitliliği: en az biri olumlu, en az biri olumsuz, en az biri soru cümlesi olsun. Zaman açısından da çeşitlendir ama YALNIZCA seviyenin izin verdiği zamanları kullan (A1'de sadece geniş zaman, şimdiki zaman, can ve was/were).
2. Bağlam çeşitliliği: 5 cümle farklı günlük hayat bağlamlarından gelsin - aynı bağlamı iki kez kullanma. Bağlamları seviyeye uygun seç (A1'de ev, okul, aile, yemek, alışveriş, hobi gibi somut bağlamlar).
3. Özne çeşitliliği: her cümlede aynı özneyi (ör. hep "I" veya hep "she") kullanma, öznelerin de bir kısmı farklı olsun (I, you, he/she, we, they, isim vb.).
4. Kelimenin birden fazla anlamı/kullanımı varsa (ör. hem fiil hem isim, ya da farklı bağlamlarda farklı anlam), bunlardan en az ikisini ayrı cümlelerde göster - ama sadece o anlam da aynı seviyedeyse. Kelimenin sadece tek ve en sık kullanılan anlamı varsa ya da diğer anlamı daha ileri seviyedeyse bu maddeyi atla.
5. Kalıp/deyim çeşitliliği: kelime yaygın bir kalıp veya deyimin parçasıysa (phrasal verb, sabit ifade vb.) ve bu kalıp aynı seviyedeyse en az birini örnek cümlelerden birinde göster. Kalıp daha ileri seviyedeyse bu maddeyi atla.
Kısacası: 5 cümleyi yan yana okuyunca "hepsi aynı kalıbın kopyası" hissi vermemeli; her biri farklı bir şey öğretmeli - ama hepsi kelimenin seviyesinde kalmalı.

- Her cümle için Türkçe çeviri de ekle (en ve tr olarak)
- Her cümle için level belirt; bu değer kelimenin level değeriyle AYNI olmalı
- Her cümle için learning_notes array'i ekle: cümledeki önemli gramer yapısı, kalıp, deyim veya kullanım inceliğini açıklayan 1-2 kısa not (Türkçe). İngilizce öğrenmeye çalışan birisi için yardımcı olacak açıklamalar; kelime ve kullanım alanı, ayrıca neden ve niçin böyle kullanıldığı vb.
- Doğru json formatında ver, parse ederken hata olmasın.

kelimenin diğer anlamlarını virgül ile ayır.
bu verdiğim kelimeler ${level} seviyesinde. Her kelimenin level değeri ve 5 örnek cümlenin her birinin level değeri ${level} olmalı; cümleleri yukarıdaki ${level} sınırlarına göre yaz.
Eğer verilen kelimelerin anlamı verilmişse ama eksik yada hata varsa düzelt. önce en çok kullanılan anlamını ver.
örnek: "run" kelimesi için: "koşmak, çalıştırmak, işletmek"

[
  {
    "word": "kelime",
    "meaning": "türkçe anlam (birden fazla ise virgülle ayır)",
    "level": "${level}",
    "type": "word",
    "part_of_speech": ["noun", "verb", "adjective", "adverb"],
    "category": ["daily", "business", "travel", "food", "emotion", "health", "technology", "education", "social"],
    "difficulty": 1,
    "synonyms": ["eş1", "eş2"],
    "antonyms": ["zıt1", "zıt2"],
    "examples": [
      {"en": "English sentence 1 (context A, affirmative)", "tr": "Türkçe çeviri 1", "level": "${level}", "learning_notes": ["not1", "not2"]},
      {"en": "English sentence 2 (context B, negative or different subject)", "tr": "Türkçe çeviri 2", "level": "${level}", "learning_notes": []},
      {"en": "English sentence 3 (context C, question form)", "tr": "Türkçe çeviri 3", "level": "${level}", "learning_notes": []},
      {"en": "English sentence 4 (context D, different tense/meaning)", "tr": "Türkçe çeviri 4", "level": "${level}", "learning_notes": []},
      {"en": "English sentence 5 (context E, idiom/phrasal use if applicable)", "tr": "Türkçe çeviri 5", "level": "${level}", "learning_notes": []}
    ]
  }
]

Kelimeler: `;
// Veritabanındaki (cümlesi henüz olmayan) kelimeler için hazır prompt. Kelimeler listeden
// gelen anlamlarıyla gönderilir; AI önce anlamı kontrol eder (meaning_ok / meaning_note),
// sonra 5 cümle üretir. Yanlış/eksik bulunan anlam doğrudan yazılmaz: admin
// "Anlam Onayı" panelinde karar verir.
export const MEANING_CHECK_RULES = `

ANLAM KONTROLÜ (cümlelerden ÖNCE yap):
Her kelimenin yanında bir kelime listesinden gelen "mevcut anlam" var. Bu anlamlar otomatik sözlükten alındı; yanlış, eksik, nadir/eski anlamlarla dolu ya da hatalı olabilir.
1. Kelimenin bu seviyedeki bir öğrenci için doğru ve yeterli Türkçe anlamlarını belirle: en çok kullanılan anlam önce, virgülle ayrılmış, en fazla 4 anlam. Nadir, eski, argo ya da çok teknik anlamları alma.
2. Mevcut anlam doğru ve yeterliyse: "meaning_ok": true, "meaning" alanına mevcut anlamı AYNEN yaz, "meaning_note": "".
3. Mevcut anlam yanlış, eksik, hatalı ya da gereksiz/nadir anlamlar içeriyorsa: "meaning_ok": false, "meaning" alanına SENİN önerdiğin doğru anlamı yaz, "meaning_note" alanına neyin yanlış olduğunu Türkçe tek kısa cümleyle yaz (ör. "'hayvan' sıfat olarak işaretlenmiş; 'konservelemek' nadir anlam, çıkarıldı").
4. Cümleleri senin belirlediğin doğru anlama göre üret.
Her kelime nesnesinde "meaning_ok" ve "meaning_note" alanları MUTLAKA olsun:
{ "word": "...", "meaning": "...", "meaning_ok": false, "meaning_note": "...", "level": "...", ... diğer alanlar ve examples aynı ... }

`;

export const buildPromptForWords = (level, words) =>
  buildWordPrompt(level).replace(/Kelimeler: $/, "") +
  MEANING_CHECK_RULES +
  "Kelimeler:\n" +
  words.map((w) => `${w.word} (mevcut anlam: ${w.meaning || "?"})`).join("\n");
