// admin/wordPrompt.js
// Kelime ekleme için kullanılan AI promptu. WordManagement.jsx bu dosyadan import eder.

export const WORD_PROMPT_TEXT = `Aşağıdaki kelimeleri analiz et. SADECE JSON array döndür, başka hiçbir şey yazma.

Her kelime için:
- 5 adet örnek cümle üret (examples array'i içinde)
- Bu cümleler kelimenin seviyesine (A1, A2, B1, B2, C1) uygun olsun
- A1 ise tamamen A1 seviyesinde 5 cümle, A2 ise A2 seviyesinde 5 cümle vb.

ÇOK ÖNEMLİ - ÇEŞİTLİLİK KURALI:
5 cümle birbirinin varyasyonu OLMAMALI. Her biri farklı bir kullanım alanını göstermeli. Cümleleri üretirken şu kontrol listesini uygula:
1. Cümle yapısı çeşitliliği: en az biri olumlu, en az biri olumsuz, en az biri soru cümlesi olsun. Zaman açısından da çeşitlendir (şimdiki zaman, geçmiş zaman, gelecek/niyet ifadesi vb. - seviyeye uygun olanları kullan).
2. Bağlam çeşitliliği: 5 cümle 5 farklı günlük hayat bağlamından gelsin (ör. ev, iş/okul, sosyal ortam, seyahat, duygular/sağlık, alışveriş, teknoloji) - aynı bağlamı iki kez kullanma.
3. Özne çeşitliliği: her cümlede aynı özneyi (ör. hep "I" veya hep "she") kullanma, öznelerin de bir kısmı farklı olsun (I, you, he/she, we, they, isim vb.).
4. Kelimenin birden fazla anlamı/kullanımı varsa (ör. hem fiil hem isim, ya da farklı bağlamlarda farklı anlam), bunlardan en az ikisini ayrı cümlelerde göster. Kelimenin sadece tek ve en sık kullanılan anlamı varsa bu maddeyi atla.
5. Kalıp/deyim çeşitliliği: kelime yaygın bir kalıp veya deyimin parçasıysa (phrasal verb, sabit ifade vb.) bunlardan en az birini örnek cümlelerden birinde göster.
Kısacası: 5 cümleyi yan yana okuyunca "hepsi aynı kalıbın kopyası" hissi vermemeli; her biri farklı bir şey öğretmeli.

- Her cümle için Türkçe çeviri de ekle (en ve tr olarak)
- Her cümle için level belirt (A1, A2, B1, B2, C1)
- Her cümle için learning_notes array'i ekle: cümledeki önemli gramer yapısı, kalıp, deyim veya kullanım inceliğini açıklayan 1-2 kısa not (Türkçe). İngilizce öğrenmeye çalışan birisi için yardımcı olacak açıklamalar; kelime ve kullanım alanı, ayrıca neden ve niçin böyle kullanıldığı vb.
- Doğru json formatında ver, parse ederken hata olmasın.

kelimenin diğer anlamlarını virgül ile ayır.
bu verdiğim kelimeler A1 seviyesinde.
Eğer verilen kelimelerin anlamı verilmişse ama eksik yada hata varsa düzelt. önce en çok kullanılan anlamını ver.
örnek: "run" kelimesi için: "koşmak, çalıştırmak, işletmek"

[
  {
    "word": "kelime",
    "meaning": "türkçe anlam (birden fazla ise virgülle ayır)",
    "level": "A1",
    "type": "word",
    "part_of_speech": ["noun", "verb", "adjective", "adverb"],
    "category": ["daily", "business", "travel", "food", "emotion", "health", "technology", "education", "social"],
    "difficulty": 1,
    "synonyms": ["eş1", "eş2"],
    "antonyms": ["zıt1", "zıt2"],
    "examples": [
      {"en": "English sentence 1 (context A, affirmative)", "tr": "Türkçe çeviri 1", "level": "A1", "learning_notes": ["not1", "not2"]},
      {"en": "English sentence 2 (context B, negative or different subject)", "tr": "Türkçe çeviri 2", "level": "A1", "learning_notes": []},
      {"en": "English sentence 3 (context C, question form)", "tr": "Türkçe çeviri 3", "level": "A1", "learning_notes": []},
      {"en": "English sentence 4 (context D, different tense/meaning)", "tr": "Türkçe çeviri 4", "level": "A1", "learning_notes": []},
      {"en": "English sentence 5 (context E, idiom/phrasal use if applicable)", "tr": "Türkçe çeviri 5", "level": "A1", "learning_notes": []}
    ]
  }
]

Kelimeler: `;